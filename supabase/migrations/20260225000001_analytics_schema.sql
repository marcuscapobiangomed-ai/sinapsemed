-- ============================================================
-- Analytics Schema: dificuldade, nota de corte, hierarquia
-- ============================================================

-- 1a) Colunas de dificuldade em simulations (backward-compatible)
ALTER TABLE simulations
  ADD COLUMN easy_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN easy_correct INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN medium_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN medium_correct INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN hard_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN hard_correct INTEGER NOT NULL DEFAULT 0;

-- 1b) Nota de corte por banca
ALTER TABLE bancas ADD COLUMN cutoff_score INTEGER;
UPDATE bancas SET cutoff_score = 75 WHERE slug = 'enare';
UPDATE bancas SET cutoff_score = 70 WHERE slug = 'enamed';
UPDATE bancas SET cutoff_score = 82 WHERE slug = 'usp';

-- 1c) Hierarquia de especialidades (parent_id já existe na tabela)
-- Sub-especialidades de Clínica Médica
UPDATE specialties SET parent_id = (SELECT id FROM specialties WHERE slug = 'clinica_medica')
  WHERE slug IN ('cardiologia','endocrinologia','gastroenterologia','nefrologia',
                  'pneumologia','neurologia','infectologia','dermatologia',
                  'farmacologia','saude_mental','emergencia');

-- Sub-especialidades de Cirurgia Geral
UPDATE specialties SET parent_id = (SELECT id FROM specialties WHERE slug = 'cirurgia_geral')
  WHERE slug IN ('ortopedia','urologia','oftalmologia','otorrinolaringologia');

-- pediatria, ginecologia_obstetricia, medicina_preventiva permanecem top-level (parent_id = NULL)
