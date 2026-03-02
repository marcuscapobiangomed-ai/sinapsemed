"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ListChecks,
  Trophy,
  Stethoscope,
  ArrowRight,
  Calendar,
} from "lucide-react";
import type { PageMode } from "./page-mode";
import type { BriefingMessage } from "./briefing-logic";
import type { Mission } from "./mission-logic";
import { MissionItem } from "./mission-item";

interface PrimaryActionProps {
  pageMode: PageMode;
  briefing: BriefingMessage;
  plannerMissions: Mission[];
  onToggleEntry: (entryId: string, completed: boolean) => void;
  onClinicalTrigger: () => void;
}

export function PrimaryAction({
  pageMode,
  briefing,
  plannerMissions,
  onToggleEntry,
  onClinicalTrigger,
}: PrimaryActionProps) {
  switch (pageMode.mode) {
    case "review":
      return <ReviewHeroCTA pageMode={pageMode} briefing={briefing} />;
    case "planner":
      return (
        <PlannerFocus
          pageMode={pageMode}
          missions={plannerMissions}
          onToggleEntry={onToggleEntry}
        />
      );
    case "done":
      return (
        <CelebrationCard
          pageMode={pageMode}
          onClinicalTrigger={onClinicalTrigger}
        />
      );
  }
}

/* ── Review Mode ── */

function ReviewHeroCTA({
  pageMode,
  briefing,
}: {
  pageMode: Extract<PageMode, { mode: "review" }>;
  briefing: BriefingMessage;
}) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="py-8 text-center space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{briefing.headline}</p>
          <h2 className="text-2xl font-bold mt-1">
            {pageMode.dueCount} cards para revisar
          </h2>
          {pageMode.topSpecialties.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {pageMode.topSpecialties
                .map((s) => `${s.specialty_name} (${s.count})`)
                .join(" · ")}
            </p>
          )}
        </div>
        <Button asChild size="lg" className="px-8">
          <Link href="/review">
            <BookOpen className="h-4 w-4" />
            Revisar Agora
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          <Link
            href="/review?mode=quick"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Pouco tempo? Revisão rápida (~5 min)
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

/* ── Planner Mode ── */

function PlannerFocus({
  pageMode,
  missions,
  onToggleEntry,
}: {
  pageMode: Extract<PageMode, { mode: "planner" }>;
  missions: Mission[];
  onToggleEntry: (entryId: string, completed: boolean) => void;
}) {
  const completedCount = missions.filter((m) => m.isCompleted).length;

  if (missions.length === 0 && pageMode.dueCount > 0) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6 text-center space-y-3">
          <BookOpen className="h-8 w-8 text-primary mx-auto" />
          <div>
            <h2 className="text-base font-bold">
              {pageMode.dueCount} cards para revisar
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhum bloco planejado para hoje
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/review">
              <BookOpen className="h-3.5 w-3.5" />
              Revisar Agora
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (missions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium">Nenhuma missão para hoje</p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione blocos no Planner para organizar seus estudos
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/planner">Ir para Planner</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 py-3 px-4">
        <ListChecks className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold flex-1">Blocos de Hoje</h2>
        <Badge variant="secondary" className="text-xs">
          {completedCount}/{missions.length}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {missions.map((mission) => (
            <MissionItem
              key={mission.id}
              mission={mission}
              onToggle={onToggleEntry}
            />
          ))}
        </div>
        {pageMode.dueCount > 0 && (
          <div className="px-4 py-3 border-t bg-muted/30">
            <Link
              href="/review"
              className="flex items-center justify-between text-sm text-primary hover:underline"
            >
              <span>
                {pageMode.dueCount} cards pendentes de revisão
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Done Mode ── */

function CelebrationCard({
  pageMode,
  onClinicalTrigger,
}: {
  pageMode: Extract<PageMode, { mode: "done" }>;
  onClinicalTrigger: () => void;
}) {
  return (
    <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
      <CardContent className="py-8 text-center space-y-4">
        <Trophy className="h-12 w-12 text-green-500 mx-auto" />
        <div>
          <h2 className="text-lg font-bold">Dia completo!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pageMode.reviewsToday} revisões · {pageMode.totalCompleted}min
            estudados
          </p>
          {pageMode.streak > 0 && (
            <p className="text-sm text-muted-foreground">
              Sequência de {pageMode.streak} dias
            </p>
          )}
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={onClinicalTrigger}>
            <Stethoscope className="h-4 w-4" />
            Vi no Plantão
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/review?mode=quick">
              <BookOpen className="h-4 w-4" />
              Estudar mais
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
