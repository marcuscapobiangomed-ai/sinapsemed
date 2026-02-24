-- ============================================================
-- Simulados Importados
-- ============================================================

CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  banca_id UUID REFERENCES bancas(id),
  source TEXT,
  exam_date DATE NOT NULL,
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id),
  questions INTEGER NOT NULL CHECK (questions > 0),
  correct INTEGER NOT NULL CHECK (correct >= 0),
  UNIQUE(simulation_id, specialty_id)
);

CREATE INDEX idx_simulations_user ON simulations(user_id, exam_date DESC);
CREATE INDEX idx_sim_results_sim ON simulation_results(simulation_id);

ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own simulations"
  ON simulations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own simulation results"
  ON simulation_results FOR ALL USING (
    simulation_id IN (SELECT id FROM simulations WHERE user_id = auth.uid())
  );
