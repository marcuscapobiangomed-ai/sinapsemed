"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWeekRange, getMondayOfWeek, shiftWeek } from "@/lib/planner-utils";

interface WeekNavProps {
  weekStart: string;
  onWeekChange: (newWeekStart: string) => void;
  isPremium: boolean;
  onGenerateAI: () => void;
}

export function WeekNav({ weekStart, onWeekChange, isPremium, onGenerateAI }: WeekNavProps) {
  const currentMonday = getMondayOfWeek();
  const isCurrentWeek = weekStart === currentMonday;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onWeekChange(shiftWeek(weekStart, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm font-medium min-w-[180px] text-center">
          {formatWeekRange(weekStart)}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onWeekChange(shiftWeek(weekStart, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {!isCurrentWeek && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onWeekChange(currentMonday)}
          >
            Hoje
          </Button>
        )}
      </div>

      {isPremium && (
        <Button variant="outline" size="sm" onClick={onGenerateAI}>
          <span className="mr-1.5">✨</span>
          Gerar com IA
        </Button>
      )}
    </div>
  );
}
