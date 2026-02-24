-- ============================================================
-- Study Plan Entries - Weekly Planner Blocks
-- ============================================================

CREATE TABLE study_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  specialty_id UUID NOT NULL REFERENCES specialties(id),
  planned_minutes SMALLINT NOT NULL CHECK (planned_minutes > 0 AND planned_minutes <= 480),
  completed_minutes SMALLINT NOT NULL DEFAULT 0 CHECK (completed_minutes >= 0),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start, day_of_week, specialty_id)
);

CREATE INDEX idx_plan_entries_user_week ON study_plan_entries(user_id, week_start);

ALTER TABLE study_plan_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plan entries"
  ON study_plan_entries FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER tr_study_plan_updated
  BEFORE UPDATE ON study_plan_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RPC: Due cards per day (efficient grouped count)
-- ============================================================

CREATE OR REPLACE FUNCTION get_due_cards_per_day(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(due_date DATE, due_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    DATE(next_review_at) AS due_date,
    COUNT(*) AS due_count
  FROM flashcards
  WHERE user_id = p_user_id
    AND NOT is_suspended
    AND next_review_at IS NOT NULL
    AND next_review_at >= p_start_date::timestamptz
    AND next_review_at < (p_end_date + 1)::timestamptz
  GROUP BY DATE(next_review_at)
  ORDER BY due_date;
$$;
