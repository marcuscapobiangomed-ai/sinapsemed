"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Sprint } from "@/lib/sprint-queries";
import { getSprintProgress, SPRINT_TYPE_LABELS } from "@/lib/sprint-queries";
import { SprintReport } from "./sprint-report";

interface SprintClosureProps {
  sprint: Sprint;
}

export function SprintClosure({ sprint }: SprintClosureProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(sprint.current_phase === "closing");
  const progress = getSprintProgress(sprint);

  async function handleClose() {
    setIsClosing(true);
    try {
      const res = await fetch("/api/sprints/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprint_id: sprint.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao fechar sprint");
      }

      setIsClosed(true);
      toast.success("Sprint concluido!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao fechar sprint",
      );
    } finally {
      setIsClosing(false);
    }
  }

  async function handleComplete() {
    const supabase = createClient();
    await supabase
      .from("sprints")
      .update({ current_phase: "completed" })
      .eq("id", sprint.id);

    toast.success("Sprint finalizado! Inicie o proximo quando estiver pronto.");
    router.push("/sprints");
  }

  if (progress.isOverdue && sprint.current_phase === "active") {
    return (
      <Card className="border-primary/30">
        <CardContent className="flex flex-col items-center py-8 text-center">
          <Trophy className="h-12 w-12 text-primary mb-4" />
          <h2 className="text-xl font-bold">Sprint concluido!</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Seu {SPRINT_TYPE_LABELS[sprint.sprint_type]} de {progress.totalDays} dias
            chegou ao fim. Vamos analisar sua evolucao.
          </p>
          <Button onClick={handleClose} className="mt-6" disabled={isClosing}>
            {isClosing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                Ver Relatorio
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isClosed || sprint.current_phase === "closing") {
    return (
      <div className="space-y-6">
        <SprintReport sprint={sprint} />
        <div className="flex justify-center">
          <Button onClick={handleComplete} size="lg">
            Finalizar e iniciar proximo Sprint
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
