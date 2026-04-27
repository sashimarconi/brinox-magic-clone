-- Permitir múltiplas integrações Utmify por usuário
-- Remove a constraint UNIQUE em user_id (se existir) e adiciona campo "name" para identificar cada negócio

DO $$
DECLARE
  con RECORD;
BEGIN
  -- Drop qualquer unique constraint que envolva apenas user_id
  FOR con IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.utmify_settings'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.utmify_settings DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

-- Drop possíveis índices únicos em user_id
DROP INDEX IF EXISTS public.utmify_settings_user_id_key;
DROP INDEX IF EXISTS public.utmify_settings_user_id_idx;

-- Adiciona o campo "name" para o usuário identificar cada conta/negócio
ALTER TABLE public.utmify_settings
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Conta principal';

-- Index não-único para acelerar consultas por user_id
CREATE INDEX IF NOT EXISTS utmify_settings_user_id_lookup_idx
  ON public.utmify_settings (user_id);