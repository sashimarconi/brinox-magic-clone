CREATE OR REPLACE FUNCTION public.remove_my_mfa_factors()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.mfa_challenges WHERE factor_id IN (
    SELECT id FROM auth.mfa_factors WHERE user_id = auth.uid()
  );
  DELETE FROM auth.mfa_factors WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_my_mfa_factor(_factor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.mfa_challenges WHERE factor_id = _factor_id
    AND factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = auth.uid());
  DELETE FROM auth.mfa_factors WHERE id = _factor_id AND user_id = auth.uid();
END;
$$;