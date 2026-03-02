import { Metadata } from "next";
import { createClient, getUser } from "@/lib/supabase/server";
import { ReviewSession } from "./review-session";
import { BancaFilter } from "./banca-filter";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Zap, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getActiveSprint } from "@/lib/sprint-queries";
import { get8020Queue } from "@/lib/sprint-80-20";

export const metadata: Metadata = {
  title: "Revisão",
};

const BANCA_DISPLAY_NAMES: Record<string, string> = {
  enare: "ENARE",
  enamed: "ENAMED",
  usp: "USP-SP",
  unicamp: "UNICAMP",
  "ses-df": "SES-DF",
  "sus-sp": "SUS-SP",
  famerp: "FAMERP",
  "santa-casa": "Santa Casa SP",
};

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ banca?: string; mode?: string; specialty?: string }>;
}) {
  const { banca: bancaFilter, mode, specialty: specialtyFilter } = await searchParams;
  const isQuickMode = mode === "quick";
  const cardLimit = isQuickMode ? 15 : 50;

  const supabase = await createClient();
  const user = await getUser();

  // Check for active 80/20 sprint
  const activeSprint = await getActiveSprint(supabase, user!.id);
  const is8020 =
    activeSprint?.is_80_20_mode === true ||
    activeSprint?.sprint_type === "final_80_20";

  // Fetch user's bancas for the filter bar
  const { data: userBancas } = await supabase
    .from("user_bancas")
    .select("bancas(slug)")
    .eq("user_id", user!.id);

  const bancaNames = (userBancas ?? [])
    .map((ub) => {
      const slug = (ub.bancas as unknown as { slug: string } | null)?.slug;
      return slug ? (BANCA_DISPLAY_NAMES[slug] ?? slug.toUpperCase()) : null;
    })
    .filter((s): s is string => !!s);

  // Resolve specialty filter if present
  let specialtyName: string | null = null;
  let specialtyId: string | null = null;
  if (specialtyFilter) {
    const { data: spec } = await supabase
      .from("specialties")
      .select("id, name")
      .eq("slug", specialtyFilter)
      .single();
    if (spec) {
      specialtyName = spec.name;
      specialtyId = spec.id;
    }
  }

  // Fetch due flashcards (new cards + cards due for review)
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dueCards: any[] | null = null;
  let count: number | null = null;
  let using8020 = false;

  if (is8020 && !bancaFilter && !specialtyId) {
    // 80/20 mode: use prioritized queue
    const queue = await get8020Queue(supabase, user!.id);
    const ids = queue.map((c) => c.flashcard_id);

    if (ids.length > 0) {
      const { data, count: c } = await supabase
        .from("flashcards")
        .select("*, decks(title, color)", { count: "exact" })
        .in("id", ids.slice(0, cardLimit));

      if (data && data.length > 0) {
        // Re-sort by priority order
        const orderMap = new Map(ids.map((id, i) => [id, i]));
        dueCards = data.sort(
          (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999),
        );
        count = c;
        using8020 = true;
      }
    }
  }

  // Fallback: standard due-cards query (also used when no 80/20 cards)
  if (!dueCards) {
    let query = supabase
      .from("flashcards")
      .select("*, decks(title, color)", { count: "exact" })
      .eq("user_id", user!.id)
      .eq("is_suspended", false)
      .or(`next_review_at.is.null,next_review_at.lte.${now}`)
      .order("next_review_at", { ascending: true, nullsFirst: true })
      .limit(cardLimit);

    if (bancaFilter) {
      query = query.contains("tags", [bancaFilter]);
    }

    if (specialtyId) {
      query = query.eq("specialty_id", specialtyId);
    }

    const result = await query;
    dueCards = result.data;
    count = result.count;
  }

  // Build subtitle parts
  const subtitleParts: string[] = [];
  if (isQuickMode) subtitleParts.push("Modo rápido · ~5 min");
  if (specialtyName) subtitleParts.push(specialtyName);
  if (bancaFilter) subtitleParts.push(bancaFilter);

  // Build current filter params for quick mode link
  const quickParams = new URLSearchParams();
  quickParams.set("mode", "quick");
  if (bancaFilter) quickParams.set("banca", bancaFilter);
  if (specialtyFilter) quickParams.set("specialty", specialtyFilter);

  const filterBar =
    bancaNames.length > 0 ? (
      <BancaFilter bancas={bancaNames} active={bancaFilter ?? null} />
    ) : null;

  if (!dueCards || dueCards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Revisão</h1>
          <p className="text-muted-foreground">Sessão de revisão espaçada</p>
        </div>
        {filterBar}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">
              {specialtyName
                ? `Nenhum card de ${specialtyName} para revisar!`
                : bancaFilter
                  ? `Nenhum card da banca ${bancaFilter} para revisar!`
                  : "Nada para revisar!"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {specialtyName
                ? "Crie cards com esta especialidade para aparecerem aqui."
                : bancaFilter
                  ? "Tente outro filtro ou crie cards tagueados com esta banca."
                  : "Todos os seus flashcards estão em dia. Volte mais tarde ou crie novos cards."}
            </p>
            {(bancaFilter || specialtyFilter || isQuickMode) ? (
              <Button asChild variant="outline" className="mt-4">
                <Link href="/review">Ver todos os cards</Link>
              </Button>
            ) : (
              <Button asChild className="mt-4">
                <Link href="/decks">Ir para Decks</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {using8020 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <Target className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">Modo Reta Final 80/20</p>
            <p className="text-xs text-muted-foreground">
              Focando nos 20% de conteudo que mais caem na sua banca
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revisão</h1>
          <p className="text-muted-foreground">
            {count} {count === 1 ? "card" : "cards"} para revisar
            {subtitleParts.map((part) => (
              <span key={part} className="ml-1 text-primary font-medium">
                · {part}
              </span>
            ))}
          </p>
        </div>
        {!isQuickMode && (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/review?${quickParams.toString()}`}>
              <Zap className="h-3.5 w-3.5" />
              Rápida (~5 min)
            </Link>
          </Button>
        )}
      </div>
      {filterBar}
      <ReviewSession initialCards={dueCards} totalCount={count ?? dueCards.length} />
    </div>
  );
}
