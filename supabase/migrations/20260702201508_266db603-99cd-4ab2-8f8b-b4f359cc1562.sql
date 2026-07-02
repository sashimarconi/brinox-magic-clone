
CREATE OR REPLACE FUNCTION public.user_financial_summary(_start date, _end date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _gross numeric := 0;
  _orders_paid bigint := 0;
  _gateway_fees numeric := 0;
  _product_costs numeric := 0;
  _expenses_total numeric := 0;
  _by_cat jsonb := '{}'::jsonb;
  _ads_total numeric := 0;
  _extra_revenue numeric := 0;
  _net numeric := 0;
  _margin numeric := 0;
  _avg_ticket numeric := 0;
  _roi numeric := 0;
  _cpa numeric := 0;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('gross_revenue',0,'total_orders_paid',0,'gateway_fees_total',0,'product_costs_total',0,'expenses_total',0,'expenses_by_category','{}'::jsonb,'extra_revenue',0,'ads_total',0,'net_profit',0,'margin_pct',0,'avg_ticket',0,'roi',0,'cpa',0);
  END IF;

  WITH paid AS (
    SELECT o.id, o.total, o.quantity, o.product_id,
           COALESCE(pc.unit_cost, 0) AS unit_cost,
           COALESCE(gs.fee_percent, 0) AS fee_percent
    FROM public.orders o
    LEFT JOIN public.product_costs pc ON pc.product_id = o.product_id AND pc.user_id = _uid
    LEFT JOIN public.gateway_settings gs ON gs.user_id = _uid AND gs.active = true AND lower(gs.gateway_name) = lower(COALESCE(o.payment_method, gs.gateway_name))
    WHERE o.user_id = _uid
      AND o.payment_status IN ('paid','approved')
      AND ((o.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN _start AND _end)
  )
  SELECT
    COALESCE(SUM(total),0),
    COUNT(*),
    COALESCE(SUM(total * fee_percent / 100.0),0),
    COALESCE(SUM(unit_cost * COALESCE(quantity,1)),0)
  INTO _gross, _orders_paid, _gateway_fees, _product_costs
  FROM paid;

  -- Fix: outer aggregation must reference the inner alias (cat_total), not raw "amount"
  SELECT COALESCE(SUM(cat_total),0),
         COALESCE(jsonb_object_agg(category, cat_total), '{}'::jsonb)
  INTO _expenses_total, _by_cat
  FROM (
    SELECT category, SUM(amount) AS cat_total
    FROM public.expenses
    WHERE user_id = _uid AND date BETWEEN _start AND _end
    GROUP BY category
  ) t;

  _ads_total := COALESCE((_by_cat->>'marketing_facebook')::numeric,0)
              + COALESCE((_by_cat->>'marketing_tiktok')::numeric,0)
              + COALESCE((_by_cat->>'marketing_google')::numeric,0);
  _extra_revenue := COALESCE((_by_cat->>'extra_revenue')::numeric,0);

  _expenses_total := _expenses_total - _extra_revenue;

  _net := _gross + _extra_revenue - _gateway_fees - _product_costs - _expenses_total;
  _margin := CASE WHEN _gross > 0 THEN (_net / _gross) * 100 ELSE 0 END;
  _avg_ticket := CASE WHEN _orders_paid > 0 THEN _gross / _orders_paid ELSE 0 END;
  _roi := CASE WHEN _ads_total > 0 THEN ((_gross - _ads_total) / _ads_total) * 100 ELSE 0 END;
  _cpa := CASE WHEN _orders_paid > 0 THEN _ads_total / _orders_paid ELSE 0 END;

  RETURN jsonb_build_object(
    'gross_revenue', _gross,
    'total_orders_paid', _orders_paid,
    'gateway_fees_total', _gateway_fees,
    'product_costs_total', _product_costs,
    'expenses_total', _expenses_total,
    'expenses_by_category', _by_cat,
    'extra_revenue', _extra_revenue,
    'ads_total', _ads_total,
    'net_profit', _net,
    'margin_pct', _margin,
    'avg_ticket', _avg_ticket,
    'roi', _roi,
    'cpa', _cpa
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.user_financial_summary(date, date) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_financial_summary(date, date) TO authenticated;
