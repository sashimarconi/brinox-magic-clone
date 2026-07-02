
-- 1) abandoned_carts: drop overly permissive UPDATE policy
DROP POLICY IF EXISTS "Public can update abandoned carts safely" ON public.abandoned_carts;

-- 2) visitor_sessions: remove permissive anon read/update, add safe RPC
DROP POLICY IF EXISTS "Anon can read sessions for upsert" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Public can update visitor sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Public can insert visitor sessions" ON public.visitor_sessions;

CREATE OR REPLACE FUNCTION public.public_upsert_visitor_session(
  _session_id text,
  _user_id uuid,
  _page_url text DEFAULT NULL,
  _referrer text DEFAULT NULL,
  _country text DEFAULT NULL,
  _region text DEFAULT NULL,
  _city text DEFAULT NULL,
  _latitude numeric DEFAULT NULL,
  _longitude numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _session_id IS NULL OR _user_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.visitor_sessions AS vs
    (session_id, user_id, page_url, referrer, country, region, city, latitude, longitude, last_seen_at)
  VALUES
    (_session_id, _user_id, _page_url, _referrer, _country, _region, _city, _latitude, _longitude, now())
  ON CONFLICT (session_id) DO UPDATE
    SET page_url = COALESCE(EXCLUDED.page_url, vs.page_url),
        referrer = COALESCE(EXCLUDED.referrer, vs.referrer),
        country = COALESCE(EXCLUDED.country, vs.country),
        region = COALESCE(EXCLUDED.region, vs.region),
        city = COALESCE(EXCLUDED.city, vs.city),
        latitude = COALESCE(EXCLUDED.latitude, vs.latitude),
        longitude = COALESCE(EXCLUDED.longitude, vs.longitude),
        last_seen_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.public_upsert_visitor_session(text, uuid, text, text, text, text, text, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_upsert_visitor_session(text, uuid, text, text, text, text, text, numeric, numeric) TO anon, authenticated;

-- 3) checkout_settings / checkout_builder_config / product_page_builder_config:
--    scope public read to users with at least one active product.
DROP POLICY IF EXISTS "Checkout settings public read" ON public.checkout_settings;
CREATE POLICY "Public read checkout settings for active sellers"
  ON public.checkout_settings FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.user_id = checkout_settings.user_id AND p.active = true));

DROP POLICY IF EXISTS "Checkout builder config public read" ON public.checkout_builder_config;
CREATE POLICY "Public read checkout builder config for active sellers"
  ON public.checkout_builder_config FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.user_id = checkout_builder_config.user_id AND p.active = true));

DROP POLICY IF EXISTS "Product page builder config public read" ON public.product_page_builder_config;
CREATE POLICY "Public read product page builder config for active sellers"
  ON public.product_page_builder_config FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.user_id = product_page_builder_config.user_id AND p.active = true));

-- 4) custom_domains: drop broad public read; expose only verified domains and revoke the token column from anon
DROP POLICY IF EXISTS "Public can read custom domains base for view" ON public.custom_domains;
CREATE POLICY "Public read verified custom domains"
  ON public.custom_domains FOR SELECT TO anon
  USING (verified = true);
REVOKE SELECT ON public.custom_domains FROM anon;
GRANT SELECT (id, user_id, domain, verified, created_at, updated_at) ON public.custom_domains TO anon;

-- 5) tracking_pixels_public view -> security_invoker + policy on base table
ALTER VIEW public.tracking_pixels_public SET (security_invoker = on);
DROP POLICY IF EXISTS "Public can read active tracking pixels" ON public.tracking_pixels;
CREATE POLICY "Public can read active tracking pixels"
  ON public.tracking_pixels FOR SELECT TO anon
  USING (active = true);
-- Restrict anon to non-sensitive columns only (never access_token)
REVOKE SELECT ON public.tracking_pixels FROM anon;
GRANT SELECT (id, user_id, platform, pixel_id, active, fire_on_paid_only, created_at) ON public.tracking_pixels TO anon;

-- 6) storage: remove broad LIST access on product-images (bucket stays public for URL fetch)
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;

-- 7) Revoke EXECUTE from anon on SECURITY DEFINER functions (keep authenticated where user-facing)
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_daily_signups(integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_saas_metrics() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_user_details(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_user_block(uuid, boolean) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_orders(integer, integer, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_plan(uuid, plan_type) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_fee(uuid, numeric) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_user_products(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_analytics_summary(integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_daily_orders(integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.live_view_summary(timestamptz, timestamptz) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_financial_summary(date, date) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_financial_daily(date, date) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_product_profit_ranking(date, date) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.materialize_recurring_expenses(uuid, date, date) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_my_mfa_factors() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_my_mfa_factor(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_pix_copied(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_plan(uuid) FROM anon, PUBLIC;

-- Ensure authenticated retains explicit grants where needed
GRANT EXECUTE ON FUNCTION public.live_view_summary(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_financial_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_financial_daily(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_product_profit_ranking(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_my_mfa_factors() TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_my_mfa_factor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_pix_copied(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_orders(integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_products(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_block(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_plan(uuid, plan_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_fee(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_saas_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_daily_signups(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_daily_orders(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_analytics_summary(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan(uuid) TO authenticated;
