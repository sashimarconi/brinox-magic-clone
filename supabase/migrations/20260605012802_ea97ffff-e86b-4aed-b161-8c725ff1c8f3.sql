CREATE OR REPLACE FUNCTION public.live_view_summary(_today_start timestamptz, _live_cutoff timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _orders_count integer := 0;
  _paid_orders_count integer := 0;
  _revenue numeric := 0;
  _active_visitors integer := 0;
  _checkout_views integer := 0;
  _page_views integer := 0;
  _hourly jsonb := '[]'::jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object(
      'orders', 0,
      'paidOrders', 0,
      'revenue', 0,
      'visitors', 0,
      'checkoutViews', 0,
      'pageViews', 0,
      'avgTicket', 0,
      'conversionRate', 0,
      'hourlyData', '[]'::jsonb
    );
  END IF;

  SELECT
    count(*)::integer,
    count(*) FILTER (WHERE payment_status IN ('paid', 'approved'))::integer,
    coalesce(sum(total) FILTER (WHERE payment_status IN ('paid', 'approved')), 0)
  INTO _orders_count, _paid_orders_count, _revenue
  FROM public.orders
  WHERE user_id = _user_id
    AND created_at >= _today_start;

  SELECT count(DISTINCT session_id)::integer
  INTO _active_visitors
  FROM public.visitor_sessions
  WHERE user_id = _user_id
    AND last_seen_at >= _live_cutoff;

  SELECT
    count(*) FILTER (WHERE event_type = 'checkout_view')::integer,
    count(*) FILTER (WHERE event_type = 'page_view')::integer
  INTO _checkout_views, _page_views
  FROM public.page_events
  WHERE user_id = _user_id
    AND created_at >= _today_start;

  WITH hours AS (
    SELECT generate_series(0, 23) AS hour_num
  ), paid_by_hour AS (
    SELECT extract(hour FROM created_at)::integer AS hour_num, coalesce(sum(total), 0) AS value
    FROM public.orders
    WHERE user_id = _user_id
      AND created_at >= _today_start
      AND payment_status IN ('paid', 'approved')
    GROUP BY 1
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'hour', lpad(hours.hour_num::text, 2, '0') || 'h',
      'value', coalesce(paid_by_hour.value, 0)
    ) ORDER BY hours.hour_num
  )
  INTO _hourly
  FROM hours
  LEFT JOIN paid_by_hour USING (hour_num);

  RETURN jsonb_build_object(
    'orders', _orders_count,
    'paidOrders', _paid_orders_count,
    'revenue', _revenue,
    'visitors', _active_visitors,
    'checkoutViews', _checkout_views,
    'pageViews', _page_views,
    'avgTicket', CASE WHEN _paid_orders_count > 0 THEN _revenue / _paid_orders_count ELSE 0 END,
    'conversionRate', CASE WHEN _orders_count > 0 THEN (_paid_orders_count::numeric / _orders_count::numeric) * 100 ELSE 0 END,
    'hourlyData', coalesce(_hourly, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.live_view_summary(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_view_summary(timestamptz, timestamptz) TO service_role;