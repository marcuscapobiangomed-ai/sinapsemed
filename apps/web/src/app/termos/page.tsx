import { Metadata } from "next";
import Link from "next/link";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Termos de Uso | SinapseMED",
};

export default function TermosPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        <Section title="1. Aceitação dos Termos">
          <p>
            Ao acessar ou usar a plataforma SinapseMED (&ldquo;Serviço&rdquo;), você concorda com estes Termos de Uso.
            Se você não concorda com algum destes termos, não deve usar o Serviço.
            O Serviço é operado por SinapseMED e é destinado a estudantes que se preparam para concursos
            de residência médica no Brasil.
          </p>
        </Section>

        <Section title="2. Descrição do Serviço">
          <p>
            SinapseMED é uma plataforma de estudo que oferece ferramentas de repetição espaçada (flashcards),
            registro e análise de simulados, análise de lacunas por especialidade, planejamento de estudos e
            análise preditiva de desempenho. O Serviço está disponível em planos gratuito e pagos.
          </p>
        </Section>

        <Section title="3. Cadastro e Conta">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Você deve ter pelo menos 18 anos para criar uma conta.</li>
            <li>Você é responsável por manter a confidencialidade da sua senha.</li>
            <li>Você é responsável por todas as atividades realizadas em sua conta.</li>
            <li>Você deve fornecer informações verdadeiras e atualizadas no cadastro.</li>
            <li>Uma conta por pessoa — contas compartilhadas podem ser suspensas.</li>
          </ul>
        </Section>

        <Section title="4. Planos e Pagamentos">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>O plano Gratuito tem limites mensais de uso conforme especificado na página de preços.</li>
            <li>Os planos pagos são cobrados mensalmente e renovados automaticamente.</li>
            <li>Pagamentos são processados com segurança via Stripe.</li>
            <li>Você pode cancelar sua assinatura a qualquer momento pelas configurações da conta.</li>
            <li>Não há reembolso de períodos parciais, exceto quando exigido por lei.</li>
            <li>Preços podem ser alterados com aviso prévio de 30 dias.</li>
          </ul>
        </Section>

        <Section title="5. Uso Aceitável">
          <p>Você concorda em não:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Usar o Serviço para qualquer finalidade ilegal ou não autorizada.</li>
            <li>Tentar acessar sistemas ou dados além do seu escopo de permissão.</li>
            <li>Realizar engenharia reversa, descompilar ou tentar extrair o código-fonte.</li>
            <li>Utilizar bots, scrapers ou automações não autorizadas.</li>
            <li>Revender, sublicenciar ou redistribuir o acesso ao Serviço.</li>
          </ul>
        </Section>

        <Section title="6. Propriedade Intelectual">
          <p>
            Todo o conteúdo da plataforma — incluindo software, design, textos e funcionalidades — é propriedade
            da SinapseMED ou de seus licenciantes. O conteúdo criado pelo usuário (flashcards, anotações) permanece
            de sua propriedade, mas você concede à SinapseMED licença para armazená-lo e exibi-lo no Serviço.
          </p>
        </Section>

        <Section title="7. Limitação de Responsabilidade">
          <p>
            O Serviço é fornecido &ldquo;como está&rdquo;. A SinapseMED não garante aprovação em concursos e não se responsabiliza
            por interrupções, erros ou perda de dados. Em nenhuma hipótese nossa responsabilidade excederá o valor
            pago pelo Serviço nos últimos 3 meses.
          </p>
        </Section>

        <Section title="8. Suspensão e Encerramento">
          <p>
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos,
            sem aviso prévio nos casos de violação grave. Você pode encerrar sua conta a qualquer momento
            pelas configurações ou pelo e-mail de suporte.
          </p>
        </Section>

        <Section title="9. Alterações nos Termos">
          <p>
            Podemos atualizar estes Termos periodicamente. Notificaremos mudanças significativas
            por e-mail ou pelo próprio Serviço. O uso continuado após as alterações constitui aceitação.
          </p>
        </Section>

        <Section title="10. Legislação Aplicável">
          <p>
            Estes Termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida no foro
            da comarca de domicílio do usuário, em conformidade com o Código de Defesa do Consumidor
            e demais legislações aplicáveis.
          </p>
        </Section>

        <Section title="11. Contato">
          <p>
            Para dúvidas sobre estes Termos, entre em contato pelo e-mail:{" "}
            <a href="mailto:contato@sinapsemed.com" className="text-primary underline">
              contato@sinapsemed.com
            </a>
          </p>
        </Section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SinapseMED &middot;{" "}
        <Link href="/privacidade" className="underline hover:text-foreground">Política de Privacidade</Link>
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
