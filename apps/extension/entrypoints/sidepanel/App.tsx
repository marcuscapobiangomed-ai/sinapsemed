import { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import Markdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { LoginForm } from "@/components/LoginForm";
import { FlashcardForm } from "@/components/FlashcardForm";
import { ReviewSession } from "@/components/ReviewSession";
import {
  getSelectedText,
  clearSelectedText,
  getQueue,
  getAndClearPreferredTab,
} from "@/lib/storage";
import { WEB_APP_URL } from "@/lib/config";

type Tab = "flashcard" | "chat" | "review";

interface SuggestedFlashcard {
  type: string;
  front: string;
  back: string;
  topic: string;
  banca: string[];
  source?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  context?: string;
  imageUrl?: string;
}

/** Compress an image file to max width and JPEG quality for efficient upload */
function compressImage(file: Blob, maxWidth = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas não suportado"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    img.src = url;
  });
}

/** Extract flashcard JSON from assistant response and return clean content */
function extractFlashcards(content: string): {
  cleanContent: string;
  flashcards: SuggestedFlashcard[];
} {
  const jsonRegex = /```json\s*\n?([\s\S]*?)\n?\s*```/;
  const match = content.match(jsonRegex);

  let cleanContent = content;
  let flashcards: SuggestedFlashcard[] = [];

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        flashcards = parsed.flashcards;
      }
    } catch {
      // Incomplete JSON during streaming
    }
    cleanContent = content.replace(jsonRegex, "").trim();
  }

  // Strip any trailing incomplete ```json block (during streaming)
  cleanContent = cleanContent.replace(/```json[\s\S]*$/, "").trim();
  // Remove trailing empty "Flashcard" heading left without content
  cleanContent = cleanContent.replace(/\*?\*?\d+\.\s*⚡\s*Flashcards?\*?\*?\s*$/, "").trim();

  return { cleanContent, flashcards };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("flashcard");

  // Shared: text selected on the page
  const [selectedText, setSelectedText] = useState("");
  const [selectedUrl, setSelectedUrl] = useState("");
  const [queueCount, setQueueCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [authToken, setAuthToken] = useState("");

  // Pending flashcard from AI suggestion
  const [pendingFlashcard, setPendingFlashcard] = useState<{
    front: string;
    back: string;
    suggestedTags: string[];
    suggestedBancas: string[];
  } | null>(null);
  const [generatingFlashcard, setGeneratingFlashcard] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // Chat state
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatImage, setChatImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // Load selected text and preferred tab
      const [selected, preferredTab] = await Promise.all([
        getSelectedText(),
        getAndClearPreferredTab(),
      ]);

      if (selected) {
        setSelectedText(selected.text);
        setSelectedUrl(selected.url);
        await clearSelectedText();
      }

      if (preferredTab) setActiveTab(preferredTab);

      const queue = await getQueue();
      setQueueCount(queue.length);

      // Load due cards count for review tab badge
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      if (authSession?.access_token) {
        setAuthToken(authSession.access_token);
      }
      const now = new Date().toISOString();
      const { count } = await supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("is_suspended", false)
        .lte("next_review_at", now);
      setDueCount(count ?? 0);

      setLoading(false);
    }
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function handleGenerateFromText() {
    if (!selectedText || generatingFlashcard) return;
    setGeneratingFlashcard(true);
    setGenerateError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessão expirada");

      const res = await fetch(`${WEB_APP_URL}/api/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: selectedText }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Erro ${res.status}`);
      }

      const data = await res.json() as {
        front: string;
        back: string;
        topic: string;
        banca: string[];
      };

      setPendingFlashcard({
        front: data.front,
        back: data.back,
        suggestedTags: data.topic ? [data.topic] : [],
        suggestedBancas: data.banca ?? [],
      });
      setSelectedText("");
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Erro ao gerar flashcard",
      );
    } finally {
      setGeneratingFlashcard(false);
    }
  }

  function handleCreateFromSuggestion(fc: SuggestedFlashcard) {
    // Separate: topic → tags (specialty), banca → bancas (exam-specific)
    const topicTags = fc.topic ? [fc.topic] : [];
    const bancaTags = fc.banca ?? [];
    setPendingFlashcard({
      front: fc.front,
      back: fc.back,
      suggestedTags: topicTags,
      suggestedBancas: bancaTags,
    });
    setActiveTab("flashcard");
  }

  async function handleImagePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const compressed = await compressImage(file);
          setChatImage(compressed);
        }
        return;
      }
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setChatImage(compressed);
    }
    e.target.value = "";
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || sending) return;

    setChatError("");
    const currentImage = chatImage;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question.trim(),
      context: selectedText || undefined,
      imageUrl: currentImage || undefined,
    };

    const assistantMsgId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);
    setQuestion("");
    setChatImage(null);
    setSending(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");

      const history = messages
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${WEB_APP_URL}/api/ai/doubt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: userMsg.content,
          context: selectedText || undefined,
          history,
          image: currentImage || undefined,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Erro ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Sem resposta da IA");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: m.content + chunk }
              : m,
          ),
        );
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const msg = raw.includes("fetch")
        ? "Servidor offline. Inicie o app com `pnpm dev:web`."
        : raw || "Erro ao conectar com a IA";
      setChatError(msg);
      setMessages((prev) =>
        prev.filter((m) => !(m.id === assistantMsgId && !m.content)),
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm onSuccess={setUser} />;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* ── Header ── */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">SinapseMED</span>
          {queueCount > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              {queueCount} offline
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sair
        </button>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex bg-gray-50 border-b border-gray-200 flex-shrink-0 p-1 gap-1 mx-3 mt-2 mb-0 rounded-lg">
        <button
          onClick={() => setActiveTab("flashcard")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === "flashcard"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📝 Flashcard
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === "chat"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          💬 Dúvidas
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`flex-1 relative py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === "review"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🔄 Revisar
          {dueCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {dueCount > 99 ? "99+" : dueCount}
            </span>
          )}
        </button>
      </div>

      {/* ── FLASHCARD TAB ── */}
      {activeTab === "flashcard" && (
        <div className="flex-1 overflow-y-auto p-4 pt-3">
          {selectedText && (
            <div className="mb-4 bg-brand-50 border border-brand-200 rounded-xl overflow-hidden">
              <div className="px-3 pt-2.5 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-brand-700">
                    Texto capturado da página
                  </p>
                  <button
                    onClick={() => setSelectedText("")}
                    className="text-xs text-brand-400 hover:text-brand-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-brand-800 line-clamp-3 leading-relaxed">
                  {selectedText}
                </p>
              </div>
              <div className="border-t border-brand-200 px-3 py-2 flex items-center gap-2">
                <button
                  onClick={handleGenerateFromText}
                  disabled={generatingFlashcard}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {generatingFlashcard ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>⚡ Gerar flashcard com IA</>
                  )}
                </button>
              </div>
              {generateError && (
                <p className="px-3 pb-2 text-xs text-red-600">{generateError}</p>
              )}
            </div>
          )}
          <FlashcardForm
            initialFront={pendingFlashcard?.front || selectedText}
            initialBack={pendingFlashcard?.back || ""}
            sourceUrl={selectedUrl}
            suggestedTags={pendingFlashcard?.suggestedTags}
            suggestedBancas={pendingFlashcard?.suggestedBancas}
          />
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {activeTab === "chat" && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 pt-2">
          {/* Context badge */}
          {selectedText && (
            <div className="mx-3 mb-1 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 flex-shrink-0">
              <span className="text-blue-400 mt-0.5 flex-shrink-0">📎</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-800 line-clamp-2 leading-relaxed">
                  {selectedText}
                </p>
              </div>
              <button
                onClick={() => setSelectedText("")}
                className="text-blue-300 hover:text-blue-500 flex-shrink-0 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                  <span className="text-2xl">🩺</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Tira-Dúvidas IA
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Selecione um texto em qualquer página e pergunte sobre ele, ou
                  digite sua dúvida médica diretamente.
                </p>
                <div className="mt-4 space-y-2 w-full">
                  {[
                    "Qual o tratamento de 1ª linha para HAS?",
                    "Critérios diagnósticos de sepse",
                  ].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setQuestion(ex)}
                      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs text-gray-600 transition-colors border border-gray-200"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[88%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed bg-brand-600 text-white rounded-br-sm">
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Imagem anexada"
                          className="max-h-32 rounded-lg object-contain mb-2 border border-white/20"
                        />
                      )}
                      {msg.context && (
                        <p className="opacity-60 mb-1.5 italic border-b border-white/20 pb-1 text-[11px]">
                          📎 &ldquo;{msg.context.slice(0, 70)}
                          {msg.context.length > 70 ? "..." : ""}&rdquo;
                        </p>
                      )}
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // Assistant message: extract flashcards
              const { cleanContent, flashcards } = extractFlashcards(msg.content);

              return (
                <div key={msg.id} className="flex flex-col items-start gap-2">
                  <div className="max-w-[92%] px-3.5 py-3 rounded-2xl rounded-bl-sm bg-gray-50 border border-gray-200">
                    {cleanContent ? (
                      <div className="prose-chat">
                        <Markdown>{cleanContent}</Markdown>
                      </div>
                    ) : (
                      <span className="flex gap-1 items-center text-gray-400">
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>

                  {/* Flashcard suggestions */}
                  {flashcards.length > 0 && (
                    <div className="w-full rounded-xl border border-brand-200 bg-gradient-to-b from-brand-50/80 to-white overflow-hidden">
                      <div className="px-3 py-2 border-b border-brand-100 flex items-center gap-1.5">
                        <span className="text-sm">⚡</span>
                        <span className="text-[11px] font-semibold text-brand-700">
                          Flashcards sugeridos
                        </span>
                        <span className="text-[10px] text-brand-400 ml-auto">
                          Clique para criar
                        </span>
                      </div>
                      <div className="divide-y divide-brand-100">
                        {flashcards.map((fc, i) => (
                          <button
                            key={i}
                            onClick={() => handleCreateFromSuggestion(fc)}
                            className="w-full text-left px-3 py-2.5 hover:bg-brand-50 transition-colors group flex items-start gap-2.5"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-1.5">
                                <span className="text-[10px] font-bold text-brand-500 mt-px shrink-0">Q</span>
                                <p className="text-[11px] font-medium text-gray-800 line-clamp-2 leading-relaxed">
                                  {fc.front}
                                </p>
                              </div>
                              <div className="flex items-start gap-1.5 mt-1">
                                <span className="text-[10px] font-bold text-emerald-500 mt-px shrink-0">R</span>
                                <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">
                                  {fc.back}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 mt-1.5">
                                {fc.topic && (
                                  <span className="inline-block px-1.5 py-0.5 bg-brand-100 text-brand-600 rounded text-[9px] font-medium">
                                    {fc.topic}
                                  </span>
                                )}
                                {fc.banca?.slice(0, 2).map((b) => (
                                  <span
                                    key={b}
                                    className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px]"
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="shrink-0 mt-1 w-7 h-7 rounded-lg bg-brand-100 group-hover:bg-brand-600 flex items-center justify-center transition-colors">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 text-brand-600 group-hover:text-white transition-colors"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {chatError && (
              <div className="flex justify-center">
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 max-w-[90%] text-center">
                  {chatError}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <form
            onSubmit={handleSendChat}
            onPaste={handleImagePaste}
            className="border-t border-gray-100 p-3 flex flex-col gap-2 flex-shrink-0"
          >
            {/* Image preview strip */}
            {chatImage && (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                <img
                  src={chatImage}
                  alt="Preview"
                  className="h-12 w-12 rounded-lg object-cover border border-gray-300"
                />
                <span className="text-[11px] text-gray-500 flex-1">Imagem anexada</span>
                <button
                  type="button"
                  onClick={() => setChatImage(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-sm px-1"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex gap-2">
              {/* Image button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="w-9 h-9 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-100 hover:text-brand-600 disabled:opacity-40 transition-colors flex-shrink-0"
                title="Anexar imagem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={sending}
                placeholder={chatImage ? "Descreva sua dúvida sobre a imagem..." : "Qual sua dúvida?"}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={!question.trim() || sending}
                className="w-9 h-9 flex items-center justify-center bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {sending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── REVIEW TAB ── */}
      {activeTab === "review" && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 pt-1">
          <ReviewSession
            authToken={authToken}
            onCountChange={(count) => setDueCount(count)}
          />
        </div>
      )}
    </div>
  );
}
