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
    <Card className={mission.isCompleted ? "opacity-60" : ""}>
      <CardContent className="flex items-center gap-3 py-3">
        {/* Checkbox for planner blocks */}
        {mission.type === "planner_block" && mission.planEntryId ? (
          <Checkbox
            checked={mission.isCompleted}
            onCheckedChange={(checked: boolean) =>
              onToggle?.(mission.planEntryId!, checked)
            }
          />
        ) : (
          <div className="w-4" />
        )}

        {/* Specialty color bar */}
        {mission.specialtySlug && (
          <div
            className="w-1 h-8 rounded-full shrink-0"
            style={{
              backgroundColor: getSpecialtyColor(mission.specialtySlug),
            }}
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-medium truncate ${mission.isCompleted ? "line-through" : ""}`}
            >
              {mission.title}
            </p>
            <Badge variant="outline" className={`text-[10px] px-1.5 shrink-0 ${config.className}`}>
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground truncate">
              {mission.subtitle}
            </span>
            {mission.estimatedMinutes && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                ~{mission.estimatedMinutes}min
              </span>
            )}
          </div>
          {/* Progress bar for sprint goals */}
          {mission.type === "sprint_goal" &&
            mission.targetValue != null &&
            mission.targetValue > 0 && (
              <div className="mt-1.5">
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((mission.currentValue ?? 0) / mission.targetValue * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
        </div>

        {/* Action button */}
        {!mission.isCompleted && mission.type !== "planner_block" && (
          <Button asChild variant="ghost" size="sm" className="shrink-0">
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
