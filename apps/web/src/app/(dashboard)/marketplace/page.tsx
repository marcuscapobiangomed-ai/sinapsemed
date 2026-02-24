import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MarketplaceDashboard } from "./marketplace-dashboard";

export const metadata: Metadata = {
  title: "Marketplace",
};

export default async function MarketplacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: publicDecks } = await supabase
    .from("decks")
    .select(
      "id, title, description, color, card_count, clone_count, is_public, share_code, user_id, profiles(full_name), specialties(name), bancas(name)",
    )
    .eq("is_public", true)
    .order("clone_count", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const decks = (publicDecks ?? []).map((d: any) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    color: d.color,
    card_count: d.card_count,
    clone_count: d.clone_count ?? 0,
    share_code: d.share_code,
    author_name: d.profiles?.full_name ?? "Anônimo",
    specialty_name: d.specialties?.name ?? null,
    banca_name: d.bancas?.name ?? null,
    is_own: d.user_id === user?.id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">
          Explore decks compartilhados pela comunidade
        </p>
      </div>
      <MarketplaceDashboard decks={decks} />
    </div>
  );
}
