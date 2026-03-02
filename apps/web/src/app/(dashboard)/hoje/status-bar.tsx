"use client";

import { Flame, CheckCircle2 } from "lucide-react";

interface StatusBarProps {
  greeting: string;
  streak: number;
  reviewsToday: number;
  totalCompleted: number;
  studyGoalMinutes: number;
}

export function StatusBar({
  greeting,
  streak,
  reviewsToday,
  totalCompleted,
  studyGoalMinutes,
}: StatusBarProps) {
  const percent =
    studyGoalMinutes > 0
      ? Math.min(100, Math.round((totalCompleted / studyGoalMinutes) * 100))
      : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{greeting}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {streak > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              {streak}d
            </span>
          )}
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            {reviewsToday} revisões
          </span>
          <span className="tabular-nums font-medium">{percent}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percent >= 100 ? "bg-green-500" : "bg-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
