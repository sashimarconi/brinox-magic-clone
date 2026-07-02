
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE OR REPLACE FUNCTION public.admin_list_users()
 RETURNS TABLE(user_id uuid, email text, full_name text, avatar_url text, plan plan_type, transaction_fee_percent numeric, monthly_price numeric, created_at timestamp with time zone, blocked boolean, total_products bigint, total_paid_orders bigint, total_revenue numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    u.id as user_id, u.email::text, p.full_name, p.avatar_url,
    COALESCE(up.plan, 'free'::plan_type) as plan,
    COALESCE(up.transaction_fee_percent, 2.5) as transaction_fee_percent,
    COALESCE(up.monthly_price, 0) as monthly_price,
    u.created_at,
    COALESCE(p.blocked, false) as blocked,
    (SELECT COUNT(*) FROM public.products WHERE user_id = u.id) as total_products,
    (SELECT COUNT(*) FROM public.orders WHERE user_id = u.id AND payment_status IN ('paid','approved')) as total_paid_orders,
    (SELECT COALESCE(SUM(total),0) FROM public.orders WHERE user_id = u.id AND payment_status IN ('paid','approved')) as total_revenue
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.user_plans up ON up.user_id = u.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY u.created_at DESC
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_top_sellers(_limit integer DEFAULT 20)
 RETURNS TABLE(user_id uuid, email text, full_name text, plan plan_type, total_paid_orders bigint, total_revenue numeric, total_products bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    u.id as user_id,
    u.email::text,
    p.full_name,
    COALESCE(up.plan, 'free'::plan_type) as plan,
    COALESCE((SELECT COUNT(*) FROM public.orders WHERE user_id = u.id AND payment_status IN ('paid','approved')), 0) as total_paid_orders,
    COALESCE((SELECT SUM(total) FROM public.orders WHERE user_id = u.id AND payment_status IN ('paid','approved')), 0) as total_revenue,
    COALESCE((SELECT COUNT(*) FROM public.products WHERE user_id = u.id), 0) as total_products
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.user_plans up ON up.user_id = u.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY total_revenue DESC, total_paid_orders DESC
  LIMIT _limit
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_top_sellers(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_top_sellers(integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_list_all_products(_limit integer DEFAULT 200, _offset integer DEFAULT 0, _search text DEFAULT NULL)
 RETURNS TABLE(product_id uuid, title text, slug text, sale_price numeric, original_price numeric, active boolean, created_at timestamp with time zone, thumbnail_url text, owner_user_id uuid, owner_email text, owner_full_name text, total_orders bigint, total_paid_orders bigint, total_revenue numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id as product_id,
    p.title,
    p.slug,
    p.sale_price,
    p.original_price,
    p.active,
    p.created_at,
    (SELECT url FROM public.product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as thumbnail_url,
    p.user_id as owner_user_id,
    u.email::text as owner_email,
    pr.full_name as owner_full_name,
    (SELECT COUNT(*) FROM public.orders WHERE product_id = p.id) as total_orders,
    (SELECT COUNT(*) FROM public.orders WHERE product_id = p.id AND payment_status IN ('paid','approved')) as total_paid_orders,
    (SELECT COALESCE(SUM(total),0) FROM public.orders WHERE product_id = p.id AND payment_status IN ('paid','approved')) as total_revenue
  FROM public.products p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.profiles pr ON pr.user_id = p.user_id
  WHERE public.has_role(auth.uid(), 'admin')
    AND (_search IS NULL OR _search = '' OR p.title ILIKE '%' || _search || '%' OR u.email::text ILIKE '%' || _search || '%')
  ORDER BY p.created_at DESC
  LIMIT _limit OFFSET _offset
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_list_all_products(integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_all_products(integer, integer, text) TO authenticated, service_role;
