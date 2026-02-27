import { useState, useEffect } from "react";
import { sendMessage } from "@/lib/messages";
import { getCachedDecks } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

interface FlashcardFormProps {
  initialFront?: string;
  initialBack?: string;
  sourceUrl?: string;
  suggestedTags?: string[];
  suggestedBancas?: string[];
}

/** Common medical specialty tags for quick selection */
const COMMON_TAGS = [
  "Cardiologia", "Pneumologia", "Infectologia", "Nefrologia",
  "Gastroenterologia", "Neurologia", "Endocrinologia", "Hematologia",
  "Reumatologia", "Cirurgia", "Pediatria", "Ginecologia",
  "Ortopedia", "Dermatologia", "Psiquiatria", "Emergência",
  "Farmacologia", "Semiologia", "Ética Médica", "Saúde Pública",
];

const COMMON_BANCAS = [
  "ENARE", "ENAMED", "USP-SP", "UNICAMP",
  "SES-DF", "SUS-SP", "FAMERP", "Santa Casa SP",
];

export function FlashcardForm({
  initialFront = "",
  initialBack = "",
  sourceUrl,
  suggestedTags = [],
  suggestedBancas = [],
}: FlashcardFormProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [deckId, setDeckId] = useState("");

  // Topic tags (specialty, topic)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);

  // Banca tags (exam-specific)
  const [selectedBancas, setSelectedBancas] = useState<string[]>([]);
  const [showAllBancas, setShowAllBancas] = useState(false);

  const [decks, setDecks] = useState<Array<{ id: string; title: string; color: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [duplicate, setDuplicate] = useState<{ id: string; front: string; back: string } | null>(null);
  const [ignoreDuplicate, setIgnoreDuplicate] = useState(false);

  // Create deck state
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [newDeckColor, setNewDeckColor] = useState("#3B82F6");
  const [creatingDeck, setCreatingDeck] = useState(false);
  const [deckError, setDeckError] = useState("");

  useEffect(() => {
    async function loadDecks() {
      const cached = await getCachedDecks();
      if (cached && cached.length > 0) {
        setDecks(cached);
        setDeckId(cached[0].id);
      }

      const response = await sendMessage<Array<{ id: string; title: string; color: string }>>({
        type: "GET_DECKS",
      });

      if (response.success && response.data) {
        setDecks(response.data);
        if (!deckId && response.data.length > 0) {
          setDeckId(response.data[0].id);
        }
      }

      setLoadingDecks(false);
    }
    loadDecks();
  }, []);

  useEffect(() => { setFront(initialFront); }, [initialFront]);
  useEffect(() => { setBack(initialBack); }, [initialBack]);

  // Auto-populate from AI suggestions
  useEffect(() => {
    if (suggestedTags.length > 0) setSelectedTags(suggestedTags);
  }, [suggestedTags.join(",")]);

  useEffect(() => {
    if (suggestedBancas.length > 0) setSelectedBancas(suggestedBancas);
  }, [suggestedBancas.join(",")]);

  // ── Topic tag helpers ──
  function addTag(tag: string) {
    const n = tag.trim();
    if (n && !selectedTags.some((t) => t.toLowerCase() === n.toLowerCase())) {
      setSelectedTags((prev) => [...prev, n]);
    }
  }

  function removeTag(tag: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  }

  // ── Banca helpers ──
  function addBanca(banca: string) {
    const n = banca.trim();
    if (n && !selectedBancas.some((b) => b.toLowerCase() === n.toLowerCase())) {
      setSelectedBancas((prev) => [...prev, n]);
    }
  }

  function removeBanca(banca: string) {
    setSelectedBancas((prev) => prev.filter((b) => b !== banca));
  }

  async function checkDuplicate(frontText: string): Promise<{ id: string; front: string; back: string } | null> {
    const keywords = frontText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .slice(0, 4);

    if (keywords.length === 0) return null;

    const filters = keywords.map((kw) => `front.ilike.%${kw}%`).join(",");
    const { data } = await supabase
      .from("flashcards")
      .select("id, front, back")
      .or(filters)
      .limit(1)
      .maybeSingle();

    return data ?? null;
  }

  async function handleCreateDeck() {
    if (!newDeckTitle.trim()) return;

    setCreatingDeck(true);
    setDeckError("");

    const response = await sendMessage<{ id: string; title: string; color: string }>({
      type: "CREATE_DECK",
      payload: {
        title: newDeckTitle.trim(),
        description: newDeckDesc.trim() || undefined,
        color: newDeckColor,
      },
    });

    if (response.success && response.data) {
      // Add new deck to list
      const updatedDecks = [...decks, response.data].sort((a, b) => a.title.localeCompare(b.title));
      setDecks(updatedDecks);
      setDeckId(response.data.id);

      // Reset form
      setNewDeckTitle("");
      setNewDeckDesc("");
      setNewDeckColor("#3B82F6");
      setShowCreateDeck(false);
    } else {
      setDeckError(response.error ?? "Erro ao criar deck");
    }

    setCreatingDeck(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !deckId) return;

    // Check for duplicates unless user already chose to ignore
    if (!ignoreDuplicate) {
      const found = await checkDuplicate(front.trim());
      if (found) {
        setDuplicate(found);
        return;
      }
    }

    setLoading(true);
    setError("");
    setSuccess(false);
    setDuplicate(null);
    setIgnoreDuplicate(false);

    const response = await sendMessage({
      type: "CREATE_FLASHCARD",
      payload: {
        front: front.trim(),
        back: back.trim(),
        deck_id: deckId,
        tags: [...selectedTags, ...selectedBancas],
        source: "extension_text" as const,
        source_url: sourceUrl,
      },
    });

    if (response.success) {
      setSuccess(true);
      setFront("");
      setBack("");
      setSelectedTags([]);
      setSelectedBancas([]);
      setTagInput("");
      setTimeout(() => setSuccess(false), 2000);
    } else {
      setError(response.error ?? "Erro ao criar flashcard");
    }

    setLoading(false);
  }

  if (loadingDecks) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">Nenhum deck encontrado.</p>
        <p className="text-xs text-gray-400 mt-1">Crie um deck no app web primeiro.</p>
      </div>
    );
  }

  const remainingTopicSuggestions = suggestedTags.filter(
    (t) => !selectedTags.some((s) => s.toLowerCase() === t.toLowerCase()),
  );
  const remainingBancaSuggestions = suggestedBancas.filter(
    (b) => !selectedBancas.some((s) => s.toLowerCase() === b.toLowerCase()),
  );
  const availableCommonBancas = COMMON_BANCAS.filter(
    (b) => !selectedBancas.some((s) => s.toLowerCase() === b.toLowerCase()),
  );
  const availableCommonTags = COMMON_TAGS.filter(
    (t) => !selectedTags.some((s) => s.toLowerCase() === t.toLowerCase()),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Deck selector */}
      <div>
        <label htmlFor="deck" className="block text-sm font-medium text-gray-700 mb-1">
          Deck
        </label>
        <div className="flex gap-2">
          <select
            id="deck"
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>{deck.title}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowCreateDeck(!showCreateDeck)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            + Novo
          </button>
        </div>
      </div>

      {/* Create deck form */}
      {showCreateDeck && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-3">
          <p className="text-xs font-semibold text-blue-900">📚 Criar novo deck</p>
          <div className="space-y-2">
            <input
              type="text"
              value={newDeckTitle}
              onChange={(e) => setNewDeckTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateDeck()}
              placeholder="Nome do deck (ex: Cardiologia)"
              className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <input
              type="text"
              value={newDeckDesc}
              onChange={(e) => setNewDeckDesc(e.target.value)}
              placeholder="Descrição (opcional)"
              className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <div className="flex gap-1.5">
              <span className="text-[11px] text-blue-700 font-medium self-center">Cor:</span>
              <div className="flex gap-1">
                {["#3B82F6", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", "#22C55E"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewDeckColor(color)}
                    className="h-6 w-6 rounded-full border-2 transition-transform"
                    style={{
                      backgroundColor: color,
                      borderColor: newDeckColor === color ? "#1F2937" : "transparent",
                      transform: newDeckColor === color ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
            {deckError && (
              <p className="text-xs text-red-600">{deckError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateDeck}
                disabled={creatingDeck || !newDeckTitle.trim()}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creatingDeck ? "Criando..." : "Criar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateDeck(false);
                  setNewDeckTitle("");
                  setNewDeckDesc("");
                  setNewDeckColor("#3B82F6");
                  setDeckError("");
                }}
                className="flex-1 py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Front */}
      <div>
        <label htmlFor="front" className="block text-sm font-medium text-gray-700 mb-1">
          Frente
        </label>
        <textarea
          id="front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          placeholder="Pergunta ou conceito..."
        />
      </div>

      {/* Back */}
      <div>
        <label htmlFor="back" className="block text-sm font-medium text-gray-700 mb-1">
          Verso
        </label>
        <textarea
          id="back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          placeholder="Resposta..."
        />
      </div>

      {/* ── Tags + Bancas ── */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Selected chips row */}
        {(selectedTags.length > 0 || selectedBancas.length > 0) && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2.5 pb-2">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-100 text-brand-700 rounded-md text-xs font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-brand-400 hover:text-brand-700 transition-colors leading-none"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedBancas.map((banca) => (
              <span
                key={banca}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-md text-xs font-medium"
              >
                🏛️ {banca}
                <button
                  type="button"
                  onClick={() => removeBanca(banca)}
                  className="text-violet-400 hover:text-violet-700 transition-colors leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Topic input */}
        <div className="px-3 pt-2 pb-1">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
            placeholder={selectedTags.length > 0 ? "Adicionar tema..." : "Tema (ex: ECG, Sepse, Pneumonia)"}
          />
        </div>

        {/* AI Suggestions — only shown when coming from AI */}
        {(remainingTopicSuggestions.length > 0 || remainingBancaSuggestions.length > 0) && (
          <div className="mx-3 my-2 rounded-lg bg-gradient-to-r from-brand-50 to-violet-50 border border-brand-100 p-2 space-y-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">⚡ Sugestões da IA</p>

            {remainingTopicSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {remainingTopicSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-0.5 bg-white border border-brand-200 text-brand-600 rounded-md text-[11px] font-medium hover:bg-brand-50 hover:border-brand-400 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}

            {remainingBancaSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="self-center text-[10px] text-violet-400 font-medium mr-0.5">🏛️</span>
                {remainingBancaSuggestions.map((banca) => (
                  <button
                    key={banca}
                    type="button"
                    onClick={() => addBanca(banca)}
                    className="px-2 py-0.5 bg-white border border-violet-200 text-violet-600 rounded-md text-[11px] font-medium hover:bg-violet-50 hover:border-violet-400 transition-colors"
                  >
                    + {banca}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expandable quick-pick sections */}
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {/* Especialidades */}
          <div>
            <button
              type="button"
              onClick={() => setShowAllTags(!showAllTags)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">📚 Especialidades comuns</span>
              <span>{showAllTags ? "▾" : "▸"}</span>
            </button>
            {showAllTags && (
              <div className="flex flex-wrap gap-1 px-3 pb-2.5">
                {availableCommonTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-md text-[11px] hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bancas */}
          <div>
            <button
              type="button"
              onClick={() => setShowAllBancas(!showAllBancas)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">🏛️ Bancas</span>
              <span>{showAllBancas ? "▾" : "▸"}</span>
            </button>
            {showAllBancas && (
              <div className="flex flex-wrap gap-1 px-3 pb-2.5">
                {availableCommonBancas.map((banca) => (
                  <button
                    key={banca}
                    type="button"
                    onClick={() => addBanca(banca)}
                    className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-md text-[11px] hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-colors"
                  >
                    {banca}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate warning */}
      {duplicate && !ignoreDuplicate && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-800">⚠️ Card similar já existe</p>
          <div className="bg-white rounded-lg border border-amber-100 px-2.5 py-2">
            <p className="text-[11px] font-medium text-gray-700 line-clamp-2">{duplicate.front}</p>
            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{duplicate.back}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setIgnoreDuplicate(true); setDuplicate(null); }}
              className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Criar mesmo assim
            </button>
            <button
              type="button"
              onClick={() => setDuplicate(null)}
              className="flex-1 py-1.5 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Status messages */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          Flashcard criado com sucesso!
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !front.trim() || !back.trim()}
        className="w-full py-2 px-4 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Salvando..." : "Criar Flashcard"}
      </button>

      {/* Source URL indicator */}
      {sourceUrl && (
        <p className="text-xs text-gray-400 truncate" title={sourceUrl}>
          Fonte: {sourceUrl}
        </p>
      )}
    </form>
  );
}
