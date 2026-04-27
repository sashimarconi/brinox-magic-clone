DELETE FROM public.orders
WHERE LOWER(customer_email) IN ('juanmarconi10@gmail.com', 'sashidoblack@gmail.com')
   OR LOWER(customer_email) LIKE '%teste%'
   OR LOWER(customer_name) LIKE '%teste%';