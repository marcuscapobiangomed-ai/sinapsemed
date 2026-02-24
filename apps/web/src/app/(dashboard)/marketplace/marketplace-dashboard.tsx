"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Loader2,
  Layers,
  Search,
  Users,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

interface PublicDeck {
  id: string;
  title: string;
  description: string | null;
  color: string;
  card_count: number;
  clone_count: number;
  share_code: string | null;
  author_name: string;
  specialty_name: string | null;
  banca_name: string | null;
  is_own: boolean;
}

interface MarketplaceDashboardProps {
  decks: PublicDeck[];
}

export function MarketplaceDashboard({ decks }: MarketplaceDashboardProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cloningId, setCloningId] = useState<string | null>(null);

  const filtered = decks.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.specialty_name?.toLowerCase().includes(q) ||
      d.banca_name?.toLowerCase().includes(q) ||
      d.author_name.toLowerCase().includes(q)
    );
  });

  async function handleClone(deckId: string) {
    setCloningId(deckId);
    try {
      const res = await fetch("/api/deck-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Erro ao clonar deck");
      }

      const data = await res.json();
      toast.success("Deck clonado com sucesso!");
      router.push(`/decks/${data.deck_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao clonar");
    } finally {
      setCloningId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, especialidade, banca ou autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4" />
          <span>{filtered.length} decks</span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">Nenhum deck encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Tente outros termos de busca"
                : "Ainda não há decks compartilhados. Seja o primeiro!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((deck) => (
            <Card key={deck.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div
                    className="h-4 w-4 rounded-full mt-0.5 shrink-0"
                    style={{ backgroundColor: deck.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{deck.title}</h3>
                    {deck.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {deck.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {deck.banca_name && (
                    <Badge variant="secondary" className="text-[10px]">
                      {deck.banca_name}
                    </Badge>
                  )}
                  {deck.specialty_name && (
                    <Badge variant="outline" className="text-[10px]">
                      {deck.specialty_name}
                    </Badge>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {deck.card_count} cards
                    </span>
                    <span className="flex items-center gap-1">
                      <Copy className="h-3 w-3" />
                      {deck.clone_count}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {deck.author_name}
                  </span>
                </div>

                {/* Action */}
                {deck.is_own ? (
                  <Badge variant="outline" className="w-full justify-center text-xs py-1.5">
                    Seu deck
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => handleClone(deck.id)}
                    disabled={cloningId === deck.id}
                  >
                    {cloningId === deck.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Clonar deck
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
