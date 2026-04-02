import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanType, PlanInfo } from "@/lib/plans";

export interface PlanUsage {
  products: number;
  stores: number;
  pixels: number;
  webhooks: number;
  orderBumps: number;
  shippingOptions: number;
}

export function usePlanLimits() {
  const { data: userPlan, isLoading: planLoading } = useQuery({
    queryKey: ["user-plan"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("user_plans")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      return data;
    },
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["plan-usage"],
    queryFn: async () => {
      const [products, stores, pixels, webhooks, orderBumps, shippingOptions] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("tracking_pixels").select("id", { count: "exact", head: true }),
        supabase.from("webhooks").select("id", { count: "exact", head: true }),
        supabase.from("order_bumps").select("id", { count: "exact", head: true }),
        supabase.from("shipping_options").select("id", { count: "exact", head: true }),
      ]);

      return {
        products: products.count ?? 0,
        stores: stores.count ?? 0,
        pixels: pixels.count ?? 0,
        webhooks: webhooks.count ?? 0,
        orderBumps: orderBumps.count ?? 0,
        shippingOptions: shippingOptions.count ?? 0,
      } as PlanUsage;
    },
  });

  const planType: PlanType = (userPlan?.plan as PlanType) ?? "free";
  const plan: PlanInfo = PLANS[planType];

  const canCreate = (resource: keyof PlanUsage): boolean => {
    if (!usage) return true;
    return usage[resource] < plan.limits[resource];
  };

  const remaining = (resource: keyof PlanUsage): number => {
    if (!usage) return plan.limits[resource];
    return Math.max(0, plan.limits[resource] - usage[resource]);
  };

  return {
    plan,
    planType,
    userPlan,
    usage,
    isLoading: planLoading || usageLoading,
    canCreate,
    remaining,
    monthlyViewsUsed: userPlan?.monthly_views_used ?? 0,
    monthlyViewsLimit: plan.limits.monthlyViews,
  };
}
