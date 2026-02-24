import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGroq, GROQ_MODEL } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { flashcard_id, front, back } = body as {
    flashcard_id: string;
    front: string;
    back: string;
  };

  if (!flashcard_id || !front || !back) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  // Buscar banca primária do usuário
  const { data: userBanca } = await supabase
    .from("user_bancas")
    .select("bancas(slug)")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .single();

  const bancaSlug =
    (userBanca?.bancas as unknown as { slug: string } | null)?.slug ?? "enare";

  const prompt = `Você é um especialista em criação de flashcards médicos para a prova de residência.

Contexto da banca: ${bancaSlug.toUpperCase()}

Analise este flashcard e retorne uma versão melhorada seguindo a regra da "informação mínima" (resposta em menos de 8 segundos).

**Flashcard original:**
Frente: ${front}
Verso: ${back}

**Regras para otimização:**
1. A frente deve ser uma pergunta clara e específica
2. O verso deve ser a resposta mínima necessária (sem texto desnecessário)
3. Se o card está muito genérico, torne-o mais específico
4. Se muito longo, quebre em conceito único

Responda APENAS com JSON válido no formato:
{
  "front": "pergunta otimizada",
  "back": "resposta mínima",
  "extra_context": "contexto adicional para entendimento mais profundo (opcional, pode ser null)",
  "suggestion": "breve explicação da melhoria feita (1 frase)"
}`;

  const completion = await getGroq().chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 512,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "Sem resposta da IA" },
      { status: 500 },
    );
  }

  let enriched: {
    front: string;
    back: string;
    extra_context?: string | null;
    suggestion?: string;
  };
  try {
    enriched = JSON.parse(content);
  } catch {
    return NextResponse.json(
      { error: "Resposta inválida da IA" },
      { status: 500 },
    );
  }

  // Atualizar flashcard no banco
  const { error: updateError } = await supabase
    .from("flashcards")
    .update({
      front: enriched.front,
      back: enriched.back,
      extra_context: enriched.extra_context ?? null,
      is_ai_enriched: true,
    })
    .eq("id", flashcard_id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    enriched,
    banca: bancaSlug,
  });
}
