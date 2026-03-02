"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  TrendingUp,
  Target,
  Clock,
  Trophy,
  ArrowRight,
} from "lucide-react";
import type { Insight } from "./insights-logic";

const iconMap = {
  "alert-triangle": AlertTriangle,
  "trending-up": TrendingUp,
  target: Target,
  clock: Clock,
  trophy: Trophy,
} as const;

const severityStyles = {
  critical: "text-destructive",
  positive: "text-green-500",
  info: "text-primary",
} as const;

interface SmartInsightsProps {
  insights: Insight[];
}

export function SmartInsights({ insights }: SmartInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold">Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        {insights.map((insight) => {
          const Icon = iconMap[insight.icon];
          const colorClass = severityStyles[insight.severity];

          return (
            <div key={insight.id} className="flex items-start gap-3">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorClass}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">
                  {insight.message}
                </p>
                {insight.actionHref && (
                  <Link
                    href={insight.actionHref}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    {insight.actionLabel}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
