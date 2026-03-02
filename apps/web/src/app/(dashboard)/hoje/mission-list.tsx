"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks, Calendar } from "lucide-react";
import type { Mission } from "./mission-logic";
import { MissionItem } from "./mission-item";

interface MissionListProps {
  missions: Mission[];
  onToggleEntry: (entryId: string, completed: boolean) => void;
}

export function MissionList({ missions, onToggleEntry }: MissionListProps) {
  const totalMissions = missions.length;
  const completedMissions = missions.filter((m) => m.isCompleted).length;

  if (totalMissions === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Missões do Dia</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Nenhuma missão para hoje</p>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione blocos no Planner ou crie flashcards para revisar
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/planner">Ir para Planner</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Missões do Dia</h2>
        <Badge variant="secondary" className="text-xs">
          {completedMissions}/{totalMissions}
        </Badge>
      </div>

      <div className="space-y-2">
        {missions.map((mission) => (
          <MissionItem
            key={mission.id}
            mission={mission}
            onToggle={onToggleEntry}
          />
        ))}
      </div>
    </div>
  );
}
