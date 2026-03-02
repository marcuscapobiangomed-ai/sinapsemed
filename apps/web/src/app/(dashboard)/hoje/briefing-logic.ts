import type { GapAnalysisData } from "@/lib/gap-queries";
import type { Sprint, SprintGoal } from "@/lib/sprint-queries";
import { getSprintProgress } from "@/lib/sprint-queries";
import type { PlanEntry } from "@/lib/planner-queries";

export interface BriefingMessage {
  greeting: string;
  headline: string;
  subtext: string;
  tone: "motivational" | "urgent" | "celebration" | "neutral";
}

interface BriefingInput {
  firstName: string;
  streak: number;
  dueCount: number;
  reviewsToday: number;
  totalCompleted: number;
  studyGoalMinutes: number;
  gapAnalysis: GapAnalysisData;
  activeSprint: Sprint | null;
  sprintGoals: SprintGoal[];
  entries: PlanEntry[];
}

export function computeBriefing(input: BriefingInput): BriefingMessage {
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const greeting = `${timeGreeting}, ${input.firstName}!`;

  // PRIORITY 1: Goal already completed today
  if (
    input.totalCompleted >= input.studyGoalMinutes &&
    input.studyGoalMinutes > 0
  ) {
    return {
      greeting,
      headline: "Meta do dia atingida! Você é imparável.",
      subtext: `${input.reviewsToday} revisões feitas. Descanse ou continue estudando.`,
      tone: "celebration",
    };
  }

  // PRIORITY 2: Streak at risk
  if (input.streak > 2 && input.reviewsToday === 0) {
    return {
      greeting,
      headline: `Streak de ${input.streak} dias — não quebre a sequência!`,
      subtext: `Você tem ${input.dueCount} cards esperando revisão.`,
      tone: "urgent",
    };
  }

  // PRIORITY 3: Critical gap
  const criticalGap = input.gapAnalysis.specialties.find(
    (s) =>
      s.combined_accuracy < 40 &&
      s.banca_weight > 0.05 &&
      s.data_confidence !== "low",
  );
  if (criticalGap) {
    return {
      greeting,
      headline: `Sua accuracy em ${criticalGap.specialty_name} está em ${criticalGap.combined_accuracy}%.`,
      subtext: "Priorizei cards dessa área nas missões do dia.",
      tone: "urgent",
    };
  }

  // PRIORITY 4: Sprint context
  if (input.activeSprint) {
    const progress = getSprintProgress(input.activeSprint);
    const completedGoals = input.sprintGoals.filter(
      (g) => g.is_completed,
    ).length;
    const totalGoals = input.sprintGoals.length;
    const focusNames = input.activeSprint.focus_specialties
      .map((f) => f.name)
      .join(", ");

    if (progress.daysRemaining <= 7 && progress.daysRemaining > 0) {
      return {
        greeting,
        headline: `Reta final do Sprint! ${progress.daysRemaining} dias restantes.`,
        subtext:
          totalGoals > 0
            ? `Metas atingidas: ${completedGoals} de ${totalGoals}.`
            : `Foco: ${focusNames}.`,
        tone: "urgent",
      };
    }

    return {
      greeting,
      headline: `Dia ${progress.dayNumber} do ${input.activeSprint.title}.`,
      subtext:
        totalGoals > 0
          ? `Metas: ${completedGoals}/${totalGoals}. Foco: ${focusNames}.`
          : `Foco: ${focusNames}.`,
      tone: "motivational",
    };
  }

  // PRIORITY 5: Heavy review day
  if (input.dueCount >= 30) {
    return {
      greeting,
      headline: `${input.dueCount} cards esperando revisão — dia intenso!`,
      subtext: "Comece pelas revisões urgentes. Cada card conta.",
      tone: "motivational",
    };
  }

  // PRIORITY 6: Default
  const pendingBlocks = input.entries.filter((e) => !e.is_completed).length;
  return {
    greeting,
    headline:
      pendingBlocks > 0
        ? `${pendingBlocks} ${pendingBlocks === 1 ? "bloco" : "blocos"} de estudo e ${input.dueCount} cards para hoje.`
        : input.dueCount > 0
          ? `${input.dueCount} cards para revisar hoje.`
          : "Nenhuma tarefa pendente. Aproveite para criar cards novos!",
    subtext:
      input.streak > 0
        ? `Sequência de ${input.streak} ${input.streak === 1 ? "dia" : "dias"}. Continue assim!`
        : "Comece uma sequência de estudos hoje!",
    tone: "neutral",
  };
}
