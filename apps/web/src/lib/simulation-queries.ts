import { SupabaseClient } from "@supabase/supabase-js";

// ── Types ──

export interface Simulation {
  id: string;
  title: string;
  banca_name: string | null;
  source: string | null;
  exam_date: string;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  duration_minutes: number | null;
  notes: string | null;
}

export interface SimulationStats {
  total_count: number;
  avg_accuracy: number;
  trend: number; // diff últimos 3 vs anteriores
  top_source: string | null;
}

export interface AccuracyTrendPoint {
  date: string;
  accuracy: number;
  title: string;
}

export interface SpecialtyAccuracy {
  specialty_name: string;
  specialty_slug: string;
  avg_accuracy: number;
  total_questions: number;
  total_correct: number;
}

// ── Queries ──

export async function getSimulations(
  supabase: SupabaseClient,
  userId: string,
): Promise<Simulation[]> {
  const { data } = await supabase
    .from("simulations")
    .select("id, title, source, exam_date, total_questions, correct_answers, duration_minutes, notes, bancas(name)")
    .eq("user_id", userId)
    .order("exam_date", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((s: any) => ({
    id: s.id,
    title: s.title,
    banca_name: s.bancas?.name ?? null,
    source: s.source,
    exam_date: s.exam_date,
    total_questions: s.total_questions,
    correct_answers: s.correct_answers,
    accuracy: s.total_questions > 0 ? Math.round((s.correct_answers / s.total_questions) * 100) : 0,
    duration_minutes: s.duration_minutes,
    notes: s.notes,
  }));
}

export async function getSimulationStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<SimulationStats> {
  const sims = await getSimulations(supabase, userId);

  if (sims.length === 0) {
    return { total_count: 0, avg_accuracy: 0, trend: 0, top_source: null };
  }

  const avg = Math.round(sims.reduce((s, sim) => s + sim.accuracy, 0) / sims.length);

  // Trend: últimos 3 vs anteriores
  let trend = 0;
  if (sims.length >= 4) {
    const recent3 = sims.slice(0, 3);
    const older = sims.slice(3);
    const recentAvg = recent3.reduce((s, sim) => s + sim.accuracy, 0) / recent3.length;
    const olderAvg = older.reduce((s, sim) => s + sim.accuracy, 0) / older.length;
    trend = Math.round((recentAvg - olderAvg) * 10) / 10;
  }

  // Top source
  const sourceCounts = new Map<string, number>();
  for (const sim of sims) {
    const src = sim.source ?? "Outro";
    sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
  }
  let topSource: string | null = null;
  let maxCount = 0;
  for (const [src, count] of sourceCounts) {
    if (count > maxCount) {
      maxCount = count;
      topSource = src;
    }
  }

  return { total_count: sims.length, avg_accuracy: avg, trend, top_source: topSource };
}

export async function getAccuracyTrend(
  supabase: SupabaseClient,
  userId: string,
): Promise<AccuracyTrendPoint[]> {
  const { data } = await supabase
    .from("simulations")
    .select("exam_date, total_questions, correct_answers, title")
    .eq("user_id", userId)
    .order("exam_date", { ascending: true });

  return (data ?? []).map((s) => ({
    date: s.exam_date,
    accuracy: s.total_questions > 0 ? Math.round((s.correct_answers / s.total_questions) * 100) : 0,
    title: s.title,
  }));
}

export async function getSpecialtyAccuracy(
  supabase: SupabaseClient,
  userId: string,
): Promise<SpecialtyAccuracy[]> {
  // Get all simulation_results for user's simulations
  const { data: sims } = await supabase
    .from("simulations")
    .select("id")
    .eq("user_id", userId);

  if (!sims || sims.length === 0) return [];

  const simIds = sims.map((s) => s.id);

  const { data: results } = await supabase
    .from("simulation_results")
    .select("specialty_id, questions, correct, specialties(name, slug)")
    .in("simulation_id", simIds);

  if (!results || results.length === 0) return [];

  // Aggregate by specialty
  const map = new Map<string, { name: string; slug: string; questions: number; correct: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of results as any[]) {
    const slug = r.specialties?.slug ?? "unknown";
    const name = r.specialties?.name ?? slug;
    const existing = map.get(slug) ?? { name, slug, questions: 0, correct: 0 };
    existing.questions += r.questions;
    existing.correct += r.correct;
    map.set(slug, existing);
  }

  return [...map.values()]
    .map((s) => ({
      specialty_name: s.name,
      specialty_slug: s.slug,
      avg_accuracy: s.questions > 0 ? Math.round((s.correct / s.questions) * 100) : 0,
      total_questions: s.questions,
      total_correct: s.correct,
    }))
    .sort((a, b) => b.total_questions - a.total_questions);
}
