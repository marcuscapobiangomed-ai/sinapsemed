import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGroq, GROQ_VISION_MODEL } from "@/lib/ai";
import type OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Você é um assistente especializado em extrair dados de resultados de simulados médicos brasileiros a partir de screenshots.

Analise a imagem enviada e extraia TODOS os dados visíveis do resultado do simulado.

Retorne APENAS um objeto JSON válido com os seguintes campos:
- "title": nome do simulado/prova (string ou null)
- "source": plataforma de origem — ex: "Medway", "Estratégia MED", "Revisamed", "Sanar", "AQFM", "QConcursos" (string ou null)
- "exam_date": data da prova no formato YYYY-MM-DD (string ou null)
- "total_questions": total de questões (número inteiro ou null)
- "correct_answers": total de acertos (número inteiro ou null)
- "duration_minutes": duração em minutos (número inteiro ou null)
- "specialties": lista de especialidades com breakdown — cada item com "name" (string), "questions" (int), "correct" (int ou null). Use null se não houver dados por especialidade.
- "easy_total": total de questões fáceis (int ou null)
- "easy_correct": acertos em questões fáceis (int ou null)
- "medium_total": total de questões médias (int ou null)
- "medium_correct": acertos em questões médias (int ou null)
- "hard_total": total de questões difíceis (int ou null)
- "hard_correct": acertos em questões difíceis (int ou null)

Regras:
- Se um campo não estiver visível na imagem, use null.
- Se a imagem mostrar "X/Y acertos" ou "acertos: X/Y", então correct_answers=X e total_questions=Y.
- Se a imagem mostrar porcentagem de acerto (ex: 93%) e total de questões (ex: 14), calcule correct_answers = round(93/100 * 14) = 13.
- Para duração no formato "0h 12min 57s", converta para minutos inteiros (ex: 13).
- Para especialidades, extraia o nome exatamente como aparece na imagem.
- Não invente dados que não estejam na imagem.
- Retorne APENAS o JSON, sem texto adicional.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { image } = (await req.json()) as { image?: string };

  if (!image) {
    return NextResponse.json({ error: "Imagem é obrigatória" }, { status: 400 });
  }

  if (!image.startsWith("data:") && !image.startsWith("http")) {
    return NextResponse.json({ error: "Formato de imagem inválido" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    console.error("[parse-simulation] GROQ_API_KEY não configurada");
    return NextResponse.json(
      { error: "Serviço de IA não configurado. Adicione GROQ_API_KEY no Vercel." },
      { status: 503 },
    );
  }

  try {
    const groq = getGroq();

    type ContentPart = OpenAI.Chat.Completions.ChatCompletionContentPart;

    const userContent: ContentPart[] = [
      { type: "text", text: "Extraia os dados do resultado deste simulado e retorne apenas o JSON:" },
      { type: "image_url", image_url: { url: image } },
    ];

    const completion = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content?.trim();

    if (!raw) {
      return NextResponse.json(
        { error: "Não foi possível analisar a imagem" },
        { status: 500 },
      );
    }

    // Parse JSON (suporta blocos de código markdown)
    let jsonStr = raw;
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Resposta da IA não contém JSON válido");
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[parse-simulation] Error:", errorMsg);
    return NextResponse.json(
      { error: "Erro ao processar a imagem. Tente novamente." },
      { status: 500 },
    );
  }
}
