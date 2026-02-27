"use client";

import { useRef, useState } from "react";
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
import { Plus, Trash2, ImagePlus, Loader2 } from "lucide-react";

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

interface ParsedSimulation {
  title: string | null;
  source: string | null;
  exam_date: string | null;
  total_questions: number | null;
  correct_answers: number | null;
  duration_minutes: number | null;
  specialties: { name: string; questions: number; correct: number }[] | null;
  easy_total: number | null;
  easy_correct: number | null;
  medium_total: number | null;
  medium_correct: number | null;
  hard_total: number | null;
  hard_correct: number | null;
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
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setParseError("");
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

  function applyParsedData(data: ParsedSimulation) {
    if (data.title) setTitle(data.title);
    if (data.source) setSource(data.source);
    if (data.exam_date) setExamDate(data.exam_date);
    if (data.total_questions != null) setTotalQuestions(String(data.total_questions));
    if (data.correct_answers != null) setCorrectAnswers(String(data.correct_answers));
    if (data.duration_minutes != null) setDurationMinutes(String(data.duration_minutes));

    // Dificuldade
    const hasDifficulty =
      data.easy_total != null || data.medium_total != null || data.hard_total != null;
    if (hasDifficulty) {
      setShowDifficulty(true);
      if (data.easy_total != null) setEasyTotal(String(data.easy_total));
      if (data.easy_correct != null) setEasyCorrect(String(data.easy_correct));
      if (data.medium_total != null) setMediumTotal(String(data.medium_total));
      if (data.medium_correct != null) setMediumCorrect(String(data.medium_correct));
      if (data.hard_total != null) setHardTotal(String(data.hard_total));
      if (data.hard_correct != null) setHardCorrect(String(data.hard_correct));
    }

    // Especialidades — fuzzy match por nome
    if (data.specialties?.length) {
      const rows: SpecialtyRow[] = [];
      for (const s of data.specialties) {
        const nameLower = s.name.toLowerCase();
        const match = specialties.find((sp) => {
          const spLower = sp.name.toLowerCase();
          return spLower.includes(nameLower) || nameLower.includes(spLower);
        });
        if (match) {
          rows.push({
            specialty_id: match.id,
            questions: s.questions,
            correct: s.correct,
          });
        }
      }
      if (rows.length > 0) {
        setShowBreakdown(true);
        setSpecialtyRows(rows);
      }
    }
  }

  async function compressImage(file: File, maxSizeBytes = 3_500_000): Promise<string> {
    // Lê a imagem original
    const original = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");

        // Limita dimensões a 1600px preservando proporção
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        // Tenta qualidades decrescentes até ficar abaixo do limite
        let quality = 0.85;
        let result = canvas.toDataURL("image/jpeg", quality);
        while (result.length > maxSizeBytes && quality > 0.3) {
          quality -= 0.1;
          result = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(result);
      };
      img.src = original;
    });
  }

  async function handleImageUpload(file: File) {
    setIsParsing(true);
    setParseError("");

    try {
      // Comprime a imagem para respeitar o limite de 4MB do Groq
      const base64 = await compressImage(file);

      const res = await fetch("/api/ai/parse-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao analisar imagem");
      }

      const data: ParsedSimulation = await res.json();

      // Verifica se a IA extraiu pelo menos um campo útil
      const hasData = data.title || data.total_questions || data.correct_answers || data.exam_date;
      if (!hasData) {
        setParseError("Não foi possível extrair dados da imagem. Verifique se o print mostra o resultado do simulado e tente novamente.");
        return;
      }

      applyParsedData(data);
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "Erro ao analisar imagem. Tente novamente.",
      );
    } finally {
      setIsParsing(false);
      // Reset file input so user can re-upload
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items || isParsing) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleImageUpload(file);
          e.preventDefault();
          break;
        }
      }
    }
  }

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
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto" onPaste={handlePaste}>
        <DialogHeader>
          <DialogTitle>Registrar Simulado</DialogTitle>
        </DialogHeader>

        {/* Upload de print */}
        <div className="rounded-lg border border-dashed p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />

          {isParsing ? (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando print...
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                Preencher com print do resultado
              </button>
              <p className="text-xs text-center text-muted-foreground">
                Ou cole uma imagem com <kbd className="bg-accent px-1 py-0.5 rounded text-xs font-semibold">Ctrl+V</kbd>
              </p>
            </div>
          )}

          {parseError && (
            <p className="text-xs text-destructive mt-1.5 text-center">{parseError}</p>
          )}
        </div>

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
              isSubmitting ||
              isParsing
            }
          >
            {isSubmitting ? "Salvando..." : "Salvar simulado"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
