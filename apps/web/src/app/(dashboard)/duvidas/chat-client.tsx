"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  bancas?: string[];
}

interface ChatClientProps {
  doubtsUsed: number;
  maxDoubts: number;
  userBancas: string[];
}

const EXAMPLE_QUESTIONS = [
  "Qual a diferença entre sepse e choque séptico segundo o Sepsis-3?",
  "Quando indicar colecistectomia na colelitíase assintomática?",
  "Qual o manejo inicial do AVC isquêmico nas primeiras 4,5h?",
];

export function ChatClient({ doubtsUsed, maxDoubts, userBancas }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentDoubts, setCurrentDoubts] = useState(doubtsUsed);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAtLimit = maxDoubts !== null && currentDoubts >= maxDoubts;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
  }, [input]);

  async function handleSend(question?: string) {
    const text = (question ?? input).trim();
    if (!text || isStreaming) return;

    if (isAtLimit) {
      toast.error(`Limite de ${maxDoubts} dúvidas/dia atingido.`);
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      // Build history from last 6 messages (excluding the new ones)
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, history }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMsg = errorData?.error ?? `Erro ${res.status}`;
        toast.error(errorMsg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
        setIsStreaming(false);
        return;
      }

      // Extract bancas from header
      const bancasHeader = res.headers.get("X-Bancas");
      const bancas =
        bancasHeader && bancasHeader !== "none"
          ? bancasHeader.split(",")
          : [];

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        toast.error("Erro ao ler resposta");
        setIsStreaming(false);
        return;
      }

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: fullContent, bancas }
              : m,
          ),
        );
      }

      setCurrentDoubts((prev) => prev + 1);
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div>
          <h1 className="text-lg font-bold">Tira-Dúvidas</h1>
          <p className="text-xs text-muted-foreground">
            Mentor IA especialista nas suas bancas
          </p>
        </div>
        <Badge
          variant={isAtLimit ? "destructive" : "secondary"}
          className="text-xs"
        >
          {currentDoubts}/{maxDoubts} hoje
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">
              Pergunte qualquer dúvida médica
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              O mentor adapta cada resposta para{" "}
              {userBancas.length > 0
                ? userBancas.join(", ")
                : "suas bancas"}
              , com flashcards prontos para salvar.
            </p>

            <div className="mt-6 space-y-2 w-full max-w-md">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={isAtLimit}
                  className="w-full text-left px-4 py-3 rounded-lg border text-sm hover:bg-accent/50 transition-colors disabled:opacity-50"
                >
                  <MessageCircle className="h-3.5 w-3.5 inline mr-2 text-primary" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border",
                  )}
                >
                  {msg.role === "assistant" ? (
                    <>
                      {msg.content ? (
                        <div className="prose-chat">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Pensando...</span>
                        </div>
                      )}
                      {msg.bancas && msg.bancas.length > 0 && msg.content && (
                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/50">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Bancas:
                          </span>
                          {msg.bancas.map((b) => (
                            <Badge
                              key={b}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {b.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4 shrink-0">
        {isAtLimit ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-2">
            <AlertCircle className="h-4 w-4" />
            Limite de {maxDoubts} dúvidas/dia atingido. Faça upgrade para mais.
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua dúvida médica..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none rounded-lg border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="h-11 w-11 shrink-0 rounded-lg"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
