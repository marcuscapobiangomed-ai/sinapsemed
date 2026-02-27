import { Metadata } from "next";
import Link from "next/link";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Privacidade | SinapseMED",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header mínimo */}
      <header className="border-b py-4 px-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold">SinapseMED</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">← Voltar</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-14 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Esta Política descreve como a SinapseMED coleta, usa e protege seus dados pessoais,
            em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
        </div>

        <Section title="1. Quem somos">
          <p>
            SinapseMED é uma plataforma de estudo para preparação a concursos de residência médica no Brasil.
            Somos responsáveis pelo tratamento dos seus dados pessoais conforme descrito nesta Política.
            Para contato com o encarregado de dados (DPO): {" "}
            <a href="mailto:privacidade@sinapsemed.com" className="text-primary underline">
              privacidade@sinapsemed.com
            </a>
          </p>
        </Section>

        <Section title="2. Dados que coletamos">
          <p>Coletamos os seguintes dados:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Dados de cadastro:</strong> nome, e-mail e senha (armazenada com hash seguro).</li>
            <li><strong>Dados de uso:</strong> flashcards criados, resultados de simulados, sessões de revisão, histórico de estudo.</li>
            <li><strong>Dados de pagamento:</strong> processados diretamente pelo Stripe. Não armazenamos dados de cartão.</li>
            <li><strong>Imagens de OCR:</strong> prints de simulados enviados para análise por IA. Não armazenamos essas imagens após o processamento.</li>
            <li><strong>Dados técnicos:</strong> endereço IP, tipo de dispositivo/navegador, cookies de sessão.</li>
          </ul>
        </Section>

        <Section title="3. Como usamos seus dados">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Prover e melhorar as funcionalidades do Serviço.</li>
            <li>Processar pagamentos e gerenciar assinaturas.</li>
            <li>Enviar comunicações transacionais (confirmação de conta, recibos, alertas de segurança).</li>
            <li>Analisar padrões de uso agregados para melhorar a plataforma (dados anonimizados).</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
        </Section>

        <Section title="4. Base legal para tratamento (LGPD)">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Execução de contrato:</strong> para prover o Serviço que você contratou.</li>
            <li><strong>Legítimo interesse:</strong> para melhorias de produto e segurança da plataforma.</li>
            <li><strong>Consentimento:</strong> para comunicações de marketing (você pode revogar a qualquer momento).</li>
            <li><strong>Obrigação legal:</strong> quando exigido por lei (ex.: obrigações fiscais).</li>
          </ul>
        </Section>

        <Section title="5. Compartilhamento de dados">
          <p>Seus dados só são compartilhados com:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Supabase:</strong> banco de dados e autenticação (infraestrutura em nuvem segura).</li>
            <li><strong>Stripe:</strong> processamento de pagamentos.</li>
            <li><strong>Groq:</strong> processamento de imagens para OCR (imagens não são armazenadas).</li>
            <li><strong>Resend:</strong> envio de e-mails transacionais.</li>
          </ul>
          <p className="mt-2">Não vendemos nem alugamos seus dados a terceiros.</p>
        </Section>

        <Section title="6. Seus direitos (LGPD)">
          <p>Você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Confirmar a existência e acessar seus dados.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar anonimização, bloqueio ou eliminação dos dados.</li>
            <li>Solicitar a portabilidade dos dados para outro fornecedor de serviço.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
            <li>Obter informações sobre com quem compartilhamos seus dados.</li>
          </ul>
          <p className="mt-2">
            Para exercer esses direitos, envie e-mail para:{" "}
            <a href="mailto:privacidade@sinapsemed.com" className="text-primary underline">
              privacidade@sinapsemed.com
            </a>
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            Usamos cookies essenciais para autenticação e funcionamento do Serviço. Não usamos cookies
            de rastreamento de terceiros para publicidade. Você pode desativar cookies pelo navegador,
            mas isso pode afetar o funcionamento do Serviço.
          </p>
        </Section>

        <Section title="8. Segurança">
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados: criptografia em trânsito (TLS),
            senhas com hash seguro (bcrypt), controles de acesso baseados em função (RLS no Supabase) e
            monitoramento de atividades suspeitas. Em caso de incidente de segurança que afete seus dados,
            você será notificado conforme exigido pela LGPD.
          </p>
        </Section>

        <Section title="9. Retenção de dados">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento da conta, os dados são
            excluídos em até 90 dias, exceto onde obrigados por lei a mantê-los por período maior
            (ex.: registros fiscais por 5 anos).
          </p>
        </Section>

        <Section title="10. Transferência internacional">
          <p>
            Seus dados podem ser processados em servidores fora do Brasil (Supabase e Stripe).
            Garantimos que esses fornecedores adotam proteções equivalentes às exigidas pela LGPD,
            conforme suas políticas de privacidade e acordos contratuais.
          </p>
        </Section>

        <Section title="11. Alterações nesta Política">
          <p>
            Podemos atualizar esta Política periodicamente. Mudanças significativas serão comunicadas
            por e-mail ou notificação na plataforma com antecedência mínima de 15 dias.
          </p>
        </Section>

        <Section title="12. Contato">
          <p>
            Dúvidas sobre privacidade e proteção de dados:{" "}
            <a href="mailto:privacidade@sinapsemed.com" className="text-primary underline">
              privacidade@sinapsemed.com
            </a>
          </p>
        </Section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SinapseMED &middot;{" "}
        <Link href="/termos" className="underline hover:text-foreground">Termos de Uso</Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
