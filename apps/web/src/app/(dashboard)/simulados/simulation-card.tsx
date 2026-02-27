"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, FileText, Pencil } from "lucide-react";
import type { Simulation } from "@/lib/simulation-queries";

interface SimulationCardProps {
  simulation: Simulation;
  onDelete: (id: string) => void;
  onEdit: (simulation: Simulation) => void;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return "text-green-600 dark:text-green-400";
  if (accuracy >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export function SimulationCard({ simulation, onDelete, onEdit }: SimulationCardProps) {
  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">
                {simulation.title}
              </h3>
              {simulation.banca_name && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {simulation.banca_name}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatDate(simulation.exam_date)}</span>
              {simulation.source && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {simulation.source}
                  </span>
                </>
              )}
              {simulation.duration_minutes && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {simulation.duration_minutes}min
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className={`text-lg font-bold ${getAccuracyColor(simulation.accuracy)}`}>
                {simulation.accuracy}%
              </p>
              <p className="text-xs text-muted-foreground">
                {simulation.correct_answers}/{simulation.total_questions}
              </p>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(simulation)}
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(simulation.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
