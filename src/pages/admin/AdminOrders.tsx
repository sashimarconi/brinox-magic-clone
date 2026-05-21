import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { OrderDetailsView } from "@/components/admin/orders/OrderDetailsView";
import { OrdersListView } from "@/components/admin/orders/OrdersListView";
import { getEffectiveStatus, isUuid, matchesDateFilter } from "@/components/admin/orders/order-utils";

import type { AdminOrderRecord, DateFilter, DateRange, OrderStats, StatusFilter } from "@/components/admin/orders/types";
import { supabase } from "@/integrations/supabase/client";

interface ProductSummary {
  id: string;
  title: string | null;
}

interface ShippingSummary {
  id: string;
  name: string | null;
}

interface VariantSummary {
  id: string;
  name: string;
}

const PAGE_SIZE = 1000;

// Colunas leves para a listagem — campos pesados (pix_qr_code, pix_qr_code_base64,
// pix_copy_paste, customer_user_agent) só são buscados ao abrir o detalhe.
const LIST_COLUMNS = [
  "id",
  "customer_name",
  "customer_email",
  "customer_phone",
  "customer_document",
  "customer_cep",
  "customer_address",
  "customer_number",
  "customer_complement",
  "customer_neighborhood",
  "customer_city",
  "customer_state",
  "payment_status",
  "payment_method",
  "total",
  "subtotal",
  "shipping_cost",
  "shipping_option_id",
  "bumps_total",
  "product_variant",
  "quantity",
  "transaction_id",
  "pix_expires_at",
  "paid_at",
  "created_at",
  "updated_at",
  "pix_copied",
  "product_id",
  "selected_bumps",
  "utm_params",
].join(", ");

const AdminOrders = () => {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    try {
      // Paginate through all orders to bypass the 1000-row default limit
      const allRows: AdminOrderRecord[] = [];
      let from = 0;
      while (from < 100000) {
        const { data, error } = await supabase
          .from("orders")
          .select(LIST_COLUMNS)
          .order("created_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        const batch = (data || []) as unknown as AdminOrderRecord[];
        allRows.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      const rows = allRows;
      const productIds = Array.from(new Set(rows.map((order) => order.product_id).filter((value): value is string => Boolean(value))));
      const shippingIds = Array.from(new Set(rows.map((order) => order.shipping_option_id).filter((value): value is string => Boolean(value))));
      const variantIds = Array.from(
        new Set(rows.map((order) => order.product_variant).filter((value): value is string => Boolean(value) && isUuid(value))),
      );

      const productPromise = productIds.length
        ? supabase
            .from("products")
            .select("id, title")
            .in("id", productIds)
            .then((result) => ({ data: (result.data || []) as ProductSummary[], error: result.error }))
        : Promise.resolve({ data: [] as ProductSummary[], error: null });

      const shippingPromise = shippingIds.length
        ? supabase
            .from("shipping_options")
            .select("id, name")
            .in("id", shippingIds)
            .then((result) => ({ data: (result.data || []) as ShippingSummary[], error: result.error }))
        : Promise.resolve({ data: [] as ShippingSummary[], error: null });

      const variantPromise = variantIds.length
        ? supabase
            .from("product_variants")
            .select("id, name")
            .in("id", variantIds)
            .then((result) => ({ data: (result.data || []) as VariantSummary[], error: result.error }))
        : Promise.resolve({ data: [] as VariantSummary[], error: null });

      const [productsResult, shippingResult, variantResult] = await Promise.all([
        productPromise,
        shippingPromise,
        variantPromise,
      ]);

      if (productsResult.error) throw productsResult.error;
      if (shippingResult.error) throw shippingResult.error;
      if (variantResult.error) throw variantResult.error;

      const productMap = new Map(productsResult.data.map((product) => [product.id, product.title]));
      const shippingMap = new Map(shippingResult.data.map((shipping) => [shipping.id, shipping.name]));
      const variantMap = new Map(variantResult.data.map((variant) => [variant.id, variant.name]));

      setOrders(
        rows.map((order) => ({
          ...order,
          product: order.product_id ? { title: productMap.get(order.product_id) ?? null } : null,
          shipping_option: order.shipping_option_id ? { name: shippingMap.get(order.shipping_option_id) ?? null } : null,
          variant_name: order.product_variant
            ? variantMap.get(order.product_variant) ?? (isUuid(order.product_variant) ? null : order.product_variant)
            : null,
        })),
      );
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast.error("Não foi possível carregar os pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const effectiveStatus = getEffectiveStatus(order);

        if (statusFilter !== "all" && effectiveStatus !== statusFilter) {
          return false;
        }

        if (!matchesDateFilter(order, dateFilter, dateRange)) {
          return false;
        }

        const normalizedSearch = search.trim().toLowerCase();
        if (!normalizedSearch) {
          return true;
        }

        const searchableValues = [
          order.id,
          order.customer_name,
          order.customer_email,
          order.customer_phone,
          order.customer_document,
          order.transaction_id,
          order.product?.title,
          order.variant_name,
          order.product_variant,
          order.shipping_option?.name,
        ];

        return searchableValues.some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
      }),
    [dateFilter, dateRange, orders, search, statusFilter],
  );

  const stats = useMemo<OrderStats>(
    () => ({
      total: orders.length,
      paid: orders.filter((order) => getEffectiveStatus(order) === "paid").length,
      pending: orders.filter((order) => getEffectiveStatus(order) === "pending").length,
      copied: orders.filter((order) => Boolean(order.pix_copied)).length,
    }),
    [orders],
  );

  const selectedOrderId = searchParams.get("order");

  // Quando um pedido é selecionado via URL, busca os dados completos (incl. pix_qr_code etc.)
  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const lightRow = orders.find((o) => o.id === selectedOrderId) ?? null;
      if (lightRow) setSelectedOrder(lightRow);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", selectedOrderId)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        if (!lightRow) {
          toast.error("Pedido não encontrado");
          const next = new URLSearchParams(searchParams);
          next.delete("order");
          setSearchParams(next);
        }
        return;
      }

      const enriched = data as unknown as AdminOrderRecord;
      setSelectedOrder({
        ...enriched,
        product: lightRow?.product ?? null,
        shipping_option: lightRow?.shipping_option ?? null,
        variant_name: lightRow?.variant_name ?? null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedOrderId, orders, searchParams, setSearchParams]);

  const openOrderDetails = (orderId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("order", orderId);
    setSearchParams(nextParams);
  };

  const closeOrderDetails = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("order");
    setSearchParams(nextParams);
  };

  if (selectedOrder) {
    return <OrderDetailsView order={selectedOrder} onBack={closeOrderDetails} onRefresh={fetchOrders} />;
  }

  return (
    <OrdersListView
      orders={orders}
      filteredOrders={filteredOrders}
      loading={loading}
      search={search}
      statusFilter={statusFilter}
      dateFilter={dateFilter}
      dateRange={dateRange}
      stats={stats}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      onDateFilterChange={setDateFilter}
      onDateRangeChange={setDateRange}
      onRefresh={fetchOrders}
      onSelectOrder={openOrderDetails}
    />
  );
};

export default AdminOrders;
