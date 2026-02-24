"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  BarChart3,
  BookOpen,
  ClipboardList,
  Brain,
} from "lucide-react";
import { PriorityChart } from "./priority-chart";
import { SpecialtyDetailList } from "./specialty-detail-list";
import type { GapAnalysisData } from "@/lib/gap-queries";

interface GapsDashboardProps {
  data: GapAnalysisData;
}

export function GapsDashboard({ data }: GapsDashboardProps) {
  const hasData = data.has_flashcard_data || data.has_simulation_data;
  const hasBanca = data.banca_name !== null;

  // Estado vazio
  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Lacunas de Conhecimento</h1>
          <p className="text-muted-foreground text-sm">
            Identifique seus pontos fracos e priorize o estudo
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">Sem dados suficientes</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Revise flashcards ou registre simulados para que possamos detectar
              suas lacunas de conhecimento
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/review">Revisar Flashcards</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/simulados">Registrar Simulado</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Lacunas de Conhecimento</h1>
          {hasBanca && (
            <Badge variant="secondary" className="text-xs">
              {data.banca_name}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Identifique seus pontos fracos e priorize o estudo
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Acerto Geral
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.overall_accuracy}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Especialidades
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.specialties.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revisões FC
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.total_flashcard_reviews}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questões Sim.
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.total_simulation_questions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Chart */}
      <PriorityChart data={data.specialties} hasBanca={hasBanca} />

      {/* Detail List */}
      <SpecialtyDetailList specialties={data.specialties} hasBanca={hasBanca} />
    </div>
  );
}
