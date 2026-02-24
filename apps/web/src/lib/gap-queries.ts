import { SupabaseClient } from "@supabase/supabase-js";
import { getSpecialtyAccuracy, type SpecialtyAccuracy } from "./simulation-queries";

// ── Types ──

interface FlashcardSpecialtyAccuracy {
  specialty_name: string;
  specialty_slug: string;
  total_reviews: number;
  correct_reviews: number;
  accuracy: number;
}

export interface SpecialtyGap {
  specialty_name: string;
  specialty_slug: string;
  flashcard_accuracy: number | null;
  simulation_accuracy: number | null;
  combined_accuracy: number;
  banca_weight: number;
  priority_score: number;
  flashcard_review_count: number;
  simulation_question_count: number;
  data_confidence: "low" | "medium" | "high";
}

export interface GapAnalysisData {
  specialties: SpecialtyGap[];
  banca_name: string | null;
  total_flashcard_reviews: number;
  total_simulation_questions: number;
  has_flashcard_data: boolean;
  has_simulation_data: boolean;
  overall_accuracy: number;
}

// ── Helpers ──

// Normaliza chaves do JSONB specialty_weights que diferem dos slugs da tabela specialties
const WEIGHT_KEY_TO_SLUG: Record<string, string> = {
  cirurgia: "cirurgia_geral",
};

function normalizeWeightKey(key: string): string {
  return WEIGHT_KEY_TO_SLUG[key] ?? key;
}

function computeCombinedAccuracy(
  fcAccuracy: number | null,
  simAccuracy: number | null,
): number {
  if (fcAccuracy !== null && simAccuracy !== null) {
    // Simulados pesam 60% (mais próximo da prova real)
    return Math.round(simAccuracy * 0.6 + fcAccuracy * 0.4);
  }
  if (simAccuracy !== null) return simAccuracy;
  if (fcAccuracy !== null) return fcAccuracy;
  // Sem dados: 50% como baseline "desconhecido"
  return 50;
}

// ── Queries ──

async function getFlashcardAccuracyBySpecialty(
  supabase: SupabaseClient,
  userId: string,
): Promise<FlashcardSpecialtyAccuracy[]> {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, flashcards!inner(specialty_id, specialties(name, slug))")
    .eq("user_id", userId);

  if (!reviews || reviews.length === 0) return [];

  const map = new Map<string, { name: string; slug: string; total: number; correct: number }>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of reviews as any[]) {
    const slug = r.flashcards?.specialties?.slug;
    if (!slug) continue;
    const name = r.flashcards.specialties.name;
    const entry = map.get(slug) ?? { name, slug, total: 0, correct: 0 };
    entry.total++;
    if (r.rating === "good" || r.rating === "easy") {
      entry.correct++;
    }
    map.set(slug, entry);
  }

  return [...map.values()]
    .map((s) => ({
      specialty_name: s.name,
      specialty_slug: s.slug,
      total_reviews: s.total,
      correct_reviews: s.correct,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.total_reviews - a.total_reviews);
}

async function getPrimaryBancaWeights(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ bancaName: string | null; weights: Map<string, number> }> {
  const { data: userBanca } = await supabase
    .from("user_bancas")
    .select("bancas(name, specialty_weights)")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .single();

  if (!userBanca) {
    return { bancaName: null, weights: new Map() };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const banca = (userBanca as any).bancas;
  const raw = (banca?.specialty_weights ?? {}) as Record<string, number>;
  const weights = new Map<string, number>();

  for (const [key, value] of Object.entries(raw)) {
    weights.set(normalizeWeightKey(key), value);
  }

  return { bancaName: banca?.name ?? null, weights };
}

// ── Main orchestrator ──

export async function getGapAnalysis(
  supabase: SupabaseClient,
  userId: string,
): Promise<GapAnalysisData> {
  const [flashcardData, simulationData, bancaData] = await Promise.all([
    getFlashcardAccuracyBySpecialty(supabase, userId),
    getSpecialtyAccuracy(supabase, userId),
    getPrimaryBancaWeights(supabase, userId),
  ]);

  const hasFlashcard = flashcardData.length > 0;
  const hasSimulation = simulationData.length > 0;

  // Merge todas as specialties de todas as fontes
  const allSlugs = new Set<string>();
  const flashcardMap = new Map<string, FlashcardSpecialtyAccuracy>();
  const simulationMap = new Map<string, SpecialtyAccuracy>();

  for (const f of flashcardData) {
    allSlugs.add(f.specialty_slug);
    flashcardMap.set(f.specialty_slug, f);
  }
  for (const s of simulationData) {
    allSlugs.add(s.specialty_slug);
    simulationMap.set(s.specialty_slug, s);
  }
  for (const slug of bancaData.weights.keys()) {
    allSlugs.add(slug);
  }

  const hasBanca = bancaData.weights.size > 0;

  const specialties: SpecialtyGap[] = [];

  for (const slug of allSlugs) {
    const fc = flashcardMap.get(slug);
    const sim = simulationMap.get(slug);
    const bancaWeight = bancaData.weights.get(slug) ?? 0;

    const name = sim?.specialty_name ?? fc?.specialty_name ?? slug;
    const fcAccuracy = fc ? fc.accuracy : null;
    const simAccuracy = sim ? sim.avg_accuracy : null;
    const combined = computeCombinedAccuracy(fcAccuracy, simAccuracy);

    // Se não tem banca, usa weight=1 para rankear puramente por fraqueza
    const effectiveWeight = hasBanca ? bancaWeight : 1;
    const priorityScore = Math.round(((1 - combined / 100) * effectiveWeight) * 1000) / 1000;

    const totalDataPoints = (fc?.total_reviews ?? 0) + (sim?.total_questions ?? 0);
    const dataConfidence: "low" | "medium" | "high" =
      totalDataPoints < 10 ? "low" :
      totalDataPoints < 50 ? "medium" :
      "high";

    specialties.push({
      specialty_name: name,
      specialty_slug: slug,
      flashcard_accuracy: fcAccuracy,
      simulation_accuracy: simAccuracy,
      combined_accuracy: combined,
      banca_weight: bancaWeight,
      priority_score: priorityScore,
      flashcard_review_count: fc?.total_reviews ?? 0,
      simulation_question_count: sim?.total_questions ?? 0,
      data_confidence: dataConfidence,
    });
  }

  // Ordenar por prioridade (maior primeiro)
  specialties.sort((a, b) => b.priority_score - a.priority_score);

  // Acerto geral ponderado por volume de dados
  let totalWeight = 0;
  let weightedAccuracy = 0;
  for (const s of specialties) {
    const volume = s.flashcard_review_count + s.simulation_question_count;
    totalWeight += volume;
    weightedAccuracy += s.combined_accuracy * volume;
  }
  const overallAccuracy = totalWeight > 0 ? Math.round(weightedAccuracy / totalWeight) : 0;

  return {
    specialties,
    banca_name: bancaData.bancaName,
    total_flashcard_reviews: flashcardData.reduce((sum, f) => sum + f.total_reviews, 0),
    total_simulation_questions: simulationData.reduce((sum, s) => sum + s.total_questions, 0),
    has_flashcard_data: hasFlashcard,
    has_simulation_data: hasSimulation,
    overall_accuracy: overallAccuracy,
  };
}
