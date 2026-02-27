-- ============================================================
-- Dificuldade por especialidade em simulation_results
-- Permite o Raio-X de Complexidade por grande área com dados
-- precisos por especialidade (em vez de nível de simulado)
-- ============================================================

ALTER TABLE simulation_results
  ADD COLUMN easy_total    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN easy_correct  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN medium_total  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN medium_correct INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN hard_total    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN hard_correct  INTEGER NOT NULL DEFAULT 0;
