import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isDialogWebhook(url: string): boolean {
  return /\/webhook-checkout\/universal\/|\/webhook-recovery\/universal\//i.test(url || "");
}

async function buildDialogPayload(supabase: any, event: string, payload: any): Promise<string> {
  const orderId = payload.order_id || payload.id;
  let order: any = null;
  let product: any = null;
  let store: any = null;

  if (orderId) {
    const { data: o } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    order = o;
  }
  const productId = order?.product_id || payload.product_id;
  if (productId) {
    const { data: p } = await supabase
      .from("products").select("id, title, sale_price, user_id").eq("id", productId).maybeSingle();
    product = p;
    const { data: sp } = await supabase
      .from("store_products").select("store_id").eq("product_id", productId).limit(1).maybeSingle();
    if (sp?.store_id) {
      const { data: s } = await supabase.from("stores").select("id, name").eq("id", sp.store_id).maybeSingle();
      store = s;
    }
  }

  const quantity = Number(order?.quantity ?? payload.quantity ?? 1) || 1;
  const total = Number(order?.total ?? payload.total ?? payload.amount ?? 0);
  const subtotal = Number(order?.subtotal ?? total);
  const unitPrice = quantity > 0 ? Number((subtotal / quantity).toFixed(2)) : subtotal;

  const productName = [
    product?.title || payload.product_title || "Produto",
    order?.product_variant || payload.product_variant,
  ].filter(Boolean).join(" - ");

  const products: any[] = [{ name: productName, quantity, price: unitPrice }];

  const bumps = order?.selected_bumps ?? payload.selected_bumps;
  if (Array.isArray(bumps)) {
    for (const b of bumps) {
      if (b && (b.name || b.title)) {
        const rawPrice = Number(b.price ?? b.sale_price ?? 0) || 0;
        const bumpPrice = Number((rawPrice / 100).toFixed(2));
        products.push({
          name: b.name || b.title,
          quantity: Number(b.quantity ?? 1) || 1,
          price: bumpPrice,
        });
      }
    }
  }

  const streetParts = [
    order?.customer_address || payload.customer_address,
    order?.customer_number || payload.customer_number,
    order?.customer_complement || payload.customer_complement,
  ].filter(Boolean);

  return JSON.stringify({
    order_id: orderId,
    status: event === "order_paid" ? "paid" : "pending",
    tracking_code: null,
    customer: {
      name: order?.customer_name || payload.customer_name || "",
      email: order?.customer_email || payload.customer_email || "",
      phone: order?.customer_phone || payload.customer_phone || "",
      cpf: (order?.customer_document || payload.customer_document || "").replace(/\D/g, ""),
    },
    address: {
      street: streetParts.join(", "),
      neighborhood: order?.customer_neighborhood || payload.customer_neighborhood || "",
      city: order?.customer_city || payload.customer_city || "",
      state: order?.customer_state || payload.customer_state || "",
      zip: (order?.customer_cep || payload.customer_cep || "").replace(/\D/g, ""),
    },
    products,
    amount: total,
    store_name: store?.name || "",
    store_cnpj: "",
    payment_method: order?.payment_method || payload.payment_method || "pix",
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { event, payload } = await req.json();
    if (!event || !payload) {
      return new Response(
        JSON.stringify({ error: "Missing event or payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Dispatching webhook event: ${event}`);

    const { data: webhooks, error } = await supabase
      .from("webhooks")
      .select("*")
      .eq("active", true);

    if (error) {
      console.error("Error fetching webhooks:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch webhooks" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const matching = (webhooks || []).filter((wh: any) => {
      const events = Array.isArray(wh.events) ? wh.events : [];
      return events.includes(event);
    });

    console.log(`Found ${matching.length} webhooks for event ${event}`);

    const buildXtrackyPayload = (evt: string, p: any) => {
      const status = evt === "order_paid" ? "paid" : "waiting_payment";
      const amountInCents = Math.round(Number(p.total || 0) * 100);
      const utm = p.utm_params || {};
      return {
        orderId: String(p.transaction_id || p.order_id),
        amount: amountInCents,
        status,
        utm_source: utm.utm_source ?? null,
      };
    };

    const results = await Promise.allSettled(
      matching.map(async (wh: any) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (wh.secret_key) {
          headers["X-Webhook-Secret"] = wh.secret_key;
        }

        const isXtracky = typeof wh.url === "string" && wh.url.includes("xtracky.com");
        const isDialog = typeof wh.url === "string" && isDialogWebhook(wh.url);

        let body: string;
        let formatTag = "";
        if (isDialog) {
          body = await buildDialogPayload(supabase, event, payload);
          formatTag = " [dialog-format]";
        } else if (isXtracky) {
          body = JSON.stringify(buildXtrackyPayload(event, payload));
          formatTag = " [xtracky-format]";
        } else {
          body = JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            data: payload,
          });
        }

        const response = await fetch(wh.url, {
          method: "POST",
          headers,
          body,
        });

        console.log(`Webhook ${wh.name} (${wh.url}): ${response.status}${formatTag}`);
        return { id: wh.id, name: wh.name, status: response.status };
      })
    );

    const summary = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { id: matching[i]?.id, name: matching[i]?.name, error: String(r.reason) };
    });

    return new Response(
      JSON.stringify({ success: true, event, dispatched: summary.length, results: summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Dispatch error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
