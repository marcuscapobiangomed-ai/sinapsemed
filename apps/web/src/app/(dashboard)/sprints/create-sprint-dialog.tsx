"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateSprintDialogProps {
  userId: string;
}

const SPRINT_TYPES = [
  {
    value: "foundation",
    label: "Construcao de Base",
    description: "Primeiro Sprint — foco em cobrir lacunas fundamentais",
  },
  {
    value: "deepening",
    label: "Aprofundamento",
    description: "Aprofundar nas especialidades mais cobradas pela banca",
  },
  {
    value: "revision",
    label: "Revisao",
    description: "Consolidar conhecimento ja adquirido com revisao intensiva",
  },
  {
    value: "final_80_20",
    label: "Reta Final 80/20",
    description: "Focar nos 20% do conteudo que geram 80% dos resultados",
  },
];

const DURATION_OPTIONS = [
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias (recomendado)" },
  { value: "120", label: "120 dias" },
];

export function CreateSprintDialog({ userId }: CreateSprintDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sprintType, setSprintType] = useState("foundation");
  const [duration, setDuration] = useState("90");

  async function handleCreate() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sprints/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprint_type: sprintType,
          duration_days: parseInt(duration),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar sprint");
      }

      toast.success("Sprint criado com sucesso!");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar sprint",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Rocket className="mr-2 h-4 w-4" />
          Iniciar Sprint
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Iniciar novo Sprint</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Sprint type */}
          <div className="space-y-2">
            <Label>Tipo do Sprint</Label>
            <div className="grid grid-cols-1 gap-2">
              {SPRINT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSprintType(type.value)}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    sprintType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="text-sm font-medium">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duracao</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              Ao criar o Sprint, a IA analisara suas lacunas de conhecimento
              e definira as especialidades foco e metas personalizadas.
            </p>
          </div>

          <Button
            onClick={handleCreate}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando e criando...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Criar Sprint
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
