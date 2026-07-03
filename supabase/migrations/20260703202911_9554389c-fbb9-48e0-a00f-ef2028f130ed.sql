CREATE OR REPLACE FUNCTION public.public_upsert_visitor_session(
  _session_id text,
  _user_id uuid,
  _page_url text DEFAULT NULL::text,
  _referrer text DEFAULT NULL::text,
  _country text DEFAULT NULL::text,
  _region text DEFAULT NULL::text,
  _city text DEFAULT NULL::text,
  _latitude numeric DEFAULT NULL::numeric,
  _longitude numeric DEFAULT NULL::numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _session_id IS NULL OR _session_id = '' OR _user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.visitor_sessions AS vs
    (session_id, user_id, page_url, country, region, city, latitude, longitude, last_seen_at)
  VALUES
    (_session_id, _user_id, _page_url, _country, _region, _city, _latitude::double precision, _longitude::double precision, now())
  ON CONFLICT (session_id) DO UPDATE
    SET page_url = COALESCE(EXCLUDED.page_url, vs.page_url),
        country = COALESCE(EXCLUDED.country, vs.country),
        region = COALESCE(EXCLUDED.region, vs.region),
        city = COALESCE(EXCLUDED.city, vs.city),
        latitude = COALESCE(EXCLUDED.latitude, vs.latitude),
        longitude = COALESCE(EXCLUDED.longitude, vs.longitude),
        last_seen_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.public_upsert_visitor_session(text, uuid, text, text, text, text, text, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_upsert_visitor_session(text, uuid, text, text, text, text, text, numeric, numeric) TO anon, authenticated, service_role;