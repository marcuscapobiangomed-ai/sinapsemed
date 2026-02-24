"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Lock, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface ShareDeckButtonProps {
  deckId: string;
  isPublic: boolean;
  shareCode: string | null;
}

export function ShareDeckButton({
  deckId,
  isPublic: initialPublic,
  shareCode: initialCode,
}: ShareDeckButtonProps) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [shareCode, setShareCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggleShare() {
    setLoading(true);
    try {
      const res = await fetch("/api/deck-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, isPublic: !isPublic }),
      });

      if (!res.ok) throw new Error("Erro ao alterar compartilhamento");

      const data = await res.json();
      setIsPublic(data.is_public);
      setShareCode(data.share_code);
      router.refresh();
      toast.success(data.is_public ? "Deck compartilhado!" : "Deck privado");
    } catch {
      toast.error("Erro ao alterar compartilhamento");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/marketplace?deck=${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copiado!");
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {isPublic ? (
            <Globe className="h-4 w-4 text-green-500" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          {isPublic ? "Público" : "Privado"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold">Compartilhar deck</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Decks públicos aparecem no marketplace e podem ser clonados por outros estudantes.
            </p>
          </div>

          <Button
            onClick={toggleShare}
            disabled={loading}
            variant={isPublic ? "destructive" : "default"}
            size="sm"
            className="w-full gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPublic ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            {isPublic ? "Tornar privado" : "Tornar público"}
          </Button>

          {isPublic && shareCode && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={copyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copiado!" : "Copiar link"}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
