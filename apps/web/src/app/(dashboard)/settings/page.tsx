import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Configurações",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, allBancasResult, userBancasResult, allPlansResult, subscriptionResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, medical_school, graduation_year, target_year, study_hours_per_day")
        .eq("id", user!.id)
        .single(),
      supabase.from("bancas").select("id, slug, name").eq("is_active", true).order("slug"),
      supabase.from("user_bancas").select("banca_id, is_primary").eq("user_id", user!.id),
      supabase
        .from("plans")
        .select("id, slug, name, price_brl, max_flashcards_per_month, max_doubts_per_day")
        .eq("is_active", true)
        .order("price_brl"),
      supabase
        .from("subscriptions")
        .select(
          "status, current_period_end, cancel_at_period_end, plans(id, slug, name, price_brl, max_flashcards_per_month, max_doubts_per_day)",
        )
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle(),
    ]);

  const profile = profileResult.data!;
  const allBancas = allBancasResult.data ?? [];
  const currentUserBancas = userBancasResult.data ?? [];
  const allPlans = allPlansResult.data ?? [];

  const sub = subscriptionResult.data;
  type PlanShape = {
    id: string;
    slug: string;
    name: string;
    price_brl: number;
    max_flashcards_per_month: number | null;
    max_doubts_per_day: number | null;
  };
  const activeSubscription = sub
    ? {
        plan: (sub.plans as unknown as PlanShape),
        status: sub.status,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e preferências</p>
      </div>

      <SettingsForm
        userId={user!.id}
        profile={profile}
        allBancas={allBancas}
        currentUserBancas={currentUserBancas}
        allPlans={allPlans}
        activeSubscription={activeSubscription}
      />
    </div>
  );
}
