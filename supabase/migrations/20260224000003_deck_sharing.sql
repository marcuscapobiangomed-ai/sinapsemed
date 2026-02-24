-- ============================================================
-- Deck sharing / marketplace
-- ============================================================

-- Add sharing columns to decks
ALTER TABLE decks
  ADD COLUMN is_public BOOLEAN DEFAULT FALSE,
  ADD COLUMN share_code TEXT UNIQUE,
  ADD COLUMN clone_count INTEGER DEFAULT 0;

CREATE INDEX idx_decks_public ON decks(is_public) WHERE is_public = TRUE;

-- Allow anyone to read public decks (+ their flashcards)
CREATE POLICY "Anyone can read public decks"
  ON decks FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Anyone can read flashcards of public decks"
  ON flashcards FOR SELECT
  USING (
    auth.uid() = user_id
    OR deck_id IN (SELECT id FROM decks WHERE is_public = TRUE)
  );

-- Drop the old restrictive policies and replace with more granular ones
DROP POLICY IF EXISTS "Users access own decks" ON decks;

CREATE POLICY "Users manage own decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id);

-- Drop old flashcard policy and replace
DROP POLICY IF EXISTS "Users access own flashcards" ON flashcards;

CREATE POLICY "Users manage own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own flashcards"
  ON flashcards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own flashcards"
  ON flashcards FOR DELETE
  USING (auth.uid() = user_id);
