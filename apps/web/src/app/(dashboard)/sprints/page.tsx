import type { Metadata } from "next";
import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getActiveSprint,
  getSprintGoals,
  getSprintHistory,
  getSprintProgress,
} from "@/lib/sprint-queries";
import { SprintDashboard } from "./sprint-dashboard";
import { SprintClosure } from "./sprint-closure";
import { SprintHistory } from "./sprint-history";
import { CreateSprintDialog } from "./create-sprint-dialog";
import { Rocket } from "lucide-react";

export const metadata: Metadata = { title: "Sprint" };

export default async function SprintsPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  const [activeSprint, history] = await Promise.all([
    getActiveSprint(supabase, user.id).catch(() => null),
    getSprintHistory(supabase, user.id).catch(() => []),
  ]);

  const goals = activeSprint
    ? await getSprintGoals(supabase, activeSprint.id).catch(() => [])
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sprint de Estudo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ciclos de estudo intensivo com metas e acompanhamento
          </p>
        </div>
        {!activeSprint && <CreateSprintDialog userId={user.id} />}
      </div>

      {activeSprint ? (
        (() => {
          const progress = getSprintProgress(activeSprint);
          const showClosure =
            progress.isOverdue && activeSprint.current_phase === "active" ||
            activeSprint.current_phase === "closing";
          return showClosure ? (
            <SprintClosure sprint={activeSprint} />
          ) : (
            <SprintDashboard sprint={activeSprint} goals={goals} />
          );
        })()
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Nenhum Sprint ativo</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Sprints sao ciclos de estudo de 60 a 120 dias. A cada Sprint, a IA
            analisa suas lacunas e define um foco estrategico para maximizar sua
            evolucao.
          </p>
          <div className="mt-6">
            <CreateSprintDialog userId={user.id} />
          </div>
        </div>
      )}

      {history.length > 0 && <SprintHistory sprints={history} />}
    </div>
  );
}
