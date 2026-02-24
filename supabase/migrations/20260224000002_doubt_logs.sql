-- ============================================================
-- Rastreamento de dúvidas para enforçar limite por dia
-- ============================================================

CREATE TABLE doubt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doubt_logs_user_date ON doubt_logs(user_id, created_at DESC);

ALTER TABLE doubt_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own doubt logs"
  ON doubt_logs FOR ALL USING (auth.uid() = user_id);
