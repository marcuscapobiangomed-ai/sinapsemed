"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { createClient } from "@/lib/supabase/client";

interface OnboardingTourProps {
  userId: string;
  showTour: boolean;
}

export function OnboardingTour({ userId, showTour }: OnboardingTourProps) {
  useEffect(() => {
    if (!showTour) return;

    const d = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0, 40, 85, 0.7)",
      popoverClass: "sinapsemed-tour",
      steps: [
        {
          element: "[data-tour='sidebar-hoje']",
          popover: {
            title: "Sua Missao do Dia",
            description:
              "Aqui voce ve o que precisa estudar hoje: cards para revisar, blocos planejados e lacunas prioritarias.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "[data-tour='sidebar-decks']",
          popover: {
            title: "Seus Decks",
            description:
              "Crie decks de flashcards por especialidade. Use OCR para importar questoes de provas.",
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
          element: "[data-tour='sidebar-planner']",
          popover: {
            title: "Planner Semanal",
            description:
              "Monte seu plano de estudos por especialidade. A IA pode sugerir um plano otimizado baseado nas suas lacunas.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "[data-tour='sidebar-simulados']",
          popover: {
            title: "Simulados",
            description:
              "Registre seus simulados e acompanhe a evolucao. O sistema analisa seu desempenho por especialidade e dificuldade.",
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
              "Comece criando seu primeiro deck ou registrando um simulado. Bons estudos!",
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
    const timer = setTimeout(() => d.drive(), 500);
    return () => clearTimeout(timer);
  }, [showTour, userId]);

  return null;
}
