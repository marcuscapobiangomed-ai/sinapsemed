"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Banca {
  id: string;
  name: string;
}

interface Specialty {
  id: string;
  name: string;
}

interface SpecialtyRow {
  specialty_id: string;
  questions: number;
  correct: number;
}

export interface SimulationFormData {
  title: string;
  banca_id: string | null;
  source: string;
  exam_date: string;
  total_questions: number;
  correct_answers: number;
  duration_minutes: number | null;
  notes: string;
  specialty_results: SpecialtyRow[];
  easy_total: number;
  easy_correct: number;
  medium_total: number;
  medium_correct: number;
  hard_total: number;
  hard_correct: number;
}

interface AddSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bancas: Banca[];
  specialties: Specialty[];
  onAdd: (data: SimulationFormData) => void;
}

export function AddSimulationDialog({
  open,
  onOpenChange,
  bancas,
  specialties,
  onAdd,
}: AddSimulationDialogProps) {
  const [title, setTitle] = useState("");
  const [bancaId, setBancaId] = useState("");
  const [source, setSource] = useState("");
  const [examDate, setExamDate] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [specialtyRows, setSpecialtyRows] = useState<SpecialtyRow[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [easyTotal, setEasyTotal] = useState("");
  const [easyCorrect, setEasyCorrect] = useState("");
  const [mediumTotal, setMediumTotal] = useState("");
  const [mediumCorrect, setMediumCorrect] = useState("");
  const [hardTotal, setHardTotal] = useState("");
  const [hardCorrect, setHardCorrect] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setTitle("");
    setBancaId("");
    setSource("");
    setExamDate("");
    setTotalQuestions("");
    setCorrectAnswers("");
    setDurationMinutes("");
    setNotes("");
    setSpecialtyRows([]);
    setShowBreakdown(false);
    setShowDifficulty(false);
    setEasyTotal("");
    setEasyCorrect("");
    setMediumTotal("");
    setMediumCorrect("");
    setHardTotal("");
    setHardCorrect("");
  }

  function addSpecialtyRow() {
    setSpecialtyRows((prev) => [
      ...prev,
      { specialty_id: "", questions: 0, correct: 0 },
    ]);
  }

  function updateSpecialtyRow(index: number, field: keyof SpecialtyRow, value: string | number) {
    setSpecialtyRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function removeSpecialtyRow(index: number) {
    setSpecialtyRows((prev) => prev.filter((_, i) => i !== index));
  }

  const usedSpecialtyIds = new Set(specialtyRows.map((r) => r.specialty_id));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const total = Number(totalQuestions);
    const correct = Number(correctAnswers);
    if (!title || !examDate || total < 1 || correct < 0 || correct > total) return;

    setIsSubmitting(true);

    const validRows = specialtyRows.filter(
      (r) => r.specialty_id && r.questions > 0 && r.correct >= 0 && r.correct <= r.questions,
    );

    onAdd({
      title,
      banca_id: bancaId || null,
      source,
      exam_date: examDate,
      total_questions: total,
      correct_answers: correct,
      duration_minutes: durationMinutes ? Number(durationMinutes) : null,
      notes,
      specialty_results: validRows,
      easy_total: easyTotal ? Number(easyTotal) : 0,
      easy_correct: easyCorrect ? Number(easyCorrect) : 0,
      medium_total: mediumTotal ? Number(mediumTotal) : 0,
      medium_correct: mediumCorrect ? Number(mediumCorrect) : 0,
      hard_total: hardTotal ? Number(hardTotal) : 0,
      hard_correct: hardCorrect ? Number(hardCorrect) : 0,
    });

    setIsSubmitting(false);
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Simulado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              placeholder="Ex: ENARE 2024 — Prova 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Banca + Fonte */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Banca</Label>
              <Select value={bancaId} onValueChange={setBancaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {bancas.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fonte</Label>
              <Input
                placeholder="Ex: Medway, Estratégia"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
          </div>

          {/* Data + Duração */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data da prova *</Label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duração (min)</Label>
              <Input
                type="number"
                min={1}
                placeholder="Ex: 120"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>

          {/* Questões + Acertos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Total de questões *</Label>
              <Input
                type="number"
                min={1}
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Acertos *</Label>
              <Input
                type="number"
                min={0}
                max={totalQuestions ? Number(totalQuestions) : undefined}
                value={correctAnswers}
                onChange={(e) => setCorrectAnswers(e.target.value)}
              />
            </div>
          </div>

          {/* Porcentagem preview */}
          {totalQuestions && correctAnswers && Number(totalQuestions) > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Taxa de acerto:{" "}
              <span className="font-semibold text-foreground">
                {Math.round((Number(correctAnswers) / Number(totalQuestions)) * 100)}%
              </span>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              placeholder="Anotações sobre a prova..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Detalhamento por dificuldade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Detalhamento por dificuldade
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setShowDifficulty(!showDifficulty)}
              >
                {showDifficulty ? "Ocultar" : "Adicionar"}
              </Button>
            </div>

            {showDifficulty && (
              <div className="space-y-2 rounded-lg border p-3">
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-1">
                  <span>Nível</span>
                  <span>Questões</span>
                  <span>Acertos</span>
                </div>
                {/* Fácil */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sm font-medium text-green-600">Fácil</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-9"
                    placeholder="0"
                    value={easyTotal}
                    onChange={(e) => setEasyTotal(e.target.value)}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={easyTotal ? Number(easyTotal) : undefined}
                    className="h-9"
                    placeholder="0"
                    value={easyCorrect}
                    onChange={(e) => setEasyCorrect(e.target.value)}
                  />
                </div>
                {/* Média */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sm font-medium text-amber-600">Média</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-9"
                    placeholder="0"
                    value={mediumTotal}
                    onChange={(e) => setMediumTotal(e.target.value)}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={mediumTotal ? Number(mediumTotal) : undefined}
                    className="h-9"
                    placeholder="0"
                    value={mediumCorrect}
                    onChange={(e) => setMediumCorrect(e.target.value)}
                  />
                </div>
                {/* Difícil */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sm font-medium text-red-600">Difícil</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-9"
                    placeholder="0"
                    value={hardTotal}
                    onChange={(e) => setHardTotal(e.target.value)}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={hardTotal ? Number(hardTotal) : undefined}
                    className="h-9"
                    placeholder="0"
                    value={hardCorrect}
                    onChange={(e) => setHardCorrect(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Breakdown por especialidade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Detalhamento por especialidade
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setShowBreakdown(!showBreakdown);
                  if (!showBreakdown && specialtyRows.length === 0) {
                    addSpecialtyRow();
                  }
                }}
              >
                {showBreakdown ? "Ocultar" : "Adicionar"}
              </Button>
            </div>

            {showBreakdown && (
              <div className="space-y-2 rounded-lg border p-3">
                {specialtyRows.map((row, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1">
                      {i === 0 && (
                        <Label className="text-xs text-muted-foreground">Especialidade</Label>
                      )}
                      <Select
                        value={row.specialty_id}
                        onValueChange={(v) => updateSpecialtyRow(i, "specialty_id", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties
                            .filter((s) => !usedSpecialtyIds.has(s.id) || s.id === row.specialty_id)
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      {i === 0 && (
                        <Label className="text-xs text-muted-foreground">Questões</Label>
                      )}
                      <Input
                        type="number"
                        min={1}
                        className="h-9"
                        value={row.questions || ""}
                        onChange={(e) => updateSpecialtyRow(i, "questions", Number(e.target.value))}
                      />
                    </div>
                    <div className="w-20">
                      {i === 0 && (
                        <Label className="text-xs text-muted-foreground">Acertos</Label>
                      )}
                      <Input
                        type="number"
                        min={0}
                        max={row.questions}
                        className="h-9"
                        value={row.correct || ""}
                        onChange={(e) => updateSpecialtyRow(i, "correct", Number(e.target.value))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => removeSpecialtyRow(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={addSpecialtyRow}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Especialidade
                </Button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              !title ||
              !examDate ||
              !totalQuestions ||
              Number(totalQuestions) < 1 ||
              !correctAnswers ||
              Number(correctAnswers) < 0 ||
              Number(correctAnswers) > Number(totalQuestions) ||
              isSubmitting
            }
          >
            {isSubmitting ? "Salvando..." : "Salvar simulado"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
