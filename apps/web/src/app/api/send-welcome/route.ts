import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "name e email são obrigatórios" }, { status: 400 });
  }

  // Se a variável não estiver configurada, apenas loga e retorna ok
  // para não quebrar o fluxo de onboarding
  if (!process.env.RESEND_API_KEY) {
    console.warn("[send-welcome] RESEND_API_KEY não configurada — email não enviado");
    return NextResponse.json({ ok: true, skipped: true });
  }

  const firstName = name.split(" ")[0];

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "SinapseMED <noreply@sinapsemed.com>",
      to: email,
      subject: `Bem-vindo ao SinapseMED, ${firstName}!`,
      html: welcomeHtml(firstName),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Não quebra o fluxo — apenas loga o erro
    console.error("[send-welcome] Erro ao enviar email:", err);
    return NextResponse.json({ ok: true, error: "falha no envio" });
  }
}

function welcomeHtml(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao SinapseMED</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:28px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="background:#7c3aed;border-radius:8px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:bold;">S</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">SinapseMED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">
                Olá, ${firstName}! 👋
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#71717a;line-height:1.6;">
                Sua conta no SinapseMED está pronta. Você acaba de dar o primeiro passo
                rumo à aprovação na residência médica.
              </p>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${[
                  ["📚", "Crie seus decks", "Adicione flashcards por especialidade e comece a revisar com repetição espaçada."],
                  ["📊", "Registre seus simulados", "Cole o print do resultado e a IA analisa tudo automaticamente."],
                  ["🎯", "Acompanhe sua evolução", "O dashboard mostra sua tendência de aprovação e onde melhorar."],
                ].map(([icon, title, desc]) => `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:20px;vertical-align:top;padding-right:12px;padding-top:2px;">${icon}</td>
                        <td>
                          <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#18181b;">${title}</p>
                          <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">${desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join("")}
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://sinapsemed.com"}/dashboard"
                       style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:15px;font-weight:600;padding:13px 32px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
                      Ir para o Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f4f4f5;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                SinapseMED · Estudo inteligente para residência médica
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#d4d4d8;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://sinapsemed.com"}/privacidade"
                   style="color:#a1a1aa;text-decoration:underline;">Privacidade</a>
                &nbsp;·&nbsp;
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://sinapsemed.com"}/termos"
                   style="color:#a1a1aa;text-decoration:underline;">Termos</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
