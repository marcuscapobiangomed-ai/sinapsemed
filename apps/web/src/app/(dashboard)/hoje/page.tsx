import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getWeekPlan } from "@/lib/planner-queries";
import { getGapAnalysis } from "@/lib/gap-queries";
import { getStreak } from "@/lib/dashboard-queries";
import { getActiveSprint, getSprintGoals } from "@/lib/sprint-queries";
import { getMondayOfWeek, isToday } from "@/lib/planner-utils";
import { TodayClient } from "./today-client";
import type { DueBySpecialty } from "./mission-logic";

export const metadata: Metadata = {
  title: "Hoje",
};

export default async function HojePage() {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) redirect("/login");

  const weekStart = getMondayOfWeek();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const EMPTY_WEEK: import("@/lib/planner-queries").WeekPlan = {
    week_start: weekStart,
    study_hours_goal: 4,
    days: Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, entries: [], total_planned: 0, total_completed: 0, due_cards: 0 })),
  };
  const EMPTY_GAP: import("@/lib/gap-queries").GapAnalysisData = { specialties: [], banca_name: null, total_flashcard_reviews: 0, total_simulation_questions: 0, has_flashcard_data: false, has_simulation_data: false, overall_accuracy: 0 };

  // .catch() prevents single failure from crashing the entire page
  const [
    weekPlan,
    gapAnalysis,
    streak,
    activeSprint,
    dueResult,
    reviewsTodayResult,
    dueBySpecialtyRaw,
    profileResult,
  ] = await Promise.all([
    getWeekPlan(supabase, user.id, weekStart).catch(() => EMPTY_WEEK),
    getGapAnalysis(supabase, user.id).catch(() => EMPTY_GAP),
    getStreak(supabase, user.id).catch(() => 0),
    getActiveSprint(supabase, user.id).catch(() => null),
    supabase
      .from("flashcards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_suspended", false)
      .or(
        `next_review_at.is.null,next_review_at.lte.${new Date().toISOString()}`,
      ),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("reviewed_at", todayStart.toISOString())
      .lt("reviewed_at", tomorrowStart.toISOString()),
    supabase
      .from("flashcards")
      .select("specialty_id, specialties(name, slug)")
      .eq("user_id", user.id)
      .eq("is_suspended", false)
      .or(
        `next_review_at.is.null,next_review_at.lte.${new Date().toISOString()}`,
      ),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  const sprintGoals = activeSprint
    ? await getSprintGoals(supabase, activeSprint.id).catch(() => [])
    : [];

  // Group due cards by specialty
  const dueMap = new Map<string, DueBySpecialty>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (dueBySpecialtyRaw.data ?? []) as any[]) {
    const spec = row.specialties;
    if (!spec?.slug) continue;
    const existing = dueMap.get(spec.slug);
    if (existing) {
      existing.count++;
    } else {
      dueMap.set(spec.slug, {
        specialty_name: spec.name,
        specialty_slug: spec.slug,
        count: 1,
      });
    }
  }
  const dueBySpecialty = Array.from(dueMap.values()).sort(
    (a, b) => b.count - a.count,
  );

  const todayIndex = weekPlan.days.findIndex((_, i) =>
    isToday(weekStart, i),
  );
  const todayEntries =
    todayIndex >= 0 ? weekPlan.days[todayIndex].entries : [];
  const todayTotalPlanned =
    todayIndex >= 0 ? weekPlan.days[todayIndex].total_planned : 0;
  const todayTotalCompleted =
    todayIndex >= 0 ? weekPlan.days[todayIndex].total_completed : 0;

  const firstName =
    profileResult.data?.full_name?.split(" ")[0] ?? "estudante";

  return (
    <TodayClient
      firstName={firstName}
      entries={todayEntries}
      todayTotalPlanned={todayTotalPlanned}
      todayTotalCompleted={todayTotalCompleted}
      dueCount={dueResult.count ?? 0}
      reviewsToday={reviewsTodayResult.count ?? 0}
      streak={streak}
      gapAnalysis={gapAnalysis}
      dueBySpecialty={dueBySpecialty}
      sprintGoals={sprintGoals}
      studyGoalMinutes={Math.round(weekPlan.study_hours_goal * 60)}
      activeSprint={activeSprint}
    />
  );
}
