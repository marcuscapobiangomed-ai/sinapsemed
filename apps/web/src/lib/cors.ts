const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://sinapsemed.com";

export function corsHeaders(methods = "POST, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  } as const;
}

export function corsOptions(methods?: string) {
  return new Response(null, { status: 204, headers: corsHeaders(methods) });
}
