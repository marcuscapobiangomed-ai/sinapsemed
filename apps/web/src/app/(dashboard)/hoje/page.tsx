import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeekPlan } from "@/lib/planner-queries";
import { getGapAnalysis } from "@/lib/gap-queries";
import { getStreak } from "@/lib/dashboard-queries";
import { getMondayOfWeek, isToday } from "@/lib/planner-utils";
import { TodayClient } from "./today-client";

export const metadata: Metadata = {
  title: "Hoje",
};

export default async function HojePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const weekStart = getMondayOfWeek();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [weekPlan, gapAnalysis, streak, dueResult, reviewsTodayResult] =
    await Promise.all([
      getWeekPlan(supabase, user.id, weekStart),
      getGapAnalysis(supabase, user.id),
      getStreak(supabase, user.id),
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
    ]);

  // Find today's day index (0=Mon .. 6=Sun)
  const todayIndex = weekPlan.days.findIndex((_, i) =>
    isToday(weekStart, i),
  );
  const todayEntries =
    todayIndex >= 0 ? weekPlan.days[todayIndex].entries : [];
  const todayTotalPlanned =
    todayIndex >= 0 ? weekPlan.days[todayIndex].total_planned : 0;
  const todayTotalCompleted =
    todayIndex >= 0 ? weekPlan.days[todayIndex].total_completed : 0;

  return (
    <TodayClient
      entries={todayEntries}
      todayTotalPlanned={todayTotalPlanned}
      todayTotalCompleted={todayTotalCompleted}
      dueCount={dueResult.count ?? 0}
      reviewsToday={reviewsTodayResult.count ?? 0}
      streak={streak}
      topGaps={gapAnalysis.specialties.slice(0, 3)}
      studyGoalMinutes={Math.round(weekPlan.study_hours_goal * 60)}
    />
  );
}
