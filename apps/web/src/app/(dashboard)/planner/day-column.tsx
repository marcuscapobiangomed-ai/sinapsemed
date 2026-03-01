"use client";

import { Plus, Layers, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DaySummary } from "@/lib/planner-queries";
import { formatDayShort, formatMinutes, getSpecialtyColor } from "@/lib/planner-utils";
import { StudyBlock } from "./study-block";

interface DayColumnProps {
  day: DaySummary;
  weekStart: string;
  studyGoalMinutes: number;
  isToday: boolean;
  expanded: boolean;
  onExpand: () => void;
  onAddBlock: (dayOfWeek: number) => void;
  onToggleComplete: (entryId: string, completed: boolean) => void;
  onDeleteBlock: (entryId: string) => void;
}

export function DayColumn({
  day,
  weekStart,
  studyGoalMinutes,
  isToday,
  expanded,
  onExpand,
  onAddBlock,
  onToggleComplete,
  onDeleteBlock,
}: DayColumnProps) {
  const progressPercent =
    studyGoalMinutes > 0
      ? Math.min(100, Math.round((day.total_completed / studyGoalMinutes) * 100))
      : 0;

  // Compact view for non-expanded days on mobile/tablet
  if (!expanded) {
    return (
      <div
        onClick={onExpand}
        className="flex flex-col rounded-xl border border-border bg-card p-2.5 min-h-[120px] cursor-pointer hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{formatDayShort(weekStart, day.day_of_week)}</p>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Mini progress */}
        <div className="mt-1.5">
          <div className="text-xs text-muted-foreground">
            {formatMinutes(day.total_completed)} / {formatMinutes(studyGoalMinutes)}
          </div>
          <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${
                progressPercent >= 100 ? "bg-green-500" : "bg-primary/60"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Compact specialty dots + due cards */}
        <div className="mt-2 flex flex-wrap gap-1">
          {day.entries.slice(0, 4).map((entry) => (
            <span
              key={entry.id}
              className={`h-2.5 w-2.5 rounded-full ${entry.is_completed ? "opacity-40" : ""}`}
              style={{ backgroundColor: getSpecialtyColor(entry.specialty_slug) }}
              title={entry.specialty_name}
            />
          ))}
          {day.entries.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{day.entries.length - 4}</span>
          )}
        </div>

        {day.due_cards > 0 && (
          <div className="mt-auto pt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Layers className="h-2.5 w-2.5" />
            {day.due_cards}
          </div>
        )}
      </div>
    );
  }

  // Expanded view (full detail)
  return (
    <div
      className={`flex flex-col rounded-xl border p-3 min-h-[280px] ${
        isToday
          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card"
      }`}
    >
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>
            {formatDayShort(weekStart, day.day_of_week)}
          </p>
          {isToday && (
            <span className="text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              HOJE
            </span>
          )}
        </div>

        {/* Due cards */}
        {day.due_cards > 0 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Layers className="h-3 w-3" />
            <span>{day.due_cards} para revisar</span>
          </div>
        )}

        {/* Progress: Xh / Yh */}
        <div className="mt-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatMinutes(day.total_completed)} / {formatMinutes(studyGoalMinutes)}
            </span>
            {day.total_planned > 0 && <span>{progressPercent}%</span>}
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progressPercent >= 100
                  ? "bg-green-500"
                  : progressPercent >= 50
                    ? "bg-primary"
                    : "bg-primary/60"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="flex-1 space-y-2">
        {day.entries.map((entry) => (
          <StudyBlock
            key={entry.id}
            entry={entry}
            onToggleComplete={onToggleComplete}
            onDelete={onDeleteBlock}
          />
        ))}
      </div>

      {/* Add button */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full h-7 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => onAddBlock(day.day_of_week)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Adicionar
      </Button>
    </div>
  );
}
