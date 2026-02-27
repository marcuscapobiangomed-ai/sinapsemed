import Link from "next/link";
import {
  Brain,
  BookOpen,
  BarChart2,
  Calendar,
  Target,
  Zap,
  Check,
  ChevronRight,
  ClipboardList,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LandingNav } from "./landing-nav";

// ── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: BookOpen,
    title: "Repetição Espaçada (FSRS)",
    description:
      "Algoritmo de memória de última geração que agenda cada flashcard no momento certo — você estuda menos e retém muito mais.",
  },
  {
    icon: ImagePlus,
    title: "OCR de Simulados",
    description:
      "Tire um print do resultado do seu simulado, cole com Ctrl+V e a IA preenche tudo automaticamente. Nenhuma digitação.",
  },
  {
    icon: Target,
    title: "Análise de Lacunas",
    description:
      "Identifica automaticamente as especialidades onde você perde mais pontos e sugere o que priorizar no estudo.",
  },
  {
    icon: BarChart2,
    title: "Analytics Avançado",
    description:
      "Radar de proficiência, tendência de aprovação e raio-x de complexidade por dificuldade — dados acionáveis, não ruído.",
  },
  {
    icon: Calendar,
    title: "Planner de Estudos",
    description:
      "Gera automaticamente um cronograma semanal baseado no seu desempenho e nas datas das provas que você quer fazer.",
  },
  {
    icon: Zap,
    title: "Previsão de Aprovação",
    description:
      "Com base nos seus simulados, a IA estima sua probabilidade de aprovação e projeta sua evolução até a prova.",
  },
];

const steps = [
  {
    num: "01",
    title: "Crie seus decks",
    description:
      "Adicione flashcards por especialidade ou deixe a IA gerar cards a partir das suas dúvidas durante o estudo.",
  },
  {
    num: "02",
    title: "Revise todo dia",
    description:
      "O algoritmo FSRS decide exatamente quais cards revisar para máxima retenção com o mínimo de tempo.",
  },
  {
    num: "03",
    title: "Registre seus simulados",
    description:
      "Cole o print do resultado e acompanhe sua evolução real — taxas de acerto, lacunas e tendência de aprovação.",
  },
];

const plans = [
  {
    slug: "free",
    name: "Gratuito",
    price: "R$\u00a00",
    period: "",
    description: "Para começar sua jornada",
    highlight: false,
    cta: "Começar grátis",
    ctaHref: "/register",
    features: [
      "30 flashcards por mês",
      "5 dúvidas de IA por dia",
      "1 banca disponível",
      "1 simulado por mês",
      "Dashboard básico",
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    price: "R$\u00a029,90",
    period: "/mês",
    description: "Para estudantes comprometidos",
    highlight: true,
    cta: "Assinar Pro",
    ctaHref: "/register?plan=pro",
    features: [
      "500 flashcards por mês",
      "25 dúvidas de IA por dia",
      "3 bancas disponíveis",
      "2 simulados por mês",
      "Previsão de aprovação",
      "Analytics avançado",
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    price: "R$\u00a059,90",
    period: "/mês",
    description: "Para quem não abre mão",
    highlight: false,
    cta: "Assinar Premium",
    ctaHref: "/register?plan=premium",
    features: [
      "Flashcards ilimitados",
      "Dúvidas de IA ilimitadas",
      "Todas as bancas",
      "Simulados ilimitados",
      "Previsão de aprovação",
      "Analytics avançado",
      "IA prioritária (respostas mais rápidas)",
    ],
  },
];

const faqs = [
  {
    q: "O que é repetição espaçada?",
    a: "É uma técnica de memorização baseada em ciência cognitiva. Em vez de revisar tudo todos os dias, o algoritmo FSRS calcula o intervalo ideal para cada flashcard — você revisa exatamente antes de esquecer, maximizando a retenção com o mínimo de tempo.",
  },
  {
    q: "Para quais concursos o SinapseMED é indicado?",
    a: "Para qualquer residência médica brasileira. Temos suporte específico às bancas ENARE, ENAMED e USP, mas você pode usá-lo para qualquer prova — basta adicionar os flashcards e registrar seus simulados.",
  },
  {
    q: "Como funciona o plano gratuito?",
    a: "Você pode criar até 30 flashcards por mês, fazer 5 perguntas de IA por dia, usar 1 banca e registrar 1 simulado por mês. Não é necessário cartão de crédito e o plano não expira.",
  },
  {
    q: "Posso cancelar minha assinatura quando quiser?",
    a: "Sim. Você pode cancelar a qualquer momento pelo painel de configurações. Você continua com acesso ao plano pago até o fim do período já pago e depois retorna automaticamente ao plano gratuito.",
  },
  {
    q: "O que é a análise de lacunas?",
    a: "É uma funcionalidade que analisa seu histórico de simulados e identifica automaticamente as especialidades onde você acerta menos. Ela cria um ranking de prioridades para guiar seu estudo nas áreas que mais impactam sua nota.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-24 text-center">
        <Badge variant="secondary" className="mb-5 text-xs font-semibold px-3 py-1">
          Repetição Espaçada com IA para Residência Médica
        </Badge>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
          Estude menos.{" "}
          <span className="text-primary">Aprenda mais.</span>{" "}
          Passe na residência.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          SinapseMED usa algoritmos de memória adaptativa e análise inteligente
          para maximizar sua aprovação no ENARE, ENAMED, USP e outros concursos
          de residência do Brasil.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="gap-2 text-base h-12 px-8" asChild>
            <Link href="/register">
              Começar grátis
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base h-12 px-8" asChild>
            <Link href="/login">Já tenho conta</Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Sem cartão de crédito &middot; Gratuito para sempre no plano básico
        </p>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-sm mx-auto sm:max-w-md">
          {[
            { value: "FSRS", label: "Algoritmo de memória" },
            { value: "IA", label: "Análise de simulados" },
            { value: "0", label: "Custo para começar" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como Funciona ─────────────────────────────────────────────────── */}
      <section id="como-funciona" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Como funciona</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Três passos para transformar seu estudo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative">
                <div className="flex items-start gap-4">
                  <span className="text-4xl font-extrabold text-primary/20 leading-none shrink-0">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ───────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Tudo o que você precisa para passar
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Ferramentas construídas especificamente para residência médica brasileira
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ────────────────────────────────────────────────────────── */}
      <section id="precos" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Planos e preços</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Comece grátis. Faça upgrade quando precisar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.slug}
                className={`relative rounded-xl border bg-card p-6 flex flex-col ${
                  plan.highlight
                    ? "border-primary shadow-lg ring-1 ring-primary"
                    : ""
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="text-xs font-semibold px-3">Mais popular</Badge>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlight ? "default" : "outline"}
                  className="w-full"
                  asChild
                >
                  <Link href={plan.ctaHref}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Perguntas frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-lg border bg-card px-5"
              >
                <AccordionTrigger className="text-left font-medium text-sm hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────────────────────── */}
      <section className="bg-primary py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground tracking-tight">
            Pronto para estudar de forma inteligente?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            Junte-se a estudantes que já usam SinapseMED para preparação para residência médica.
            Comece grátis hoje, sem cartão de crédito.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-base h-12 px-8 gap-2"
              asChild
            >
              <Link href="/register">
                Criar conta grátis
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t bg-card py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Brain className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold">SinapseMED</span>
            </Link>

            {/* Links */}
            <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Link href="/termos" className="hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Entrar
              </Link>
              <Link href="/register" className="hover:text-foreground transition-colors">
                Criar conta
              </Link>
            </nav>

            {/* Copyright */}
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SinapseMED
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
