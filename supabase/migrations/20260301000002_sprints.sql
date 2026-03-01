-- Sprint phase enum
CREATE TYPE public.sprint_phase AS ENUM ('diagnostic', 'active', 'closing', 'completed');

-- Sprint type enum
CREATE TYPE public.sprint_type AS ENUM ('foundation', 'deepening', 'revision', 'final_80_20');

-- ── Sprints table ─────────────────────────────────────────────────────────────
CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Metadata
  title TEXT NOT NULL,
  sprint_number SMALLINT NOT NULL DEFAULT 1,
  sprint_type public.sprint_type NOT NULL DEFAULT 'foundation',

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  current_phase public.sprint_phase NOT NULL DEFAULT 'diagnostic',

  -- Diagnostics (GapAnalysisData snapshots)
  diagnostic_start JSONB,
  diagnostic_end JSONB,

  -- Focus specialties set by AI
  focus_specialties JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Accumulated metrics
  total_study_minutes INTEGER NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  total_simulations INTEGER NOT NULL DEFAULT 0,
  avg_accuracy REAL,

  -- 80/20 mode flag
  is_80_20_mode BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- ── Sprint goals table ────────────────────────────────────────────────────────
CREATE TABLE public.sprint_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL, -- 'accuracy', 'reviews', 'study_time', 'simulations', 'custom'

  target_value REAL,
  current_value REAL NOT NULL DEFAULT 0,

  specialty_slug TEXT,

  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sprints" ON public.sprints
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sprint goals" ON public.sprint_goals
  FOR ALL USING (
    sprint_id IN (SELECT id FROM public.sprints WHERE user_id = auth.uid())
  );

-- ── Trigger: updated_at ──────────────────────────────────────────────────────
CREATE TRIGGER set_sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Trigger: enforce max 1 active sprint per user ────────────────────────────
CREATE OR REPLACE FUNCTION public.check_one_active_sprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.current_phase != 'completed' THEN
    IF EXISTS (
      SELECT 1 FROM public.sprints
      WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND current_phase != 'completed'
    ) THEN
      RAISE EXCEPTION 'User already has an active sprint';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_one_active_sprint
  BEFORE INSERT OR UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.check_one_active_sprint();

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_sprints_user_active ON public.sprints(user_id) WHERE current_phase != 'completed';
CREATE INDEX idx_sprint_goals_sprint ON public.sprint_goals(sprint_id);
