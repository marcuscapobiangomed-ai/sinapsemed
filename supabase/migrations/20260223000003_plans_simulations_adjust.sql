-- Free: 1 simulado/mês, Pro: 2 simulados/mês
UPDATE plans SET max_simulations_per_month = 1 WHERE slug = 'free';
UPDATE plans SET max_simulations_per_month = 2 WHERE slug = 'pro';
