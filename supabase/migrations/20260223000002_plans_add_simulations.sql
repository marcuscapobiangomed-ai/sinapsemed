-- ============================================================
-- Add max_simulations_per_month to plans + update Pro limits
-- ============================================================

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS max_simulations_per_month INTEGER;

-- Pro: 25 dúvidas/dia, 1 simulado/mês
UPDATE plans SET
  max_doubts_per_day = 25,
  max_simulations_per_month = 1
WHERE slug = 'pro';

-- Premium: ilimitado (NULL)
UPDATE plans SET
  max_simulations_per_month = NULL
WHERE slug = 'premium';

-- Free: sem simulados
UPDATE plans SET
  max_simulations_per_month = 0
WHERE slug = 'free';
