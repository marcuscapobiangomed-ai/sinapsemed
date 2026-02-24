-- ============================================================
-- Seed: Plans for SinapseMED
-- ============================================================

INSERT INTO plans (slug, name, price_brl, interval, stripe_price_id, max_flashcards_per_month, max_doubts_per_day, max_bancas, max_simulations_per_month, has_dashboard_prediction, has_priority_ai, is_active)
VALUES
  ('free',    'Gratuito',  0,    'month', NULL,                                    30,   5,   1,    1,    FALSE, FALSE, TRUE),
  ('pro',     'Pro',       2990, 'month', 'price_1T3xABRuXnOhMRw1Yzq6SvZ7',       500,  25,  3,    2,    TRUE,  FALSE, TRUE),
  ('premium', 'Premium',   5990, 'month', 'price_1T3xABRuXnOhMRw1Hk7uCRNT',       NULL, NULL, NULL, NULL, TRUE,  TRUE,  TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_brl = EXCLUDED.price_brl,
  stripe_price_id = EXCLUDED.stripe_price_id,
  max_flashcards_per_month = EXCLUDED.max_flashcards_per_month,
  max_doubts_per_day = EXCLUDED.max_doubts_per_day,
  max_bancas = EXCLUDED.max_bancas,
  max_simulations_per_month = EXCLUDED.max_simulations_per_month,
  has_dashboard_prediction = EXCLUDED.has_dashboard_prediction,
  has_priority_ai = EXCLUDED.has_priority_ai,
  is_active = EXCLUDED.is_active;
