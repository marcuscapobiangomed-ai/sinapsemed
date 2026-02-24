"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import type { ApprovalPrediction } from "@/lib/prediction-queries";

interface PredictionCardProps {
  prediction: ApprovalPrediction;
}

function getProbabilityColor(p: number): string {
  if (p >= 70) return "text-green-600 dark:text-green-400";
  if (p >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getProbabilityBg(p: number): string {
  if (p >= 70) return "bg-green-500/10";
  if (p >= 50) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function getProgressColor(p: number): string {
  if (p >= 70) return "bg-green-500";
  if (p >= 50) return "bg-amber-500";
  return "bg-red-500";
}

const trendConfig = {
  improving: { icon: TrendingUp, label: "Melhorando", color: "text-green-600 dark:text-green-400" },
  stable: { icon: Minus, label: "Estável", color: "text-muted-foreground" },
  declining: { icon: TrendingDown, label: "Caindo", color: "text-red-600 dark:text-red-400" },
};

const confidenceLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export function PredictionCard({ prediction }: PredictionCardProps) {
  const {
    probability,
    confidence,
    trend,
    banca_name,
    strengths,
    critical_gaps,
    data_points,
  } = prediction;

  const TrendIcon = trendConfig[trend].icon;
  const hasData = data_points > 0;

  if (!hasData) {
    return (
      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Previsão de Aprovação
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Comece a estudar para ver sua previsão de aprovação.
          </p>
          <Button asChild size="sm" variant="outline" className="w-full gap-1.5">
            <Link href="/review">
              Começar revisão
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Previsão de Aprovação
          </CardTitle>
          {banca_name && (
            <Badge variant="secondary" className="text-xs">
              {banca_name}
            </Badge>
          )}
        </div>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main probability */}
        <div className="flex items-end gap-3">
          <div className={`flex items-center justify-center h-16 w-16 rounded-full ${getProbabilityBg(probability)}`}>
            <span className={`text-2xl font-bold ${getProbabilityColor(probability)}`}>
              {probability}%
            </span>
          </div>
          <div className="space-y-1 pb-1">
            <div className="flex items-center gap-1.5">
              <TrendIcon className={`h-3.5 w-3.5 ${trendConfig[trend].color}`} />
              <span className={`text-xs font-medium ${trendConfig[trend].color}`}>
                {trendConfig[trend].label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Confiança: {confidenceLabels[confidence]}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getProgressColor(probability)}`}
              style={{ width: `${probability}%` }}
            />
          </div>
        </div>

        {/* Strengths & Gaps */}
        <div className="space-y-2">
          {strengths.length > 0 && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Fortes:</span>{" "}
                {strengths.join(", ")}
              </p>
            </div>
          )}
          {critical_gaps.length > 0 && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-red-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Críticas:</span>{" "}
                {critical_gaps.join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <Button asChild size="sm" variant="outline" className="w-full gap-1.5 text-xs h-7">
          <Link href="/gaps">
            Ver análise completa
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
