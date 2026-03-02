"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flame, AlertTriangle, Target, Trophy, Sun } from "lucide-react";
import type { BriefingMessage } from "./briefing-logic";

const toneStyles = {
  celebration: "border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5",
  urgent: "border-destructive/30 bg-gradient-to-r from-destructive/5 to-orange-500/5",
  motivational: "border-primary/30 bg-gradient-to-r from-primary/5 to-blue-500/5",
  neutral: "border-border",
} as const;

const toneIcons = {
  celebration: <Trophy className="h-8 w-8 text-green-500" />,
  urgent: <AlertTriangle className="h-8 w-8 text-destructive" />,
  motivational: <Target className="h-8 w-8 text-primary" />,
  neutral: <Sun className="h-8 w-8 text-amber-500" />,
} as const;

interface DailyBriefingProps {
  briefing: BriefingMessage;
  streak: number;
}

export function DailyBriefing({ briefing, streak }: DailyBriefingProps) {
  return (
    <Card className={toneStyles[briefing.tone]}>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="shrink-0">
          {briefing.tone === "urgent" && streak > 2 ? (
            <Flame className="h-8 w-8 text-orange-500" />
          ) : (
            toneIcons[briefing.tone]
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium">
            {briefing.greeting}
          </p>
          <h1 className="text-lg font-bold mt-0.5 leading-snug">
            {briefing.headline}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {briefing.subtext}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
