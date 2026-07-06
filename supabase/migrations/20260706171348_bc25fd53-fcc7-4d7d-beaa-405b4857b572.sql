ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.abandoned_carts DROP CONSTRAINT IF EXISTS abandoned_carts_product_id_fkey;
ALTER TABLE public.abandoned_carts ADD CONSTRAINT abandoned_carts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;