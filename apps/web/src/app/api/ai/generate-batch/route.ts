import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGroq, GROQ_MODEL } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Premium gate
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plans(has_priority_ai)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planData = sub?.plans as any;
  if (!planData?.has_priority_ai) {
    return NextResponse.json(
      { error: "Disponível apenas para plano Premium" },
      { status: 403 },
    );
  }

  const { topic, count = 5 } = await req.json();
  if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
    return NextResponse.json(
      { error: "Topic must be at least 3 characters" },
      { status: 400 },
    );
  }

  const cardCount = Math.min(Math.max(Number(count), 3), 5);

  const groq = getGroq();

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `Você é um especialista em criar flashcards médicos para residência. Gere exatamente ${cardCount} flashcards sobre o tema fornecido.

Regras:
- front: pergunta direta ou frase cloze, máximo 20 palavras
- back: resposta essencial, máximo 15 palavras
- type: "qa" ou "cloze"
- Conteúdo baseado em diretrizes brasileiras quando aplicável
- Foco em conceitos cobrados em provas de residência

Responda APENAS com JSON válido, sem markdown:
{"flashcards":[{"type":"qa","front":"...","back":"..."}]}`,
      },
      {
        role: "user",
        content: `Tema do plantão: ${topic.trim()}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.flashcards)) {
      throw new Error("Invalid format");
    }

    const flashcards = parsed.flashcards.slice(0, cardCount).map(
      (fc: { type?: string; front?: string; back?: string }) => ({
        type: fc.type === "cloze" ? "cloze" : "qa",
        front: String(fc.front ?? "").slice(0, 200),
        back: String(fc.back ?? "").slice(0, 200),
      }),
    );

    return NextResponse.json({ flashcards, topic: topic.trim() });
  } catch {
    return NextResponse.json(
      { error: "Erro ao gerar flashcards. Tente novamente." },
      { status: 500 },
    );
  }
}
