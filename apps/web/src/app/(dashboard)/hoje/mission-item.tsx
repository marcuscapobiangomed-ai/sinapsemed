"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight } from "lucide-react";
import { getSpecialtyColor } from "@/lib/planner-utils";
import type { Mission } from "./mission-logic";

const priorityConfig = {
  urgente: {
    label: "Urgente",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  planejado: {
    label: "Planejado",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  meta: {
    label: "Meta",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
} as const;

interface MissionItemProps {
  mission: Mission;
  onToggle?: (entryId: string, completed: boolean) => void;
}

export function MissionItem({ mission, onToggle }: MissionItemProps) {
  const config = priorityConfig[mission.priority];

  return (
    <Card className={mission.isCompleted ? "opacity-50" : ""}>
      <CardContent className="flex items-center gap-3 p-4">
        {/* Left: Checkbox or color bar */}
        {mission.type === "planner_block" && mission.planEntryId ? (
          <Checkbox
            checked={mission.isCompleted}
            onCheckedChange={(checked: boolean) =>
              onToggle?.(mission.planEntryId!, checked)
            }
            className="shrink-0"
          />
        ) : null}

        {mission.specialtySlug && (
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{
              backgroundColor: getSpecialtyColor(mission.specialtySlug),
            }}
          />
        )}

        {/* Center: Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-medium ${mission.isCompleted ? "line-through text-muted-foreground" : ""}`}
            >
              {mission.title}
            </span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 leading-4 shrink-0 ${config.className}`}>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mission.subtitle}
            {mission.estimatedMinutes ? ` · ~${mission.estimatedMinutes}min` : ""}
          </p>
          {mission.type === "sprint_goal" &&
            mission.targetValue != null &&
            mission.targetValue > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{
                    width: `${Math.min(100, Math.round(((mission.currentValue ?? 0) / mission.targetValue) * 100))}%`,
                  }}
                />
              </div>
            )}
        </div>

        {/* Right: Action */}
        {!mission.isCompleted && mission.type !== "planner_block" && (
          <Button asChild variant="outline" size="sm" className="shrink-0 h-8 text-xs">
            <Link href={mission.actionHref}>
              {mission.actionLabel}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
