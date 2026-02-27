-- ============================================================
-- Promove o primeiro usuário (desenvolvedor) para o plano Premium
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_plan_id UUID;
BEGIN
  -- Primeiro perfil criado = conta do desenvolvedor
  SELECT id INTO v_user_id FROM profiles ORDER BY created_at ASC LIMIT 1;

  -- ID do plano Premium (ilimitado)
  SELECT id INTO v_plan_id FROM plans WHERE slug = 'premium';

  IF v_user_id IS NOT NULL AND v_plan_id IS NOT NULL THEN
    -- Cancela assinaturas ativas anteriores
    UPDATE subscriptions
      SET status = 'canceled'
      WHERE user_id = v_user_id AND status = 'active';

    -- Insere assinatura premium sem expiração
    INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
    VALUES (v_user_id, v_plan_id, 'active', now(), now() + interval '100 years');
  END IF;
END;
$$;
