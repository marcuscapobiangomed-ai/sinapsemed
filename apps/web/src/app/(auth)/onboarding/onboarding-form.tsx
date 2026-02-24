"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface OnboardingFormProps {
  userId: string;
  currentName: string;
  bancas: { id: string; slug: string; name: string }[];
}

export function OnboardingForm({ userId, currentName, bancas }: OnboardingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBancas, setSelectedBancas] = useState<string[]>([]);
  const [primaryBanca, setPrimaryBanca] = useState<string>("");

  function toggleBanca(bancaId: string) {
    setSelectedBancas((prev) => {
      const next = prev.includes(bancaId)
        ? prev.filter((id) => id !== bancaId)
        : [...prev, bancaId];

      // If primary was deselected, clear it
      if (!next.includes(primaryBanca)) {
        setPrimaryBanca(next[0] || "");
      }

      // Auto-set primary if only one selected
      if (next.length === 1) {
        setPrimaryBanca(next[0]);
      }

      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedBancas.length === 0) {
      toast.error("Selecione pelo menos uma banca");
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    const supabase = createClient();

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name") as string,
        medical_school: formData.get("medical_school") as string || null,
        graduation_year: formData.get("graduation_year")
          ? Number(formData.get("graduation_year"))
          : null,
        target_year: Number(formData.get("target_year")),
        study_hours_per_day: Number(formData.get("study_hours_per_day")),
        onboarding_completed: true,
      })
      .eq("id", userId);

    if (profileError) {
      toast.error("Erro ao salvar perfil", { description: profileError.message });
      setIsLoading(false);
      return;
    }

    // Insert user_bancas
    const userBancas = selectedBancas.map((bancaId, index) => ({
      user_id: userId,
      banca_id: bancaId,
      is_primary: bancaId === (primaryBanca || selectedBancas[0]),
      priority: index + 1,
    }));

    const { error: bancaError } = await supabase
      .from("user_bancas")
      .insert(userBancas);

    if (bancaError) {
      toast.error("Erro ao salvar bancas", { description: bancaError.message });
      setIsLoading(false);
      return;
    }

    toast.success("Perfil configurado!");
    router.push("/dashboard");
    router.refresh();
  }

  const currentYear = new Date().getFullYear();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seus dados</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={currentName}
              required
            />
          </div>

          {/* Faculdade */}
          <div className="space-y-2">
            <Label htmlFor="medical_school">Faculdade de Medicina</Label>
            <Input
              id="medical_school"
              name="medical_school"
              placeholder="Ex: USP, UNIFESP, UFMG..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ano de formatura */}
            <div className="space-y-2">
              <Label htmlFor="graduation_year">Ano de formatura</Label>
              <Select name="graduation_year">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => currentYear - 2 + i).map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ano da prova */}
            <div className="space-y-2">
              <Label htmlFor="target_year">Ano da prova alvo</Label>
              <Select name="target_year" defaultValue={String(currentYear + 1)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 4 }, (_, i) => currentYear + i).map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Horas por dia */}
          <div className="space-y-2">
            <Label htmlFor="study_hours_per_day">
              Horas de estudo disponíveis por dia
            </Label>
            <Select name="study_hours_per_day" defaultValue="4">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((hours) => (
                  <SelectItem key={hours} value={String(hours)}>
                    {hours}h/dia
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bancas */}
          <div className="space-y-3">
            <Label>Bancas alvo (selecione uma ou mais)</Label>
            <div className="flex flex-wrap gap-2">
              {bancas.map((banca) => (
                <Badge
                  key={banca.id}
                  variant={selectedBancas.includes(banca.id) ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3"
                  onClick={() => toggleBanca(banca.id)}
                >
                  {banca.slug.toUpperCase()}
                </Badge>
              ))}
            </div>
            {selectedBancas.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Clique para selecionar suas bancas
              </p>
            )}
          </div>

          {/* Banca principal */}
          {selectedBancas.length > 1 && (
            <div className="space-y-2">
              <Label>Banca principal</Label>
              <Select
                value={primaryBanca}
                onValueChange={setPrimaryBanca}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a banca principal" />
                </SelectTrigger>
                <SelectContent>
                  {selectedBancas.map((bancaId) => {
                    const banca = bancas.find((b) => b.id === bancaId);
                    return (
                      <SelectItem key={bancaId} value={bancaId}>
                        {banca?.slug.toUpperCase()}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Começar a estudar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
