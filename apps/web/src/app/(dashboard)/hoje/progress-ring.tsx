"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, BookOpen, CheckCircle2 } from "lucide-react";

interface ProgressRingProps {
  totalCompleted: number;
  studyGoalMinutes: number;
  streak: number;
  dueCount: number;
  reviewsToday: number;
}

export function ProgressRing({
  totalCompleted,
  studyGoalMinutes,
  streak,
  dueCount,
  reviewsToday,
}: ProgressRingProps) {
  const percent =
    studyGoalMinutes > 0
      ? Math.min(100, Math.round((totalCompleted / studyGoalMinutes) * 100))
      : 0;

  const radius = 44;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <Card>
      <CardContent className="flex items-center gap-6 py-4">
        {/* SVG Ring */}
        <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            className="transform -rotate-90"
          >
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              className="stroke-muted"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              className={percent >= 100 ? "stroke-green-500" : "stroke-primary"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{percent}%</span>
            <span className="text-[10px] text-muted-foreground">do dia</span>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="flex-1 grid grid-cols-3 gap-3">
          <div className="text-center">
            <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{streak}</p>
            <p className="text-[10px] text-muted-foreground">dias</p>
          </div>

          <Link href="/review" className="text-center hover:opacity-80 transition-opacity">
            <BookOpen className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{dueCount}</p>
            <p className="text-[10px] text-muted-foreground">cards</p>
          </Link>

          <div className="text-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{reviewsToday}</p>
            <p className="text-[10px] text-muted-foreground">revisões</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
