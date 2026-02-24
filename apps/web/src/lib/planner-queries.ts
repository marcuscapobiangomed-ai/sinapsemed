import { SupabaseClient } from "@supabase/supabase-js";
import { formatDate, getDateForDay } from "./planner-utils";

// ── Types ──

export interface PlanEntry {
  id: string;
  day_of_week: number;
  specialty_id: string;
  specialty_name: string;
  specialty_slug: string;
  planned_minutes: number;
  completed_minutes: number;
  is_completed: boolean;
  is_ai_generated: boolean;
  notes: string | null;
}

export interface DayDueCards {
  date: string; // YYYY-MM-DD
  due_count: number;
}

export interface DaySummary {
  day_of_week: number;
  total_planned: number;
  total_completed: number;
  entries: PlanEntry[];
  due_cards: number;
}

export interface WeekPlan {
  week_start: string;
  days: DaySummary[];
  study_hours_goal: number;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
}

// ── Queries ──

export async function getWeekPlan(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string,
): Promise<WeekPlan> {
  const [entriesResult, dueCardsResult, goalResult] = await Promise.all([
    supabase
      .from("study_plan_entries")
      .select("id, day_of_week, specialty_id, planned_minutes, completed_minutes, is_completed, is_ai_generated, notes, specialties(name, slug)")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .order("created_at", { ascending: true }),

    getDueCardsForWeek(supabase, userId, weekStart),

    supabase
      .from("profiles")
      .select("study_hours_per_day")
      .eq("id", userId)
      .single(),
  ]);

  const rawEntries = (entriesResult.data ?? []) as unknown as Array<{
    id: string;
    day_of_week: number;
    specialty_id: string;
    planned_minutes: number;
    completed_minutes: number;
    is_completed: boolean;
    is_ai_generated: boolean;
    notes: string | null;
    specialties: { name: string; slug: string } | null;
  }>;

  // Build due cards map (date string → count)
  const dueMap = new Map<string, number>();
  for (const dc of dueCardsResult) {
    dueMap.set(dc.date, dc.due_count);
  }

  // Build 7-day structure
  const days: DaySummary[] = Array.from({ length: 7 }, (_, i) => {
    const dayEntries = rawEntries
      .filter((e) => e.day_of_week === i)
      .map((e): PlanEntry => ({
        id: e.id,
        day_of_week: e.day_of_week,
        specialty_id: e.specialty_id,
        specialty_name: e.specialties?.name ?? "—",
        specialty_slug: e.specialties?.slug ?? "",
        planned_minutes: e.planned_minutes,
        completed_minutes: e.completed_minutes,
        is_completed: e.is_completed,
        is_ai_generated: e.is_ai_generated,
        notes: e.notes,
      }));

    const dateStr = formatDate(getDateForDay(weekStart, i));

    return {
      day_of_week: i,
      total_planned: dayEntries.reduce((sum, e) => sum + e.planned_minutes, 0),
      total_completed: dayEntries.reduce((sum, e) => sum + e.completed_minutes, 0),
      entries: dayEntries,
      due_cards: dueMap.get(dateStr) ?? 0,
    };
  });

  const studyGoal = Number(goalResult.data?.study_hours_per_day ?? 4);

  return { week_start: weekStart, days, study_hours_goal: studyGoal };
}

async function getDueCardsForWeek(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string,
): Promise<DayDueCards[]> {
  const weekEnd = formatDate(getDateForDay(weekStart, 6));

  const { data } = await supabase.rpc("get_due_cards_per_day", {
    p_user_id: userId,
    p_start_date: weekStart,
    p_end_date: weekEnd,
  });

  return (data ?? []).map((row: { due_date: string; due_count: number }) => ({
    date: row.due_date,
    due_count: Number(row.due_count),
  }));
}

export async function getSpecialties(
  supabase: SupabaseClient,
): Promise<Specialty[]> {
  const { data } = await supabase
    .from("specialties")
    .select("id, name, slug")
    .order("name");
  return (data ?? []) as Specialty[];
}
