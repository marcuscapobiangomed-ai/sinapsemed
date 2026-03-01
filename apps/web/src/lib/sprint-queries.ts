import { SupabaseClient } from "@supabase/supabase-js";

// ── Types ──

export interface SprintFocus {
  slug: string;
  name: string;
  weight: number;
  reason: string;
}

export interface Sprint {
  id: string;
  user_id: string;
  title: string;
  sprint_number: number;
  sprint_type: "foundation" | "deepening" | "revision" | "final_80_20";
  start_date: string;
  end_date: string;
  current_phase: "diagnostic" | "active" | "closing" | "completed";
  diagnostic_start: unknown | null;
  diagnostic_end: unknown | null;
  focus_specialties: SprintFocus[];
  total_study_minutes: number;
  total_reviews: number;
  total_simulations: number;
  avg_accuracy: number | null;
  is_80_20_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface SprintGoal {
  id: string;
  sprint_id: string;
  title: string;
  description: string | null;
  goal_type: string;
  target_value: number | null;
  current_value: number;
  specialty_slug: string | null;
  is_completed: boolean;
  completed_at: string | null;
}

export interface SprintProgress {
  dayNumber: number;
  totalDays: number;
  progressPercent: number;
  daysRemaining: number;
  isOverdue: boolean;
}

// ── Queries ──

export async function getActiveSprint(
  supabase: SupabaseClient,
  userId: string,
): Promise<Sprint | null> {
  const { data } = await supabase
    .from("sprints")
    .select("*")
    .eq("user_id", userId)
    .neq("current_phase", "completed")
    .maybeSingle();

  return data as Sprint | null;
}

export async function getSprintGoals(
  supabase: SupabaseClient,
  sprintId: string,
): Promise<SprintGoal[]> {
  const { data } = await supabase
    .from("sprint_goals")
    .select("*")
    .eq("sprint_id", sprintId)
    .order("created_at");

  return (data ?? []) as SprintGoal[];
}

export function getSprintProgress(sprint: Sprint): SprintProgress {
  const start = new Date(sprint.start_date);
  const end = new Date(sprint.end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  ) + 1;

  const elapsed = Math.round(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  ) + 1;

  const dayNumber = Math.max(1, Math.min(elapsed, totalDays));
  const daysRemaining = Math.max(0, totalDays - dayNumber);
  const progressPercent = Math.round((dayNumber / totalDays) * 100);
  const isOverdue = elapsed > totalDays;

  return { dayNumber, totalDays, progressPercent, daysRemaining, isOverdue };
}

export async function getSprintHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<Sprint[]> {
  const { data } = await supabase
    .from("sprints")
    .select("*")
    .eq("user_id", userId)
    .eq("current_phase", "completed")
    .order("end_date", { ascending: false });

  return (data ?? []) as Sprint[];
}

export async function getNextSprintNumber(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from("sprints")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return (count ?? 0) + 1;
}

export async function updateSprintPhase(
  supabase: SupabaseClient,
  sprintId: string,
  phase: Sprint["current_phase"],
) {
  await supabase
    .from("sprints")
    .update({ current_phase: phase })
    .eq("id", sprintId);
}

export const SPRINT_TYPE_LABELS: Record<Sprint["sprint_type"], string> = {
  foundation: "Construcao de Base",
  deepening: "Aprofundamento",
  revision: "Revisao",
  final_80_20: "Reta Final 80/20",
};

export const SPRINT_PHASE_LABELS: Record<Sprint["current_phase"], string> = {
  diagnostic: "Diagnostico",
  active: "Execucao",
  closing: "Fechamento",
  completed: "Concluido",
};
