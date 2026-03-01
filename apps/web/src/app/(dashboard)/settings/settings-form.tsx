"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Banca {
  id: string;
  slug: string;
  name: string;
}

interface UserBanca {
  banca_id: string;
  is_primary: boolean;
}

interface Plan {
  id: string;
  slug: string;
  name: string;
  price_brl: number;
  max_flashcards_per_month: number | null;
  max_doubts_per_day: number | null;
}

interface ActiveSubscription {
  plan: Plan;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface SettingsFormProps {
  userId: string;
  profile: {
    full_name: string;
    medical_school: string | null;
    graduation_year: number | null;
    target_year: number;
    study_hours_per_day: number | null;
  };
  allBancas: Banca[];
  currentUserBancas: UserBanca[];
  allPlans: Plan[];
  activeSubscription: ActiveSubscription | null;
}

export function SettingsForm({
  userId,
  profile,
  allBancas,
  currentUserBancas,
  allPlans,
  activeSubscription,
}: SettingsFormProps) {
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingBancas, setIsSavingBancas] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [selectedBancas, setSelectedBancas] = useState<string[]>(
    currentUserBancas.map((ub) => ub.banca_id),
  );
  const [primaryBanca, setPrimaryBanca] = useState<string>(
    currentUserBancas.find((ub) => ub.is_primary)?.banca_id ?? "",
  );

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentYear = new Date().getFullYear();

  function toggleBanca(bancaId: string) {
    setSelectedBancas((prev) => {
      const next = prev.includes(bancaId)
        ? prev.filter((id) => id !== bancaId)
        : [...prev, bancaId];

      if (!next.includes(primaryBanca)) {
        setPrimaryBanca(next[0] ?? "");
      }
      if (next.length === 1) setPrimaryBanca(next[0]);

      return next;
    });
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSavingProfile(true);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name") as string,
        medical_school: (formData.get("medical_school") as string) || null,
        graduation_year: formData.get("graduation_year")
          ? Number(formData.get("graduation_year"))
          : null,
        target_year: Number(formData.get("target_year")),
        study_hours_per_day: Number(formData.get("study_hours_per_day")),
      })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao salvar perfil", { description: error.message });
    } else {
      toast.success("Perfil atualizado!");
    }

    setIsSavingProfile(false);
  }

  async function handleSaveBancas() {
    if (selectedBancas.length === 0) {
      toast.error("Selecione pelo menos uma banca");
      return;
    }
    setIsSavingBancas(true);
    const supabase = createClient();

    // Delete all current user_bancas and re-insert
    const { error: deleteError } = await supabase
      .from("user_bancas")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      toast.error("Erro ao atualizar bancas", { description: deleteError.message });
      setIsSavingBancas(false);
      return;
    }

    const userBancas = selectedBancas.map((bancaId, index) => ({
      user_id: userId,
      banca_id: bancaId,
      is_primary: bancaId === (primaryBanca || selectedBancas[0]),
      priority: index + 1,
    }));

    const { error: insertError } = await supabase
      .from("user_bancas")
      .insert(userBancas);

    if (insertError) {
      toast.error("Erro ao salvar bancas", { description: insertError.message });
    } else {
      toast.success("Bancas atualizadas!");
    }

    setIsSavingBancas(false);
  }

  async function handleUpgrade(planSlug: string) {
    setUpgradingPlan(planSlug);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_slug: planSlug }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Erro ao iniciar checkout");
        setUpgradingPlan(null);
      }
    } catch {
      toast.error("Erro ao conectar com o servidor");
      setUpgradingPlan(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Escolha o tema visual da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          {mounted && (
            <div className="flex gap-3">
              {[
                { value: "light", label: "Claro", icon: Sun },
                { value: "dark", label: "Escuro", icon: Moon },
                { value: "system", label: "Sistema", icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all flex-1",
                    theme === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Seus dados pessoais e preferências de estudo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile.full_name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_school">Faculdade de Medicina</Label>
              <Input
                id="medical_school"
                name="medical_school"
                defaultValue={profile.medical_school ?? ""}
                placeholder="Ex: USP, UNIFESP, UFMG..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="graduation_year">Ano de formatura</Label>
                <Select
                  name="graduation_year"
                  defaultValue={
                    profile.graduation_year ? String(profile.graduation_year) : undefined
                  }
                >
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

              <div className="space-y-2">
                <Label htmlFor="target_year">Ano da prova alvo</Label>
                <Select
                  name="target_year"
                  defaultValue={String(profile.target_year)}
                >
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

            <div className="space-y-2">
              <Label htmlFor="study_hours_per_day">Horas de estudo por dia</Label>
              <Select
                name="study_hours_per_day"
                defaultValue={String(profile.study_hours_per_day ?? 4)}
              >
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

            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? "Salvando..." : "Salvar perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bancas Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bancas alvo</CardTitle>
          <CardDescription>
            Selecione as bancas que você vai prestar. A IA irá priorizar o estilo de cada banca nos seus flashcards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {allBancas.map((banca) => (
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

          {selectedBancas.length > 1 && (
            <div className="space-y-2">
              <Label>Banca principal</Label>
              <Select value={primaryBanca} onValueChange={setPrimaryBanca}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a banca principal" />
                </SelectTrigger>
                <SelectContent>
                  {selectedBancas.map((bancaId) => {
                    const banca = allBancas.find((b) => b.id === bancaId);
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

          <Button onClick={handleSaveBancas} disabled={isSavingBancas}>
            {isSavingBancas ? "Salvando..." : "Salvar bancas"}
          </Button>
        </CardContent>
      </Card>

      {/* Plan Section */}
      <Card>
        <CardHeader>
          <CardTitle>Plano</CardTitle>
          <CardDescription>Seu plano de assinatura atual e opções de upgrade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current plan */}
          {activeSubscription ? (
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div>
                <p className="font-semibold">{activeSubscription.plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {activeSubscription.plan.max_flashcards_per_month
                    ? `${activeSubscription.plan.max_flashcards_per_month} flashcards/mês`
                    : "Flashcards ilimitados"}
                  {" · "}
                  {activeSubscription.plan.max_doubts_per_day
                    ? `${activeSubscription.plan.max_doubts_per_day} dúvidas/dia`
                    : "Dúvidas ilimitadas"}
                </p>
                {activeSubscription.current_period_end && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeSubscription.cancel_at_period_end
                      ? `Cancela em ${new Date(activeSubscription.current_period_end).toLocaleDateString("pt-BR")}`
                      : `Renova em ${new Date(activeSubscription.current_period_end).toLocaleDateString("pt-BR")}`}
                  </p>
                )}
              </div>
              <Badge>Ativo</Badge>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border">
              <div>
                <p className="font-semibold">Plano Gratuito</p>
                <p className="text-sm text-muted-foreground">30 flashcards/mês · 5 dúvidas/dia · 1 banca</p>
              </div>
              <Badge variant="secondary">Ativo</Badge>
            </div>
          )}

          {/* Upgrade options */}
          {!activeSubscription && (
            <div className="grid gap-3 sm:grid-cols-2">
              {allPlans
                .filter((p) => p.slug !== "free")
                .map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 border rounded-xl space-y-3"
                  >
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-2xl font-bold mt-1">
                        R$ {(plan.price_brl / 100).toFixed(2).replace(".", ",")}
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.max_flashcards_per_month
                          ? `${plan.max_flashcards_per_month} flashcards/mês`
                          : "Flashcards ilimitados"}
                        {" · "}
                        {plan.max_doubts_per_day
                          ? `${plan.max_doubts_per_day} dúvidas/dia`
                          : "Dúvidas ilimitadas"}
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.slug)}
                      disabled={upgradingPlan === plan.slug}
                    >
                      {upgradingPlan === plan.slug ? "Redirecionando..." : "Assinar"}
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
