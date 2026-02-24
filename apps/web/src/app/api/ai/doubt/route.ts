import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { groq, GROQ_MODEL, GROQ_VISION_MODEL, buildMentorPrompt } from "@/lib/ai";
import type OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Extract all banca slugs for a user */
function extractBancaSlugs(
  userBancas: { bancas: unknown }[] | null,
): string[] {
  return (userBancas ?? [])
    .map((ub) => (ub.bancas as { slug: string } | null)?.slug)
    .filter((s): s is string => !!s);
}

export async function POST(req: NextRequest) {
  // Support both cookie auth (web app) and Bearer token (extension)
  const authHeader = req.headers.get("authorization");
  let userId: string | null = null;
  let bancaSlugs: string[] = [];

  if (authHeader?.startsWith("Bearer ")) {
    // Extension auth: verify JWT directly
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
      bancaSlugs = extractBancaSlugs(userBancas);
    }
  } else {
    // Web app auth: use cookie-based client
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
      bancaSlugs = extractBancaSlugs(userBancas);
    }
  }

  if (!userId) {
    return new Response("Não autorizado", {
      status: 401,
      headers: CORS_HEADERS,
    });
  }

  const body = await req.json();
  const { question, context, history = [], image } = body as {
    question: string;
    context?: string;
    history?: { role: "user" | "assistant"; content: string }[];
    image?: string;
  };

  if (!question?.trim()) {
    return new Response("Pergunta não pode estar vazia", {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  // Check doubt limit
  const dbClient = authHeader?.startsWith("Bearer ")
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
    : await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: doubtsToday } = await dbClient
    .from("doubt_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString());

  const { data: sub } = await dbClient
    .from("subscriptions")
    .select("plans(max_doubts_per_day)")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maxDoubts = (sub as any)?.plans?.max_doubts_per_day ?? 5; // free default

  if (maxDoubts !== null && (doubtsToday ?? 0) >= maxDoubts) {
    return new Response(
      JSON.stringify({ error: `Limite de ${maxDoubts} dúvidas/dia atingido. Faça upgrade do plano.` }),
      { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  // Log doubt
  await dbClient.from("doubt_logs").insert({ user_id: userId, question });

  const systemPrompt = buildMentorPrompt(bancaSlugs);

  const textContent = context
    ? `**Contexto da página:**\n${context}\n\n**Dúvida:**\n${question}`
    : question;

  const hasImage = !!image;

  // Build user message: multimodal when image present, plain text otherwise
  type ContentPart = OpenAI.Chat.Completions.ChatCompletionContentPart;
  type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string | ContentPart[];
  };

  const userContent: string | ContentPart[] = hasImage
    ? [
        { type: "text" as const, text: textContent },
        {
          type: "image_url" as const,
          image_url: { url: image },
        },
      ]
    : textContent;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userContent },
  ];

  const model = hasImage ? GROQ_VISION_MODEL : GROQ_MODEL;

  const stream = await groq.chat.completions.create({
    model,
    messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    stream: true,
    temperature: 0.3,
    max_tokens: 2048,
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch {
        controller.error(new Error("Erro ao processar stream"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Bancas": bancaSlugs.join(",") || "none",
    },
  });
}
