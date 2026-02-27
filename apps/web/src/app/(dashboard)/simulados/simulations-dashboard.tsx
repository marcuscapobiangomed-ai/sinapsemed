"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Plus,
  Lock,
  TrendingUp,
  TrendingDown,
  Target,
  Hash,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SimulationCard } from "./simulation-card";
import { AccuracyTrendChart } from "./accuracy-trend-chart";
import { SpecialtyBreakdownChart } from "./specialty-breakdown-chart";
import { AddSimulationDialog, type SimulationFormData } from "./add-simulation-dialog";
import type {
  Simulation,
  SimulationStats,
  AccuracyTrendPoint,
  SpecialtyAccuracy,
} from "@/lib/simulation-queries";

interface Banca {
  id: string;
  name: string;
}

interface Specialty {
  id: string;
  name: string;
}

interface SimulationsDashboardProps {
  simulations: Simulation[];
  stats: SimulationStats;
  accuracyTrend: AccuracyTrendPoint[];
  specialtyAccuracy: SpecialtyAccuracy[];
  bancas: Banca[];
  specialties: Specialty[];
  limitReached?: boolean;
  limitInfo?: string;
}

export function SimulationsDashboard({
  simulations: initialSimulations,
  stats,
  accuracyTrend,
  specialtyAccuracy,
  bancas,
  specialties,
  limitReached,
  limitInfo,
}: SimulationsDashboardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSimulation, setEditingSimulation] = useState<Simulation | null>(null);
  const [editInitialData, setEditInitialData] = useState<SimulationFormData | null>(null);
  const [simulations, setSimulations] = useState(initialSimulations);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleAdd(data: SimulationFormData) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sim, error } = await supabase
      .from("simulations")
      .insert({
        user_id: user.id,
        title: data.title,
        banca_id: data.banca_id,
        source: data.source || null,
        exam_date: data.exam_date,
        total_questions: data.total_questions,
        correct_answers: data.correct_answers,
        duration_minutes: data.duration_minutes,
        notes: data.notes || null,
        easy_total: data.easy_total,
        easy_correct: data.easy_correct,
        medium_total: data.medium_total,
        medium_correct: data.medium_correct,
        hard_total: data.hard_total,
        hard_correct: data.hard_correct,
      })
      .select("id")
      .single();

    if (error || !sim) return;

    // Insert specialty results if any
    if (data.specialty_results.length > 0) {
      await supabase.from("simulation_results").insert(
        data.specialty_results.map((r) => ({
          simulation_id: sim.id,
          specialty_id: r.specialty_id,
          questions: r.questions,
          correct: r.correct,
          easy_total: r.easy_total,
          easy_correct: r.easy_correct,
          medium_total: r.medium_total,
          medium_correct: r.medium_correct,
          hard_total: r.hard_total,
          hard_correct: r.hard_correct,
        })),
      );
    }

    // Refresh data
    startTransition(() => {
      router.refresh();
    });

    // Optimistic: add to local list
    const accuracy = data.total_questions > 0
      ? Math.round((data.correct_answers / data.total_questions) * 100)
      : 0;

    setSimulations((prev) => [
      {
        id: sim.id,
        title: data.title,
        banca_name: bancas.find((b) => b.id === data.banca_id)?.name ?? null,
        source: data.source || null,
        exam_date: data.exam_date,
        total_questions: data.total_questions,
        correct_answers: data.correct_answers,
        accuracy,
        duration_minutes: data.duration_minutes,
        notes: data.notes || null,
      },
      ...prev,
    ]);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("simulations").delete().eq("id", id);

    setSimulations((prev) => prev.filter((s) => s.id !== id));

    startTransition(() => {
      router.refresh();
    });
  }

  async function handleEditOpen(sim: Simulation) {
    const supabase = createClient();

    const [{ data: fullSim }, { data: results }] = await Promise.all([
      supabase
        .from("simulations")
        .select("banca_id, easy_total, easy_correct, medium_total, medium_correct, hard_total, hard_correct")
        .eq("id", sim.id)
        .single(),
      supabase
        .from("simulation_results")
        .select("specialty_id, questions, correct, easy_total, easy_correct, medium_total, medium_correct, hard_total, hard_correct")
        .eq("simulation_id", sim.id),
    ]);

    setEditingSimulation(sim);
    setEditInitialData({
      title: sim.title,
      banca_id: fullSim?.banca_id ?? null,
      source: sim.source ?? "",
      exam_date: sim.exam_date,
      total_questions: sim.total_questions,
      correct_answers: sim.correct_answers,
      duration_minutes: sim.duration_minutes,
      notes: sim.notes ?? "",
      specialty_results: (results ?? []).map((r) => ({
        specialty_id: r.specialty_id,
        questions: r.questions,
        correct: r.correct,
        easy_total: r.easy_total ?? 0,
        easy_correct: r.easy_correct ?? 0,
        medium_total: r.medium_total ?? 0,
        medium_correct: r.medium_correct ?? 0,
        hard_total: r.hard_total ?? 0,
        hard_correct: r.hard_correct ?? 0,
      })),
      easy_total: fullSim?.easy_total ?? 0,
      easy_correct: fullSim?.easy_correct ?? 0,
      medium_total: fullSim?.medium_total ?? 0,
      medium_correct: fullSim?.medium_correct ?? 0,
      hard_total: fullSim?.hard_total ?? 0,
      hard_correct: fullSim?.hard_correct ?? 0,
    });
    setEditDialogOpen(true);
  }

  async function handleEdit(data: SimulationFormData) {
    if (!editingSimulation) return;
    const supabase = createClient();

    await supabase
      .from("simulations")
      .update({
        title: data.title,
        banca_id: data.banca_id,
        source: data.source || null,
        exam_date: data.exam_date,
        total_questions: data.total_questions,
        correct_answers: data.correct_answers,
        duration_minutes: data.duration_minutes,
        notes: data.notes || null,
        easy_total: data.easy_total,
        easy_correct: data.easy_correct,
        medium_total: data.medium_total,
        medium_correct: data.medium_correct,
        hard_total: data.hard_total,
        hard_correct: data.hard_correct,
      })
      .eq("id", editingSimulation.id);

    // Replace specialty results
    await supabase.from("simulation_results").delete().eq("simulation_id", editingSimulation.id);
    if (data.specialty_results.length > 0) {
      const validRows = data.specialty_results.filter(
        (r) => r.specialty_id && r.questions > 0 && r.correct >= 0,
      );
      if (validRows.length > 0) {
        await supabase.from("simulation_results").insert(
          validRows.map((r) => ({
            simulation_id: editingSimulation.id,
            specialty_id: r.specialty_id,
            questions: r.questions,
            correct: r.correct,
            easy_total: r.easy_total,
            easy_correct: r.easy_correct,
            medium_total: r.medium_total,
            medium_correct: r.medium_correct,
            hard_total: r.hard_total,
            hard_correct: r.hard_correct,
          })),
        );
      }
    }

    const accuracy = data.total_questions > 0
      ? Math.round((data.correct_answers / data.total_questions) * 100)
      : 0;

    setSimulations((prev) =>
      prev.map((s) =>
        s.id === editingSimulation.id
          ? {
              ...s,
              title: data.title,
              banca_name: bancas.find((b) => b.id === data.banca_id)?.name ?? null,
              source: data.source || null,
              exam_date: data.exam_date,
              total_questions: data.total_questions,
              correct_answers: data.correct_answers,
              accuracy,
              duration_minutes: data.duration_minutes,
              notes: data.notes || null,
            }
          : s,
      ),
    );

    setEditingSimulation(null);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Simulados</h1>
          <p className="text-muted-foreground text-sm">
            Acompanhe sua evolução nos simulados de residência
          </p>
          {limitInfo && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Simulados registrados: {limitInfo}
            </p>
          )}
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-1.5"
          disabled={limitReached}
        >
          {limitReached ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {limitReached ? "Limite atingido" : "Registrar"}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Simulados
            </CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total_count}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média de Acerto
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.avg_accuracy}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tendência
            </CardTitle>
            {stats.trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.trend > 0 ? "+" : ""}
              {stats.trend}%
            </p>
            <p className="text-xs text-muted-foreground">últimos 3 vs anteriores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fonte Principal
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold truncate">
              {stats.top_source ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AccuracyTrendChart data={accuracyTrend} />
        <SpecialtyBreakdownChart data={specialtyAccuracy} />
      </div>

      {/* Simulation list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Histórico</h2>
        {simulations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum simulado registrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em &ldquo;Registrar&rdquo; para adicionar seu primeiro simulado
              </p>
            </CardContent>
          </Card>
        ) : (
          simulations.map((sim) => (
            <SimulationCard
              key={sim.id}
              simulation={sim}
              onDelete={handleDelete}
              onEdit={handleEditOpen}
            />
          ))
        )}
      </div>

      {/* Dialog — Adicionar */}
      <AddSimulationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bancas={bancas}
        specialties={specialties}
        onAdd={handleAdd}
      />

      {/* Dialog — Editar */}
      <AddSimulationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        bancas={bancas}
        specialties={specialties}
        onAdd={handleEdit}
        mode="edit"
        initialData={editInitialData ?? undefined}
      />
    </div>
  );
}
