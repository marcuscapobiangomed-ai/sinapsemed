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

  const radius = 40;
  const strokeWidth = 5;
  const size = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-8">
          {/* SVG Ring */}
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className="stroke-muted"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
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
              <span className="text-xl font-bold leading-none">{percent}%</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">do dia</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-14 bg-border shrink-0" />

          {/* Mini Stats */}
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-base font-bold leading-none">{streak}</span>
              <span className="text-[10px] text-muted-foreground">dias</span>
            </div>

            <Link href="/review" className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-bold leading-none">{dueCount}</span>
              <span className="text-[10px] text-muted-foreground">cards</span>
            </Link>

            <div className="flex flex-col items-center gap-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-base font-bold leading-none">{reviewsToday}</span>
              <span className="text-[10px] text-muted-foreground">revisões</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
