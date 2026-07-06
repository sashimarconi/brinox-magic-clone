-- Remove policy exposing verification_token
DROP POLICY IF EXISTS "Public read verified custom domains" ON public.custom_domains;

-- Remove policy exposing tracking pixel access_token
DROP POLICY IF EXISTS "Public can read active tracking pixels" ON public.tracking_pixels;

-- Tighten orders INSERT policy (was WITH CHECK true) - require product exists & active
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    product_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = orders.product_id AND p.active = true)
  );

-- Tighten abandoned_carts insert - require product_id (prevents PII flooding)
DROP POLICY IF EXISTS "Public can insert abandoned carts safely" ON public.abandoned_carts;
CREATE POLICY "Public can insert abandoned carts safely"
  ON public.abandoned_carts FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NOT NULL
    AND product_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = abandoned_carts.product_id
        AND p.user_id = abandoned_carts.user_id
        AND p.active = true
    )
  );

-- Revoke EXECUTE on SECURITY DEFINER functions from PUBLIC/anon/authenticated, grant only where needed
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated', r.proname, r.args);
  END LOOP;
END $$;

-- Public checkout flows
GRANT EXECUTE ON FUNCTION public.public_upsert_visitor_session(text, uuid, text, text, text, text, text, numeric, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_pix_copied(uuid) TO anon, authenticated;

-- End-user functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_my_mfa_factor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_my_mfa_factors() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_financial_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_financial_daily(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_product_profit_ranking(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.materialize_recurring_expenses(uuid, date, date) TO authenticated;

-- Admin functions (internal has_role gate)
GRANT EXECUTE ON FUNCTION public.admin_analytics_summary(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_daily_orders(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_daily_signups(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_all_products(integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_orders(integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_saas_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_block(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_top_sellers(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_fee(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_plan(uuid, plan_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_products(uuid) TO authenticated;