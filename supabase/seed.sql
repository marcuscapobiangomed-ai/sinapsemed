-- ============================================================
-- DinDin - Seed Data
-- Bancas, Especialidades, Planos
-- ============================================================

-- ── Bancas ──
INSERT INTO bancas (slug, name, description, institution, typical_exam_month, total_questions_avg, specialty_weights) VALUES
  ('enare', 'ENARE - Exame Nacional de Residência', 'Prova nacional unificada para residência médica, com foco em atenção primária e políticas do SUS.', 'EBSERH', 10, 120, '{"clinica_medica": 0.30, "cirurgia": 0.20, "pediatria": 0.15, "ginecologia_obstetricia": 0.15, "medicina_preventiva": 0.20}'),
  ('enamed', 'ENAMED - Exame Nacional de Revalidação', 'Exame de revalidação de diplomas médicos obtidos no exterior.', 'INEP/MEC', 11, 100, '{"clinica_medica": 0.25, "cirurgia": 0.20, "pediatria": 0.15, "ginecologia_obstetricia": 0.15, "medicina_preventiva": 0.15, "saude_mental": 0.10}'),
  ('usp', 'USP - Faculdade de Medicina da USP', 'Prova de residência médica da FMUSP, com perfil acadêmico e teórico.', 'FMUSP', 1, 100, '{"clinica_medica": 0.35, "cirurgia": 0.25, "pediatria": 0.15, "ginecologia_obstetricia": 0.15, "medicina_preventiva": 0.10}');

-- ── Especialidades ──
INSERT INTO specialties (slug, name) VALUES
  ('clinica_medica', 'Clínica Médica'),
  ('cirurgia_geral', 'Cirurgia Geral'),
  ('pediatria', 'Pediatria'),
  ('ginecologia_obstetricia', 'Ginecologia e Obstetrícia'),
  ('medicina_preventiva', 'Medicina Preventiva e Saúde Coletiva'),
  ('saude_mental', 'Saúde Mental e Psiquiatria'),
  ('emergencia', 'Medicina de Emergência'),
  ('ortopedia', 'Ortopedia e Traumatologia'),
  ('cardiologia', 'Cardiologia'),
  ('endocrinologia', 'Endocrinologia'),
  ('gastroenterologia', 'Gastroenterologia'),
  ('nefrologia', 'Nefrologia'),
  ('pneumologia', 'Pneumologia'),
  ('neurologia', 'Neurologia'),
  ('infectologia', 'Infectologia'),
  ('dermatologia', 'Dermatologia'),
  ('oftalmologia', 'Oftalmologia'),
  ('otorrinolaringologia', 'Otorrinolaringologia'),
  ('urologia', 'Urologia'),
  ('farmacologia', 'Farmacologia');

-- ── Planos ──
INSERT INTO plans (slug, name, price_brl, interval, max_flashcards_per_month, max_doubts_per_day, max_bancas, has_dashboard_prediction, has_priority_ai) VALUES
  ('free', 'Gratuito', 0, 'free', 50, 5, 1, false, false),
  ('pro_monthly', 'Pro Mensal', 5990, 'month', NULL, NULL, NULL, true, true),
  ('pro_annual', 'Pro Anual', 47990, 'year', NULL, NULL, NULL, true, true);
