import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { groq, GROQ_MODEL } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 20;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Extract all banca display names for a user */
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

function extractBancaNames(
  userBancas: { bancas: unknown }[] | null,
): string[] {
  return (userBancas ?? [])
    .map((ub) => {
      const slug = (ub.bancas as { slug: string } | null)?.slug;
      return slug ? (BANCA_DISPLAY_NAMES[slug] ?? slug.toUpperCase()) : null;
    })
    .filter((s): s is string => !!s);
}

export async function POST(req: NextRequest) {
  // Support both cookie auth (web app) and Bearer token (extension)
  const authHeader = req.headers.get("authorization");
  let userId: string | null = null;
  let bancaNames: string[] = [];

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data } = await serviceClient.auth.getUser(token);
    userId = data.user?.id ?? null;

    if (userId) {
      const { data: userBancas } = await serviceClient
        .from("user_bancas")
        .select("bancas(slug)")
        .eq("user_id", userId);
      bancaNames = extractBancaNames(userBancas);
    }
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    if (userId) {
      const { data: userBancas } = await supabase
        .from("user_bancas")
        .select("bancas(slug)")
        .eq("user_id", userId);
      bancaNames = extractBancaNames(userBancas);
    }
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const body = await req.json();
  const { text } = body as { text: string };

  if (!text?.trim() || text.trim().length < 10) {
    return NextResponse.json(
      { error: "Texto muito curto para gerar flashcard" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const bancaContext =
    bancaNames.length > 0
      ? `Bancas do estudante: ${bancaNames.join(", ")}.`
      : "";

  const prompt = `Você é um especialista em criação de flashcards médicos para residência.

Crie 1 flashcard seguindo a regra da informação mínima (resposta em menos de 8 segundos).
${bancaContext}

Texto-fonte:
${text.trim().slice(0, 1500)}

Regras:
- front: pergunta direta e específica (máx 15 palavras)
- back: resposta mínima essencial (máx 10 palavras, sem explicação)
- topic: especialidade médica ou tema (1-3 palavras)
- banca: array com bancas do estudante onde este tema é frequentemente cobrado. Máx 2. Pode ser [].

Retorne APENAS JSON válido no formato:
{
  "front": "...",
  "back": "...",
  "topic": "...",
  "banca": []
}`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 256,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "Sem resposta da IA" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  let result: { front: string; back: string; topic: string; banca: string[] };
  try {
    result = JSON.parse(content);
  } catch {
    return NextResponse.json(
      { error: "Resposta inválida da IA" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(result, { headers: CORS_HEADERS });
}
