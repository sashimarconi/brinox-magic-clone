REVOKE EXECUTE ON FUNCTION public.live_view_summary(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.live_view_summary(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_view_summary(timestamptz, timestamptz) TO service_role;