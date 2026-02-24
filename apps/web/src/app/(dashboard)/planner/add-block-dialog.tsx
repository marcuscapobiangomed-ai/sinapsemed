"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { DAY_NAMES_FULL } from "@/lib/planner-utils";
import type { Specialty } from "@/lib/planner-queries";

interface AddBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayOfWeek: number;
  specialties: Specialty[];
  onAdd: (specialtyId: string, minutes: number) => void;
}

export function AddBlockDialog({
  open,
  onOpenChange,
  dayOfWeek,
  specialties,
  onAdd,
}: AddBlockDialogProps) {
  const [specialtyId, setSpecialtyId] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!specialtyId) return;

    setIsSubmitting(true);
    onAdd(specialtyId, minutes);
    setIsSubmitting(false);
    setSpecialtyId("");
    setMinutes(30);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Adicionar bloco de estudo</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {DAY_NAMES_FULL[dayOfWeek]}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Especialidade</Label>
            <Select value={specialtyId} onValueChange={setSpecialtyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duração (minutos)</Label>
            <div className="flex items-center gap-2">
              {[15, 30, 45, 60, 90, 120].map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant={minutes === v ? "default" : "outline"}
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => setMinutes(v)}
                >
                  {v}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              min={5}
              max={480}
              step={5}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!specialtyId || minutes < 5 || isSubmitting}
          >
            {isSubmitting ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
