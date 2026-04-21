import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, Bell } from "lucide-react";

// Som de caixa registradora (apenas para vendas APROVADAS)
function playCashRegisterSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playTone = (freq: number, start: number, duration: number, gain: number) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
      g.gain.setValueAtTime(gain, audioCtx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + start);
      osc.stop(audioCtx.currentTime + start + duration);
    };

    // "Tiktin" tipo caixa registradora
    playTone(2200, 0, 0.08, 0.3);
    playTone(2800, 0.1, 0.08, 0.3);
    playTone(3400, 0.2, 0.18, 0.28);
    playTone(2600, 0.42, 0.12, 0.22);
  } catch {
    // ignore audio errors
  }
}

// Bip discreto para PIX gerado
function playPendingSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
    g.gain.setValueAtTime(0.18, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch {
    // ignore
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function SaleNotification() {
  const seenPendingIds = useRef(new Set<string>());
  const seenPaidIds = useRef(new Set<string>());

  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      channel = supabase
        .channel(`admin-sale-notifications-${userId}`)
        // PIX gerado (INSERT) → "Venda Pendente"
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const order = payload.new as any;
            if (!order?.id || seenPendingIds.current.has(order.id)) return;
            seenPendingIds.current.add(order.id);

            playPendingSound();

            toast.custom(
              () => (
                <div className="flex items-center gap-3 bg-black/85 backdrop-blur-xl text-white rounded-xl px-4 py-3 shadow-2xl border border-amber-400/20 min-w-[280px]">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Venda Pendente</p>
                    <p className="text-xs text-white/60">PIX gerado • aguardando pagamento</p>
                    <p className="text-sm font-bold text-amber-400 mt-0.5">
                      {formatCurrency(Number(order.total) || 0)}
                    </p>
                  </div>
                </div>
              ),
              { duration: 6000, position: "top-right" }
            );
          }
        )
        // Pagamento confirmado (UPDATE → paid) → "Venda Aprovada" com som de caixa
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            const order = payload.new as any;
            const oldOrder = payload.old as any;
            if (!order?.id) return;
            // só dispara quando passou para "paid" (transição de status)
            if (order.payment_status !== "paid") return;
            if (oldOrder?.payment_status === "paid") return;
            if (seenPaidIds.current.has(order.id)) return;
            seenPaidIds.current.add(order.id);

            // Nome do gateway (decorativo)
            let gatewayName = "Gateway";
            try {
              const { data } = await supabase
                .from("gateway_settings")
                .select("gateway_name")
                .eq("active", true)
                .limit(1)
                .maybeSingle();
              if (data?.gateway_name) {
                const names: Record<string, string> = {
                  blackcatpay: "BlackCatPay",
                  ghostspay: "GhostsPay",
                  duck: "Duck",
                  hisounique: "Hiso Unique",
                  paradise: "Paradise",
                };
                gatewayName = names[data.gateway_name] || data.gateway_name;
              }
            } catch {}

            playCashRegisterSound();

            toast.custom(
              () => (
                <div className="flex items-center gap-3 bg-black/85 backdrop-blur-xl text-white rounded-xl px-4 py-3 shadow-2xl border border-emerald-400/20 min-w-[280px]">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Venda Aprovada</p>
                    <p className="text-xs text-white/60">via {gatewayName}</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">
                      Você recebeu {formatCurrency(Number(order.total) || 0)}
                    </p>
                  </div>
                </div>
              ),
              { duration: 7000, position: "top-right" }
            );
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
