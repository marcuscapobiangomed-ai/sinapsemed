"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  TrendingUp,
  Target,
  Trophy,
  ArrowRight,
} from "lucide-react";
import type { Insight } from "./insights-logic";

const iconMap = {
  "alert-triangle": AlertTriangle,
  "trending-up": TrendingUp,
  target: Target,
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
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4">
        {insights.map((insight) => {
          const Icon = iconMap[insight.icon];
          const colorClass = severityStyles[insight.severity];

          return (
            <div key={insight.id} className="flex items-start gap-2.5">
              <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${colorClass}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-snug">
                  {insight.message}
                </p>
                {insight.actionHref && (
                  <Link
                    href={insight.actionHref}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-0.5"
                  >
                    {insight.actionLabel}
                    <ArrowRight className="h-2.5 w-2.5" />
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
