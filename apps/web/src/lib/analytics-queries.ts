import { SupabaseClient } from "@supabase/supabase-js";
import { getAccuracyTrend, type AccuracyTrendPoint } from "./simulation-queries";

// ══════════════════════════════════════════════
//  Types
// ══════════════════════════════════════════════

/** Feature 3 — Linha de Tendência de Aprovação */
export interface ApprovalTrendData {
  points: AccuracyTrendPoint[];
  cutoff_score: number | null;
  banca_name: string | null;
}

/** Feature 4 — Teia de Proficiência */
export interface RadarPoint {
  area: string;
  area_slug: string;
  accuracy: number;
  total_questions: number;
}

/** Feature 5 — Alertas de Fricção */
export interface FrictionAlert {
  specialty_name: string;
  specialty_slug: string;
  delta: number;
  previous_accuracy: number;
  current_accuracy: number;
  message: string;
  severity: "critical" | "warning" | "info";
}

// ══════════════════════════════════════════════
//  Feature 1 — Raio-X de Complexidade (agregado por grande área)
// ══════════════════════════════════════════════

/** Dado agregado de dificuldade para uma grande área (ou "all") */
export interface ComplexityAreaPoint {
  area_slug: string;  // "all" | "cirurgia_geral" | ...
  area_name: string;
  easy_total: number;
  easy_correct: number;
  medium_total: number;
  medium_correct: number;
  hard_total: number;
  hard_correct: number;
  sim_count: number;  // quantos simulados contribuíram para este agregado
}

const COMPLEXITY_AREA_LABELS: Record<string, string> = {
  cirurgia_geral:          "Cirurgia Geral",
  clinica_medica:          "Clínica Médica",
  pediatria:               "Pediatria",
  ginecologia_obstetricia: "Gineco/Obstet",
  medicina_preventiva:     "Med. Preventiva",
};

const COMPLEXITY_TOP_AREAS = Object.keys(COMPLEXITY_AREA_LABELS);

export async function getComplexityAggregated(
  supabase: SupabaseClient,
  userId: string,
): Promise<ComplexityAreaPoint[]> {
  // 1. Todos os simulados do usuário
  const { data: allSims } = await supabase
    .from("simulations")
    .select("id, easy_total, easy_correct, medium_total, medium_correct, hard_total, hard_correct")
    .eq("user_id", userId);

  if (!allSims?.length) return [];

  const simIds = allSims.map((s) => s.id);

  // 2. Resultados por especialidade (com dificuldade por especialidade) + hierarquia
  const [{ data: results }, { data: specialties }] = await Promise.all([
    supabase
      .from("simulation_results")
      .select("simulation_id, easy_total, easy_correct, medium_total, medium_correct, hard_total, hard_correct, specialties(slug, parent_id)")
      .in("simulation_id", simIds),
    supabase.from("specialties").select("id, slug, parent_id"),
  ]);

  // 3. Resolve especialidade → grande área (1 ou 2 níveis de hierarquia)
  function getTopArea(slug: string): string | null {
    if (COMPLEXITY_TOP_AREAS.includes(slug)) return slug;
    const spec = specialties?.find((s) => s.slug === slug);
    if (!spec?.parent_id) return null;
    const parent = specialties?.find((s) => s.id === spec.parent_id);
    if (!parent) return null;
    if (COMPLEXITY_TOP_AREAS.includes(parent.slug)) return parent.slug;
    return null;
  }

  // 4a. Resultados com dificuldade por especialidade (nova abordagem)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultsWithDiff = ((results ?? []) as any[]).filter(
    (r) => (r.easy_total + r.medium_total + r.hard_total) > 0,
  );

  if (resultsWithDiff.length > 0) {
    // Agregação precisa: soma dificuldade por grande área
    type AreaStats = {
      easy_total: number; easy_correct: number;
      medium_total: number; medium_correct: number;
      hard_total: number; hard_correct: number;
      sim_ids: Set<string>;
    };

    const allStats: AreaStats = { easy_total: 0, easy_correct: 0, medium_total: 0, medium_correct: 0, hard_total: 0, hard_correct: 0, sim_ids: new Set() };
    const areaStatsMap = new Map<string, AreaStats>();

    for (const r of resultsWithDiff) {
      allStats.easy_total   += r.easy_total;
      allStats.easy_correct += r.easy_correct;
      allStats.medium_total   += r.medium_total;
      allStats.medium_correct += r.medium_correct;
      allStats.hard_total   += r.hard_total;
      allStats.hard_correct += r.hard_correct;
      allStats.sim_ids.add(r.simulation_id);

      const slug = r.specialties?.slug;
      if (!slug) continue;
      const areaSlug = getTopArea(slug);
      if (!areaSlug) continue;

      if (!areaStatsMap.has(areaSlug)) {
        areaStatsMap.set(areaSlug, { easy_total: 0, easy_correct: 0, medium_total: 0, medium_correct: 0, hard_total: 0, hard_correct: 0, sim_ids: new Set() });
      }
      const s = areaStatsMap.get(areaSlug)!;
      s.easy_total   += r.easy_total;
      s.easy_correct += r.easy_correct;
      s.medium_total   += r.medium_total;
      s.medium_correct += r.medium_correct;
      s.hard_total   += r.hard_total;
      s.hard_correct += r.hard_correct;
      s.sim_ids.add(r.simulation_id);
    }

    const points: ComplexityAreaPoint[] = [
      { area_slug: "all", area_name: "Todas", easy_total: allStats.easy_total, easy_correct: allStats.easy_correct, medium_total: allStats.medium_total, medium_correct: allStats.medium_correct, hard_total: allStats.hard_total, hard_correct: allStats.hard_correct, sim_count: allStats.sim_ids.size },
    ];

    for (const [areaSlug, areaName] of Object.entries(COMPLEXITY_AREA_LABELS)) {
      const s = areaStatsMap.get(areaSlug);
      if (!s) continue;
      points.push({ area_slug: areaSlug, area_name: areaName, easy_total: s.easy_total, easy_correct: s.easy_correct, medium_total: s.medium_total, medium_correct: s.medium_correct, hard_total: s.hard_total, hard_correct: s.hard_correct, sim_count: s.sim_ids.size });
    }

    return points;
  }

  // 4b. Fallback: dificuldade no nível do simulado (dados antigos)
  const simsWithDiff = allSims.filter(
    (s) => (s.easy_total + s.medium_total + s.hard_total) > 0,
  );

  if (!simsWithDiff.length) return [];

  // Mapa simulado → grandes áreas que cobre
  const simToAreas = new Map<string, Set<string>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (results ?? []) as any[]) {
    const slug = r.specialties?.slug;
    if (!slug) continue;
    const areaSlug = getTopArea(slug);
    if (!areaSlug) continue;
    if (!simToAreas.has(r.simulation_id)) simToAreas.set(r.simulation_id, new Set());
    simToAreas.get(r.simulation_id)!.add(areaSlug);
  }

  function aggSims(sims: typeof simsWithDiff) {
    return {
      easy_total:     sims.reduce((s, x) => s + x.easy_total, 0),
      easy_correct:   sims.reduce((s, x) => s + x.easy_correct, 0),
      medium_total:   sims.reduce((s, x) => s + x.medium_total, 0),
      medium_correct: sims.reduce((s, x) => s + x.medium_correct, 0),
      hard_total:     sims.reduce((s, x) => s + x.hard_total, 0),
      hard_correct:   sims.reduce((s, x) => s + x.hard_correct, 0),
    };
  }

  const points: ComplexityAreaPoint[] = [
    { area_slug: "all", area_name: "Todas", ...aggSims(simsWithDiff), sim_count: simsWithDiff.length },
  ];

  for (const [areaSlug, areaName] of Object.entries(COMPLEXITY_AREA_LABELS)) {
    const filtered = simsWithDiff.filter((s) => simToAreas.get(s.id)?.has(areaSlug));
    if (filtered.length === 0) continue;
    points.push({ area_slug: areaSlug, area_name: areaName, ...aggSims(filtered), sim_count: filtered.length });
  }

  return points;
}

// ══════════════════════════════════════════════
//  Feature 3 — Linha de Tendência de Aprovação
// ══════════════════════════════════════════════

export async function getApprovalTrendData(
  supabase: SupabaseClient,
  userId: string,
): Promise<ApprovalTrendData> {
  const [points, bancaResult] = await Promise.all([
    getAccuracyTrend(supabase, userId),
    supabase
      .from("user_bancas")
      .select("bancas(name, cutoff_score)")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .maybeSingle(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const banca = (bancaResult.data as any)?.bancas;

  return {
    points,
    cutoff_score: banca?.cutoff_score ?? null,
    banca_name: banca?.name ?? null,
  };
}

// ══════════════════════════════════════════════
//  Feature 4 — Teia de Proficiência (Radar)
// ══════════════════════════════════════════════

const TOP_LEVEL_AREAS = [
  "clinica_medica",
  "cirurgia_geral",
  "pediatria",
  "ginecologia_obstetricia",
  "medicina_preventiva",
] as const;

const AREA_SHORT_NAMES: Record<string, string> = {
  clinica_medica: "Clínica Méd.",
  cirurgia_geral: "Cirurgia",
  pediatria: "Pediatria",
  ginecologia_obstetricia: "GO",
  medicina_preventiva: "Med. Prev.",
};

export async function getRadarData(
  supabase: SupabaseClient,
  userId: string,
): Promise<RadarPoint[]> {
  // 1. Fetch all specialties with parent_id
  const { data: specialties } = await supabase
    .from("specialties")
    .select("id, slug, name, parent_id");

  if (!specialties) return [];

  // Build slug->id and id->parent_slug maps
  const idToSlug = new Map<string, string>();
  const slugToId = new Map<string, string>();
  for (const s of specialties) {
    idToSlug.set(s.id, s.slug);
    slugToId.set(s.slug, s.id);
  }

  // Map every specialty to its top-level area slug
  function getAreaSlug(slug: string): string | null {
    if (TOP_LEVEL_AREAS.includes(slug as typeof TOP_LEVEL_AREAS[number])) return slug;
    const spec = specialties!.find((s) => s.slug === slug);
    if (!spec?.parent_id) return null;
    const parentSlug = idToSlug.get(spec.parent_id);
    return parentSlug ?? null;
  }

  // 2. Fetch simulation results aggregated by specialty
  const { data: sims } = await supabase
    .from("simulations")
    .select("id")
    .eq("user_id", userId);

  if (!sims?.length) {
    return TOP_LEVEL_AREAS.map((slug) => ({
      area: AREA_SHORT_NAMES[slug] ?? slug,
      area_slug: slug,
      accuracy: 0,
      total_questions: 0,
    }));
  }

  const simIds = sims.map((s) => s.id);
  const { data: results } = await supabase
    .from("simulation_results")
    .select("specialty_id, questions, correct, specialties(slug)")
    .in("simulation_id", simIds);

  // 3. Aggregate by top-level area
  const areaStats = new Map<string, { questions: number; correct: number }>();
  for (const area of TOP_LEVEL_AREAS) {
    areaStats.set(area, { questions: 0, correct: 0 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (results ?? []) as any[]) {
    const specSlug = r.specialties?.slug;
    if (!specSlug) continue;
    const areaSlug = getAreaSlug(specSlug);
    if (!areaSlug) continue;

    const stats = areaStats.get(areaSlug);
    if (stats) {
      stats.questions += r.questions;
      stats.correct += r.correct;
    }
  }

  // 4. Also add flashcard review data for areas without simulation data
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, flashcards!inner(specialty_id, specialties(slug))")
    .eq("user_id", userId);

  if (reviews) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of reviews as any[]) {
      const specSlug = r.flashcards?.specialties?.slug;
      if (!specSlug) continue;
      const areaSlug = getAreaSlug(specSlug);
      if (!areaSlug) continue;

      const stats = areaStats.get(areaSlug);
      if (stats && stats.questions === 0) {
        // Only use flashcard data if no simulation data exists for this area
        stats.questions++;
        if (r.rating === "good" || r.rating === "easy") {
          stats.correct++;
        }
      }
    }
  }

  return TOP_LEVEL_AREAS.map((slug) => {
    const stats = areaStats.get(slug)!;
    return {
      area: AREA_SHORT_NAMES[slug] ?? slug,
      area_slug: slug,
      accuracy: stats.questions > 0 ? Math.round((stats.correct / stats.questions) * 100) : 0,
      total_questions: stats.questions,
    };
  });
}

// ══════════════════════════════════════════════
//  Feature 5 — Alertas de Fricção
// ══════════════════════════════════════════════

export async function getFrictionAlerts(
  supabase: SupabaseClient,
  userId: string,
): Promise<FrictionAlert[]> {
  // Get last 3 simulations
  const { data: sims } = await supabase
    .from("simulations")
    .select("id, title, exam_date")
    .eq("user_id", userId)
    .order("exam_date", { ascending: false })
    .limit(3);

  if (!sims || sims.length < 2) return [];

  // Fetch results for each simulation
  const resultsMap = new Map<string, Map<string, { name: string; accuracy: number }>>();

  for (const sim of sims) {
    const { data: results } = await supabase
      .from("simulation_results")
      .select("questions, correct, specialties(name, slug)")
      .eq("simulation_id", sim.id);

    const specMap = new Map<string, { name: string; accuracy: number }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of (results ?? []) as any[]) {
      const slug = r.specialties?.slug;
      if (!slug || r.questions === 0) continue;
      specMap.set(slug, {
        name: r.specialties.name,
        accuracy: Math.round((r.correct / r.questions) * 100),
      });
    }
    resultsMap.set(sim.id, specMap);
  }

  const alerts: FrictionAlert[] = [];

  // Compare consecutive pairs (newest vs second-newest, etc.)
  for (let i = 0; i < sims.length - 1; i++) {
    const newer = resultsMap.get(sims[i].id);
    const older = resultsMap.get(sims[i + 1].id);
    if (!newer || !older) continue;

    for (const [slug, newerData] of newer) {
      const olderData = older.get(slug);
      if (!olderData) continue;

      const delta = newerData.accuracy - olderData.accuracy;

      if (delta <= -20) {
        alerts.push({
          specialty_name: newerData.name,
          specialty_slug: slug,
          delta,
          previous_accuracy: olderData.accuracy,
          current_accuracy: newerData.accuracy,
          message: `Queda crítica de ${Math.abs(delta)}pp em ${newerData.name} nos últimos simulados`,
          severity: "critical",
        });
      } else if (delta <= -10) {
        alerts.push({
          specialty_name: newerData.name,
          specialty_slug: slug,
          delta,
          previous_accuracy: olderData.accuracy,
          current_accuracy: newerData.accuracy,
          message: `Queda de ${Math.abs(delta)}pp em ${newerData.name} — atenção redobrada`,
          severity: "warning",
        });
      } else if (delta >= 15) {
        alerts.push({
          specialty_name: newerData.name,
          specialty_slug: slug,
          delta,
          previous_accuracy: olderData.accuracy,
          current_accuracy: newerData.accuracy,
          message: `Melhora de +${delta}pp em ${newerData.name} — excelente progresso!`,
          severity: "info",
        });
      }
    }
  }

  // Deduplicate: keep only the most severe alert per specialty
  const bestPerSlug = new Map<string, FrictionAlert>();
  const severityOrder = { critical: 0, warning: 1, info: 2 };

  for (const alert of alerts) {
    const existing = bestPerSlug.get(alert.specialty_slug);
    if (!existing || severityOrder[alert.severity] < severityOrder[existing.severity]) {
      bestPerSlug.set(alert.specialty_slug, alert);
    }
  }

  return [...bestPerSlug.values()].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
}
