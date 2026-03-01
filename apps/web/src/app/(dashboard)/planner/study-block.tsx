"use client";

import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanEntry } from "@/lib/planner-queries";
import { formatMinutes, getSpecialtyColor } from "@/lib/planner-utils";

interface StudyBlockProps {
  entry: PlanEntry;
  onToggleComplete: (entryId: string, completed: boolean) => void;
  onDelete: (entryId: string) => void;
}

export function StudyBlock({ entry, onToggleComplete, onDelete }: StudyBlockProps) {
  const color = getSpecialtyColor(entry.specialty_slug);

  return (
    <div
      className={`group relative rounded-lg border p-2.5 transition-colors ${
        entry.is_completed
          ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900"
          : "bg-card border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(entry.id, !entry.is_completed)}
          className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 transition-colors ${
            entry.is_completed
              ? "bg-green-500 border-green-500"
              : "border-muted-foreground/40 hover:border-primary"
          }`}
        >
          {entry.is_completed && (
            <svg viewBox="0 0 12 12" className="text-white" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M2 6l3 3 5-5" />
            </svg>
          )}
        </button>

        {/* Color bar */}
        <div
          className="w-1 self-stretch rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-sm font-medium leading-snug ${
                entry.is_completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {entry.specialty_name}
            </span>
            {entry.is_ai_generated && (
              <Sparkles className="h-3 w-3 text-purple-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatMinutes(entry.planned_minutes)}
          </p>
        </div>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onDelete(entry.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
