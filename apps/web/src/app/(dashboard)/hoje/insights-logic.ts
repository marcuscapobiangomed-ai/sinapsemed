import type { GapAnalysisData } from "@/lib/gap-queries";
import type { Sprint, SprintGoal } from "@/lib/sprint-queries";
import { getSprintProgress } from "@/lib/sprint-queries";
import type { DueBySpecialty } from "./mission-logic";

export interface Insight {
  id: string;
  icon: "alert-triangle" | "trending-up" | "target" | "clock" | "trophy";
  severity: "critical" | "positive" | "info";
  message: string;
  actionHref: string | null;
  actionLabel: string | null;
}

export function computeInsights(input: {
  gapAnalysis: GapAnalysisData;
  dueBySpecialty: DueBySpecialty[];
  activeSprint: Sprint | null;
  sprintGoals: SprintGoal[];
  streak: number;
}): Insight[] {
  const insights: Insight[] = [];

  // TYPE 1: Neglected specialty (due cards + low accuracy)
  for (const due of input.dueBySpecialty) {
    const gap = input.gapAnalysis.specialties.find(
      (s) => s.specialty_slug === due.specialty_slug,
    );
    if (gap && gap.combined_accuracy < 50 && due.count >= 8) {
      insights.push({
        id: `neglected-${due.specialty_slug}`,
        icon: "alert-triangle",
        severity: "critical",
        message: `${due.specialty_name}: ${due.count} cards vencidos e accuracy de apenas ${gap.combined_accuracy}%.`,
        actionHref: `/review?specialty=${due.specialty_slug}`,
        actionLabel: "Revisar agora",
      });
    }
  }

  // TYPE 2: Strong specialty
  const improving = input.gapAnalysis.specialties
    .filter((s) => s.combined_accuracy >= 75 && s.data_confidence !== "low")
    .sort((a, b) => b.combined_accuracy - a.combined_accuracy);

  if (improving.length > 0) {
    const best = improving[0];
    insights.push({
      id: `strong-${best.specialty_slug}`,
      icon: "trending-up",
      severity: "positive",
      message: `${best.specialty_name}: ${best.combined_accuracy}% de acerto. Excelente domínio!`,
      actionHref: null,
      actionLabel: null,
    });
  }

  // TYPE 3: Sprint deadline approaching
  if (input.activeSprint) {
    const progress = getSprintProgress(input.activeSprint);
    const incompleteGoals = input.sprintGoals.filter((g) => !g.is_completed);

    if (progress.daysRemaining <= 14 && incompleteGoals.length > 0) {
      insights.push({
        id: "sprint-deadline",
        icon: "target",
        severity: progress.daysRemaining <= 7 ? "critical" : "info",
        message: `Meta do Sprint: ${incompleteGoals.length === 1 ? "falta 1 meta" : `faltam ${incompleteGoals.length} metas`} (prazo: ${progress.daysRemaining} dias).`,
        actionHref: "/sprints",
        actionLabel: "Ver Sprint",
      });
    }
  }

  // TYPE 4: Streak milestone
  if (input.streak > 0 && input.streak % 7 === 0) {
    insights.push({
      id: "streak-milestone",
      icon: "trophy",
      severity: "positive",
      message: `Sequência de ${input.streak} dias! ${input.streak / 7} ${input.streak / 7 === 1 ? "semana" : "semanas"} consecutivas.`,
      actionHref: null,
      actionLabel: null,
    });
  }

  // TYPE 5: Large overdue count
  const totalDue = input.dueBySpecialty.reduce((s, d) => s + d.count, 0);
  if (totalDue >= 50) {
    insights.push({
      id: "overdue-warning",
      icon: "clock",
      severity: "critical",
      message: `${totalDue} cards acumulados. Considere uma sessão focada de revisão.`,
      actionHref: "/review",
      actionLabel: "Revisar",
    });
  }

  // Sort by severity, cap at 4
  const severityOrder = { critical: 0, info: 1, positive: 2 };
  insights.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  return insights.slice(0, 4);
}
