
-- 1) gateway fee_percent
ALTER TABLE public.gateway_settings ADD COLUMN IF NOT EXISTS fee_percent numeric NOT NULL DEFAULT 0;

-- 2) product_costs
CREATE TABLE IF NOT EXISTS public.product_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  product_id uuid NOT NULL,
  unit_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_costs TO authenticated;
GRANT ALL ON public.product_costs TO service_role;
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manages product_costs" ON public.product_costs;
CREATE POLICY "Owner manages product_costs" ON public.product_costs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_product_costs_updated ON public.product_costs;
CREATE TRIGGER trg_product_costs_updated BEFORE UPDATE ON public.product_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  category text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_day integer,
  recurring_parent_id uuid REFERENCES public.expenses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_recurring_parent ON public.expenses(recurring_parent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manages expenses" ON public.expenses;
CREATE POLICY "Owner manages expenses" ON public.expenses
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_expenses_updated ON public.expenses;
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) financial_goals
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  month date NOT NULL,
  revenue_goal numeric NOT NULL DEFAULT 0,
  profit_goal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_goals TO authenticated;
GRANT ALL ON public.financial_goals TO service_role;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manages financial_goals" ON public.financial_goals;
CREATE POLICY "Owner manages financial_goals" ON public.financial_goals
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_financial_goals_updated ON public.financial_goals;
CREATE TRIGGER trg_financial_goals_updated BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) materialize_recurring_expenses
CREATE OR REPLACE FUNCTION public.materialize_recurring_expenses(_user_id uuid, _start date, _end date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent record;
  cur_month date;
  target_date date;
  last_day int;
  effective_day int;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  FOR parent IN
    SELECT * FROM public.expenses
    WHERE user_id = _user_id
      AND is_recurring = true
      AND recurring_parent_id IS NULL
      AND recurring_day IS NOT NULL
  LOOP
    cur_month := date_trunc('month', GREATEST(_start, parent.date))::date;
    WHILE cur_month <= _end LOOP
      last_day := EXTRACT(day FROM (date_trunc('month', cur_month) + interval '1 month - 1 day'))::int;
      effective_day := LEAST(parent.recurring_day, last_day);
      target_date := (date_trunc('month', cur_month) + ((effective_day - 1) || ' days')::interval)::date;

      IF target_date >= parent.date AND target_date <= _end THEN
        -- skip if parent itself is on this exact date
        IF target_date <> parent.date THEN
          IF NOT EXISTS (
            SELECT 1 FROM public.expenses
            WHERE recurring_parent_id = parent.id AND date = target_date
          ) THEN
            INSERT INTO public.expenses (user_id, date, category, description, amount, is_recurring, recurring_day, recurring_parent_id)
            VALUES (parent.user_id, target_date, parent.category, parent.description, parent.amount, false, NULL, parent.id);
          END IF;
        END IF;
      END IF;
      cur_month := (cur_month + interval '1 month')::date;
    END LOOP;
  END LOOP;
END;
$$;

-- 6) user_financial_summary
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

  -- materialize recurring in stable manner: do not mutate inside STABLE fn.
  -- (materialization is done via the daily RPC which is VOLATILE)

  -- gross revenue + gateway fees + product costs
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

  -- expenses by category
  SELECT COALESCE(SUM(amount),0),
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

  -- expenses_total excludes extra_revenue (which is inflow, not outflow)
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

-- 7) user_financial_daily
CREATE OR REPLACE FUNCTION public.user_financial_daily(_start date, _end date)
RETURNS TABLE(day date, revenue numeric, costs_and_fees numeric, expenses numeric, net_profit numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  PERFORM public.materialize_recurring_expenses(_uid, _start, _end);

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(_start, _end, interval '1 day')::date AS day
  ),
  rev AS (
    SELECT (o.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS d,
           SUM(o.total) AS revenue,
           SUM(o.total * COALESCE(gs.fee_percent,0)/100.0) AS fees,
           SUM(COALESCE(pc.unit_cost,0) * COALESCE(o.quantity,1)) AS pcost
    FROM public.orders o
    LEFT JOIN public.product_costs pc ON pc.product_id = o.product_id AND pc.user_id = _uid
    LEFT JOIN public.gateway_settings gs ON gs.user_id = _uid AND gs.active = true AND lower(gs.gateway_name) = lower(COALESCE(o.payment_method, gs.gateway_name))
    WHERE o.user_id = _uid
      AND o.payment_status IN ('paid','approved')
      AND (o.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN _start AND _end
    GROUP BY 1
  ),
  exp AS (
    SELECT e.date AS d,
           SUM(CASE WHEN e.category = 'extra_revenue' THEN 0 ELSE e.amount END) AS expenses,
           SUM(CASE WHEN e.category = 'extra_revenue' THEN e.amount ELSE 0 END) AS extra_rev
    FROM public.expenses e
    WHERE e.user_id = _uid AND e.date BETWEEN _start AND _end
    GROUP BY 1
  )
  SELECT
    d.day,
    COALESCE(rev.revenue,0) + COALESCE(exp.extra_rev,0) AS revenue,
    COALESCE(rev.fees,0) + COALESCE(rev.pcost,0) AS costs_and_fees,
    COALESCE(exp.expenses,0) AS expenses,
    COALESCE(rev.revenue,0) + COALESCE(exp.extra_rev,0) - COALESCE(rev.fees,0) - COALESCE(rev.pcost,0) - COALESCE(exp.expenses,0) AS net_profit
  FROM days d
  LEFT JOIN rev ON rev.d = d.day
  LEFT JOIN exp ON exp.d = d.day
  ORDER BY d.day;
END;
$$;

-- 8) user_product_profit_ranking
CREATE OR REPLACE FUNCTION public.user_product_profit_ranking(_start date, _end date)
RETURNS TABLE(product_id uuid, title text, units_sold bigint, revenue numeric, product_cost numeric, gateway_fees numeric, profit numeric, margin_pct numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  PERFORM public.materialize_recurring_expenses(_uid, _start, _end);

  RETURN QUERY
  SELECT
    o.product_id,
    COALESCE(p.title, 'Produto removido') AS title,
    SUM(COALESCE(o.quantity,1))::bigint AS units_sold,
    COALESCE(SUM(o.total),0) AS revenue,
    COALESCE(SUM(COALESCE(pc.unit_cost,0) * COALESCE(o.quantity,1)),0) AS product_cost,
    COALESCE(SUM(o.total * COALESCE(gs.fee_percent,0)/100.0),0) AS gateway_fees,
    COALESCE(SUM(o.total),0)
      - COALESCE(SUM(COALESCE(pc.unit_cost,0) * COALESCE(o.quantity,1)),0)
      - COALESCE(SUM(o.total * COALESCE(gs.fee_percent,0)/100.0),0) AS profit,
    CASE WHEN COALESCE(SUM(o.total),0) > 0
      THEN ((COALESCE(SUM(o.total),0)
            - COALESCE(SUM(COALESCE(pc.unit_cost,0) * COALESCE(o.quantity,1)),0)
            - COALESCE(SUM(o.total * COALESCE(gs.fee_percent,0)/100.0),0)) / SUM(o.total)) * 100
      ELSE 0 END AS margin_pct
  FROM public.orders o
  LEFT JOIN public.products p ON p.id = o.product_id
  LEFT JOIN public.product_costs pc ON pc.product_id = o.product_id AND pc.user_id = _uid
  LEFT JOIN public.gateway_settings gs ON gs.user_id = _uid AND gs.active = true AND lower(gs.gateway_name) = lower(COALESCE(o.payment_method, gs.gateway_name))
  WHERE o.user_id = _uid
    AND o.payment_status IN ('paid','approved')
    AND (o.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN _start AND _end
  GROUP BY o.product_id, p.title
  ORDER BY profit DESC;
END;
$$;
