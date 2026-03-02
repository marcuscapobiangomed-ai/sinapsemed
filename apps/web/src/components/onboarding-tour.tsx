"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface OnboardingTourProps {
  userId: string;
  showTour: boolean;
}

export function OnboardingTour({ userId, showTour }: OnboardingTourProps) {
  useEffect(() => {
    if (!showTour) return;

    let cancelled = false;

    async function startTour() {
      const [{ driver: createDriver }] = await Promise.all([
        import("driver.js"),
        // @ts-expect-error CSS import for side-effect
        import("driver.js/dist/driver.css"),
      ]);

      if (cancelled) return;

      const d = createDriver({
        showProgress: true,
        animate: true,
        overlayColor: "rgba(0, 40, 85, 0.7)",
        popoverClass: "sinapsemed-tour",
        steps: [
          {
            element: "[data-tour='sidebar-hoje']",
            popover: {
              title: "Seu Ponto de Partida",
              description:
                "Aqui voce ve o que precisa fazer hoje: cards para revisar, blocos planejados e metas do sprint.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "[data-tour='sidebar-planner']",
            popover: {
              title: "Planner Semanal",
              description:
                "Monte seu plano de estudos por especialidade. A IA sugere um plano otimizado baseado nas suas lacunas.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "[data-tour='sidebar-review']",
            popover: {
              title: "Revisao Inteligente",
              description:
                "O algoritmo FSRS agenda revisoes no momento ideal para fixar o conteudo na memoria de longo prazo.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "[data-tour='sidebar-decks']",
            popover: {
              title: "Seus Decks",
              description:
                "Crie decks de flashcards por especialidade. Use a IA para gerar cards ou importe do Anki.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "[data-tour='sidebar-simulados']",
            popover: {
              title: "Simulados",
              description:
                "Registre seus simulados e acompanhe a evolucao. O sistema analisa seu desempenho por especialidade.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "[data-tour='sidebar-gaps']",
            popover: {
              title: "Lacunas de Conhecimento",
              description:
                "Descubra seus pontos fracos com analise cruzada de flashcards e simulados, ponderada pela sua banca.",
              side: "right",
              align: "start",
            },
          },
          {
            popover: {
              title: "Pronto para comecar!",
              description:
                "Comece pelo Hoje para ver sua missao do dia. Bons estudos!",
            },
          },
        ],
        onDestroyed: async () => {
          const supabase = createClient();
          await supabase
            .from("profiles")
            .update({ onboarding_tour_completed: true })
            .eq("id", userId);
        },
      });

      // Small delay to ensure sidebar is rendered
      setTimeout(() => d.drive(), 500);
    }

    startTour();

    return () => {
      cancelled = true;
    };
  }, [showTour, userId]);

  return null;
}
