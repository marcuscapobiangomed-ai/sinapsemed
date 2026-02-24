"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSpecialtyColor } from "@/lib/planner-utils";
import type { SpecialtyGap } from "@/lib/gap-queries";

interface SpecialtyDetailListProps {
  specialties: SpecialtyGap[];
  hasBanca: boolean;
}

function getPriorityBadge(gap: SpecialtyGap) {
  const hasData = gap.flashcard_review_count > 0 || gap.simulation_question_count > 0;

  if (!hasData) {
    return (
      <Badge variant="outline" className="text-xs">
        SEM DADOS
      </Badge>
    );
  }

  if (gap.priority_score >= 0.15) {
    return (
      <Badge variant="destructive" className="text-xs">
        CRÍTICO
      </Badge>
    );
  }

  if (gap.priority_score >= 0.08) {
    return (
      <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
        ATENÇÃO
      </Badge>
    );
  }

  return (
    <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
      BOM
    </Badge>
  );
}

function getConfidenceLabel(confidence: "low" | "medium" | "high"): string {
  switch (confidence) {
    case "low": return "Baixa";
    case "medium": return "Média";
    case "high": return "Alta";
  }
}

export function SpecialtyDetailList({ specialties, hasBanca }: SpecialtyDetailListProps) {
  if (specialties.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Detalhamento por Especialidade</h2>
      {specialties.map((gap) => {
        const color = getSpecialtyColor(gap.specialty_slug);
        const hasData = gap.flashcard_review_count > 0 || gap.simulation_question_count > 0;

        return (
          <Card key={gap.specialty_slug}>
            <CardContent className="p-4">
              {/* Header: nome + badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium text-sm">
                    {gap.specialty_name}
                  </span>
                </div>
                {getPriorityBadge(gap)}
              </div>

              {hasData ? (
                <>
                  {/* Barra de progresso */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Acerto combinado</span>
                      <span className="font-semibold">{gap.combined_accuracy}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${gap.combined_accuracy}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div>
                      Flashcards:{" "}
                      {gap.flashcard_accuracy !== null ? (
                        <span className="text-foreground font-medium">
                          {gap.flashcard_accuracy}%
                        </span>
                      ) : (
                        <span>&mdash;</span>
                      )}
                      {gap.flashcard_review_count > 0 && (
                        <span> ({gap.flashcard_review_count} rev.)</span>
                      )}
                    </div>
                    <div>
                      Simulados:{" "}
                      {gap.simulation_accuracy !== null ? (
                        <span className="text-foreground font-medium">
                          {gap.simulation_accuracy}%
                        </span>
                      ) : (
                        <span>&mdash;</span>
                      )}
                      {gap.simulation_question_count > 0 && (
                        <span> ({gap.simulation_question_count} quest.)</span>
                      )}
                    </div>
                    {hasBanca && gap.banca_weight > 0 && (
                      <div>
                        Peso na banca:{" "}
                        <span className="text-foreground font-medium">
                          {Math.round(gap.banca_weight * 100)}%
                        </span>
                      </div>
                    )}
                    <div>
                      Confiança:{" "}
                      <span className="text-foreground font-medium">
                        {getConfidenceLabel(gap.data_confidence)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sem dados ainda &mdash; comece a estudar esta especialidade
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
