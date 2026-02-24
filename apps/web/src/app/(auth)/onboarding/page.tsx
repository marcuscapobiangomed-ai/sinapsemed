import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Configurar perfil",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) redirect("/dashboard");

  const { data: bancas } = await supabase
    .from("bancas")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("name");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Configure seu perfil</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Precisamos de algumas informações para personalizar seus estudos
          </p>
        </div>
        <OnboardingForm
          userId={user.id}
          currentName={profile?.full_name || user.user_metadata?.full_name || ""}
          bancas={bancas || []}
        />
      </div>
    </main>
  );
}
