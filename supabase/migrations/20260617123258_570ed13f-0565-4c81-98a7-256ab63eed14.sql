ALTER VIEW public.tracking_pixels_public SET (security_invoker = off);
GRANT SELECT ON public.tracking_pixels_public TO anon, authenticated;