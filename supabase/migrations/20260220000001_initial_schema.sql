-- ============================================================
-- DinDin - Initial Schema Migration
-- Creates all tables, indexes, RLS policies, triggers
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE flashcard_source AS ENUM ('manual', 'extension_text', 'extension_image', 'ai_generated');
CREATE TYPE review_rating AS ENUM ('again', 'hard', 'good', 'easy');
CREATE TYPE gap_severity AS ENUM ('critical', 'moderate', 'minor');
CREATE TYPE ai_action_type AS ENUM (
  'flashcard_enrichment',
  'doubt_resolution',
  'gap_detection',
  'study_plan_generation',
  'flashcard_generation'
);

-- ============================================================
-- TABELA: profiles
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  medical_school TEXT,
  graduation_year INTEGER,
  target_year INTEGER NOT NULL DEFAULT 2027,
  study_hours_per_day NUMERIC(3,1) DEFAULT 4.0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: bancas
-- ============================================================
CREATE TABLE bancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  institution TEXT,
  typical_exam_month INTEGER,
  total_questions_avg INTEGER,
  specialty_weights JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  system_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: user_bancas
-- ============================================================
CREATE TABLE user_bancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banca_id UUID NOT NULL REFERENCES bancas(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, banca_id)
);

-- ============================================================
-- TABELA: specialties
-- ============================================================
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES specialties(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: decks
-- ============================================================
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES specialties(id),
  banca_id UUID REFERENCES bancas(id),
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_archived BOOLEAN DEFAULT FALSE,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: flashcards
-- ============================================================
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

  -- Conteúdo
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  front_image_url TEXT,
  back_image_url TEXT,
  extra_context TEXT,
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,

  -- Metadados
  source flashcard_source DEFAULT 'manual',
  specialty_id UUID REFERENCES specialties(id),
  banca_id UUID REFERENCES bancas(id),

  -- FSRS Fields
  fsrs_stability REAL DEFAULT 0,
  fsrs_difficulty REAL DEFAULT 0,
  fsrs_elapsed_days INTEGER DEFAULT 0,
  fsrs_scheduled_days INTEGER DEFAULT 0,
  fsrs_reps INTEGER DEFAULT 0,
  fsrs_lapses INTEGER DEFAULT 0,
  fsrs_state INTEGER DEFAULT 0,
  fsrs_last_review TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,

  -- Embedding
  embedding vector(1536),

  -- Flags
  is_ai_enriched BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: reviews
-- ============================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  rating review_rating NOT NULL,
  response_time_ms INTEGER,
  fsrs_stability_before REAL,
  fsrs_difficulty_before REAL,
  fsrs_state_before INTEGER,
  scheduled_for TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: knowledge_gaps
-- ============================================================
CREATE TABLE knowledge_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  specialty_id UUID REFERENCES specialties(id),
  banca_id UUID REFERENCES bancas(id),
  severity gap_severity DEFAULT 'moderate',
  source_flashcard_ids UUID[] DEFAULT '{}',
  source_review_ids UUID[] DEFAULT '{}',
  error_pattern TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  confidence_score REAL DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ai_logs
-- ============================================================
CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action ai_action_type NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  prompt_hash TEXT,
  latency_ms INTEGER,
  banca_id UUID REFERENCES bancas(id),
  related_flashcard_id UUID REFERENCES flashcards(id),
  related_gap_id UUID REFERENCES knowledge_gaps(id),
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: banca_documents
-- ============================================================
CREATE TABLE banca_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banca_id UUID NOT NULL REFERENCES bancas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  file_url TEXT,
  content TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: document_chunks
-- ============================================================
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES banca_documents(id) ON DELETE CASCADE,
  banca_id UUID NOT NULL REFERENCES bancas(id),
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  token_count INTEGER,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: study_sessions
-- ============================================================
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  deck_id UUID REFERENCES decks(id),
  banca_id UUID REFERENCES bancas(id),
  cards_reviewed INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  cards_incorrect INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

-- ============================================================
-- TABELA: plans
-- ============================================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_brl INTEGER NOT NULL,
  interval TEXT NOT NULL,
  stripe_price_id TEXT,
  max_flashcards_per_month INTEGER,
  max_doubts_per_day INTEGER,
  max_bancas INTEGER,
  has_dashboard_prediction BOOLEAN DEFAULT FALSE,
  has_priority_ai BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: subscriptions
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: sync_queue
-- ============================================================
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  payload JSONB NOT NULL,
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_flashcards_next_review ON flashcards(user_id, next_review_at) WHERE NOT is_suspended;
CREATE INDEX idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX idx_flashcards_embedding ON flashcards USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_reviews_user_time ON reviews(user_id, reviewed_at DESC);
CREATE INDEX idx_reviews_flashcard ON reviews(flashcard_id);
CREATE INDEX idx_gaps_active ON knowledge_gaps(user_id, severity) WHERE NOT is_resolved;
CREATE INDEX idx_ai_logs_user_date ON ai_logs(user_id, created_at DESC);
CREATE INDEX idx_sessions_user_date ON study_sessions(user_id, started_at DESC);
CREATE INDEX idx_sync_pending ON sync_queue(user_id, created_at) WHERE NOT is_processed;
CREATE INDEX idx_user_bancas_user ON user_bancas(user_id);
CREATE INDEX idx_decks_user ON decks(user_id) WHERE NOT is_archived;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE banca_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- User data policies
CREATE POLICY "Users access own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own decks" ON decks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own flashcards" ON flashcards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own reviews" ON reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own gaps" ON knowledge_gaps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own ai_logs" ON ai_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own sessions" ON study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own sync_queue" ON sync_queue FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own bancas" ON user_bancas FOR ALL USING (auth.uid() = user_id);

-- Public read policies
CREATE POLICY "Bancas publicly readable" ON bancas FOR SELECT USING (true);
CREATE POLICY "Specialties publicly readable" ON specialties FOR SELECT USING (true);
CREATE POLICY "Plans publicly readable" ON plans FOR SELECT USING (true);
CREATE POLICY "Documents readable by auth users" ON banca_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Chunks readable by auth users" ON document_chunks FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_decks_updated BEFORE UPDATE ON decks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_flashcards_updated BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_gaps_updated BEFORE UPDATE ON knowledge_gaps FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Counter cache: card_count in decks
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE decks SET card_count = card_count + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE decks SET card_count = card_count - 1 WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_flashcard_count AFTER INSERT OR DELETE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_deck_card_count();

-- Auto-create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'name', '')),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
