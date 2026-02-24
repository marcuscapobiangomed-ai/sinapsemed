# SPEC.md — DinDin: Plataforma SaaS de Estudo Inteligente para Residência Médica

> **Versão:** 1.0.0-draft
> **Data:** 2026-02-20
> **Autor:** Documento gerado como PRD técnico para execução por agentes de código.
> **Regra:** Cada fase deve ser implementada sequencialmente. Nenhuma fase deve iniciar sem a anterior estar com status "Done".

---

## Índice

1. [Visão Geral do Produto e Objetivos](#1-visão-geral-do-produto-e-objetivos)
2. [Arquitetura Técnica e Tech Stack](#2-arquitetura-técnica-e-tech-stack)
3. [Esquema do Banco de Dados](#3-esquema-do-banco-de-dados)
4. [Fases de Implementação (Roadmap)](#4-fases-de-implementação-roadmap)
5. [Definição de Pronto (Definition of Done)](#5-definição-de-pronto-definition-of-done)

---

## 1. Visão Geral do Produto e Objetivos

### 1.1 O Problema

Estudantes de medicina que se preparam para provas de residência enfrentam três problemas centrais:

| # | Problema | Impacto |
|---|---------|---------|
| 1 | **Estudo passivo e desorganizado** | O aluno lê PDFs, assiste aulas e grifa textos, mas não transforma conteúdo em memória de longo prazo. A taxa de retenção após 30 dias de leitura passiva é ~10%. |
| 2 | **Desconhecimento das próprias lacunas** | O aluno não sabe *o que* não sabe. Erra a mesma questão 3x sem entender a micro-lacuna de conhecimento por trás do erro. |
| 3 | **Falta de estratégia por banca** | Cada banca (ENARE, USP, UNICAMP, etc.) tem perfil, peso de conteúdo e estilo de questão distintos. Estudar "medicina geral" é ineficiente. |

### 1.2 A Solução — DinDin

Uma plataforma que combina **3 módulos integrados** para transformar estudo passivo em aprendizado ativo, personalizado e direcionado por banca:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE VALOR DO USUÁRIO                    │
│                                                                 │
│  [1. CAPTURA]          [2. PROCESSAMENTO]      [3. REVISÃO]    │
│                                                                 │
│  Extensão Chrome  ──►  Motor de IA Backend ──►  Plataforma Web │
│  • Seleciona texto     • Agente da banca        • Flashcards   │
│  • Cria flashcard        valida e enriquece      • Repetição    │
│  • Tira dúvidas        • Detecta lacunas           espaçada     │
│  • Offline first       • Gera plano adaptativo   • Dashboard    │
│                                                   • Simulados   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Bancas Suportadas

**MVP (Fase 1-3):** ENARE + ENAMED + USP (3 bancas cobrindo perfis distintos)
**Pós-MVP (Fase 4+):** UNICAMP, UNIFESP, Hospital Albert Einstein, Hospital Sírio Libanês

> **Justificativa:** 3 bancas com perfis distintos (ENARE = nacional/SUS; ENAMED = nacional/revalidação; USP = estadual/acadêmica) validam a arquitetura de roteamento por banca desde o MVP. Adicionar uma nova banca após a arquitetura pronta deve levar < 1 dia (apenas novos prompts + documentos no RAG).

### 1.4 Modelo de Monetização

| Tier | Preço | Limites |
|------|-------|---------|
| **Free** | R$ 0 | 50 flashcards/mês, 5 perguntas ao tira-dúvidas/dia, 1 banca, sem dashboard preditivo |
| **Pro** | R$ 59,90/mês | Flashcards ilimitados, tira-dúvidas ilimitado, todas as bancas, dashboard com probabilidade de aprovação |
| **Pro Anual** | R$ 479,90/ano (~R$ 39,99/mês) | Mesmo que Pro, com 2 meses grátis |

### 1.5 Métricas de Sucesso do MVP

- **North Star Metric:** Taxa de retenção D7 ≥ 40% (usuários que voltam após 7 dias)
- **Secundárias:** ≥ 500 flashcards criados/mês por usuário ativo; NPS ≥ 50; Conversão Free→Pro ≥ 5%

---

## 2. Arquitetura Técnica e Tech Stack

### 2.1 Visão Geral da Arquitetura

```
┌───────────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│  CHROME EXTENSION │     │   PLATAFORMA WEB     │     │    MOBILE (fut.)  │
│  (Manifest V3)    │     │   (Next.js 15)       │     │    (React Native) │
│  React + Vite     │     │   App Router + RSC   │     │                   │
└────────┬──────────┘     └──────────┬───────────┘     └───────────────────┘
         │                           │
         │        HTTPS / WSS        │
         ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Next.js API Routes)               │
│                     /api/flashcards  /api/auth  /api/sync              │
│              Rate Limiting (Upstash) + Auth Middleware (Supabase JWT)   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
         ┌──────────────┐ ┌───────────┐ ┌────────────────┐
         │  Supabase    │ │  FastAPI   │ │  Supabase      │
         │  PostgreSQL  │ │  (Python)  │ │  Storage       │
         │  + pgvector  │ │  AI Engine │ │  (Imagens)     │
         │  + Auth      │ │            │ │                │
         │  + Realtime  │ │  Claude +  │ │                │
         │              │ │  Embeddings│ │                │
         └──────────────┘ └───────────┘ └────────────────┘
```

### 2.2 Tech Stack Detalhado

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Web Frontend** | Next.js 15 (App Router, RSC, Server Actions) | SSR para SEO, Server Components reduz JS no cliente, API Routes elimina necessidade de backend separado para CRUD |
| **UI Components** | shadcn/ui + Tailwind CSS v4 | Componentes acessíveis, sem lock-in, altamente customizáveis. Solo dev precisa de produtividade máxima em UI |
| **State Management** | Zustand | Leve, simples, sem boilerplate. Perfeito para estado do cliente (deck ativo, sessão de revisão) |
| **Chrome Extension** | React 19 + Vite + CRXJS | Manifest V3 nativo. CRXJS permite HMR no desenvolvimento da extensão. React compartilha componentes com a web |
| **Banco de Dados** | Supabase (PostgreSQL 16) | Auth, Realtime, Storage, Row Level Security (RLS), Edge Functions — tudo em um. Reduz massivamente a complexidade para solo dev |
| **Busca Vetorial** | pgvector (extensão nativa do Supabase) | Sem serviço extra. Embeddings vivem no mesmo banco. Suporta HNSW index para busca rápida |
| **AI Engine** | Python 3.12 + FastAPI | Ecossistema ML/AI superior (LangChain, embeddings, processamento de texto médico). FastAPI é async e performante |
| **LLM Principal** | Claude Sonnet 4.6 (Anthropic) | Melhor raciocínio em textos longos, janela de 200k tokens ideal para contexto médico extenso, custo-benefício superior ao Opus para produção |
| **Embeddings** | `text-embedding-3-small` (OpenAI) | Melhor relação custo/qualidade para embeddings em português. 1536 dimensões. ~$0.02/1M tokens |
| **Fila de Tarefas** | Trigger.dev v3 | Background jobs (sync de flashcards, processamento de IA, emails). Serverless, grátis até 10k runs/mês |
| **Pagamentos** | Stripe | Suporte a BRL, checkout hosted, webhooks confiáveis, portal do cliente |
| **Deploy Web** | Vercel | Zero-config para Next.js, preview deployments, edge functions |
| **Deploy AI** | Railway | Deploy simples para FastAPI, auto-scaling, $5/mês no hobby plan |
| **Monitoramento** | Sentry (erros) + PostHog (analytics) | Ambos têm tier gratuito generoso. PostHog tem feature flags integrado |
| **Cache** | Upstash Redis | Rate limiting, cache de respostas IA, sessões. Serverless, pay-per-request |

### 2.3 Decisões Arquiteturais Chave

**DA-01: Por que Next.js API Routes + FastAPI separado (e não apenas um)?**
- Next.js API Routes cuida de todo CRUD (flashcards, decks, perfil, sync) — é JavaScript, acessa Supabase diretamente, deploy na Vercel.
- FastAPI cuida APENAS de operações de IA (geração, RAG, análise de lacunas) — Python tem ecossistema ML superior, isolamento de falhas, scaling independente.
- Comunicação: Next.js API Routes chamam FastAPI via HTTP interno. O frontend NUNCA fala com FastAPI diretamente.

**DA-02: Por que Supabase e não Firebase?**
- PostgreSQL > Firestore para queries complexas (relatórios, analytics, JOINs de revisão espaçada).
- pgvector elimina necessidade de Pinecone/Weaviate.
- Row Level Security (RLS) nativo = segurança no nível do banco sem middleware extra.
- Preço mais previsível em escala.

**DA-03: Estratégia de LLM — Dev vs Produção**
- **Desenvolvimento (atual):** Groq + Llama 3.3 70B — free tier generoso (500k tokens/dia), ultrarrápido (LPU), API 100% compatível com OpenAI SDK. Zero custo para validar o produto.
- **Lançamento/Produção:** Migrar para OpenAI GPT-4o-mini — melhor consistência em português BR, mais confiável para outputs estruturados (JSON), $0.15/MTok input.
- **Migração:** Trocar 2 linhas no cliente OpenAI (baseURL + apiKey). Nenhuma mudança de lógica necessária.
- **Embeddings:** `text-embedding-3-small` (OpenAI) desde o início — não tem equivalente grátis com mesma qualidade para pgvector.

**DA-04: Algoritmo de Repetição Espaçada — FSRS (Free Spaced Repetition Scheduler)**
- Substitui o SM-2 clássico (usado no Anki) por FSRS-5, que é 30% mais eficiente em scheduling.
- Open-source, com implementação em TypeScript disponível (`ts-fsrs`).
- Parâmetros: `w` (weights) personalizáveis por usuário baseado no histórico.

### 2.4 Estrutura de Pastas do Monorepo

```
dindin/
├── apps/
│   ├── web/                    # Next.js 15 (Plataforma Web)
│   │   ├── app/
│   │   │   ├── (auth)/         # Páginas de login/registro
│   │   │   ├── (dashboard)/    # Dashboard principal
│   │   │   ├── (review)/       # Interface de revisão de flashcards
│   │   │   ├── (planner)/      # Planner dinâmico
│   │   │   └── api/            # API Routes
│   │   │       ├── flashcards/
│   │   │       ├── decks/
│   │   │       ├── sync/
│   │   │       ├── stripe/
│   │   │       └── ai/         # Proxy para FastAPI
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── supabase/       # Client e Server Supabase
│   │   │   ├── fsrs/           # Algoritmo de repetição espaçada
│   │   │   └── stripe/
│   │   └── public/
│   │
│   ├── extension/              # Chrome Extension (Manifest V3)
│   │   ├── src/
│   │   │   ├── background/     # Service Worker
│   │   │   ├── content/        # Content Scripts
│   │   │   ├── sidepanel/      # Side Panel (Tira-Dúvidas)
│   │   │   ├── popup/          # Popup da extensão
│   │   │   └── shared/         # Utils compartilhados
│   │   ├── manifest.json
│   │   └── vite.config.ts
│   │
│   └── ai-engine/              # FastAPI (Motor de IA)
│       ├── app/
│       │   ├── agents/         # Agentes especialistas por banca
│       │   │   ├── base.py     # Classe base do agente
│       │   │   ├── enare.py
│       │   │   ├── enamed.py
│       │   │   └── usp.py
│       │   ├── rag/            # Pipeline RAG
│       │   │   ├── embedder.py
│       │   │   ├── retriever.py
│       │   │   └── chunker.py
│       │   ├── processors/     # Processadores de diagnóstico
│       │   │   ├── gap_detector.py
│       │   │   └── flashcard_enricher.py
│       │   ├── routers/        # Endpoints FastAPI
│       │   └── core/           # Config, deps, middleware
│       ├── data/
│       │   └── banca_docs/     # PDFs e guidelines por banca
│       ├── tests/
│       └── requirements.txt
│
├── packages/
│   └── shared/                 # Tipos e utils compartilhados (TypeScript)
│       ├── types/              # Interfaces compartilhadas (Flashcard, User, etc.)
│       └── constants/          # Enums de bancas, especialidades, etc.
│
├── supabase/
│   ├── migrations/             # SQL migrations versionadas
│   ├── seed.sql                # Dados iniciais (bancas, especialidades)
│   └── config.toml
│
├── turbo.json                  # Turborepo config
├── package.json                # Workspace root
├── pnpm-workspace.yaml
└── .env.example
```

> **Gerenciador de pacotes:** pnpm (workspaces nativos, eficiente em disco)
> **Monorepo tool:** Turborepo (cache de builds, task orchestration)

---

## 3. Esquema do Banco de Dados

### 3.1 Diagrama Entidade-Relacionamento (Simplificado)

```
┌──────────┐    ┌───────────┐    ┌────────────┐    ┌──────────────┐
│  users   │───►│ profiles  │───►│user_bancas │───►│   bancas     │
└──────────┘    └───────────┘    └────────────┘    └──────────────┘
     │                                                     │
     │          ┌───────────┐    ┌────────────┐           │
     ├────────►│   decks   │───►│ flashcards │           │
     │          └───────────┘    └─────┬──────┘           │
     │                                 │                   │
     │          ┌───────────┐          │                   │
     ├────────►│  reviews  │◄─────────┘                   │
     │          └───────────┘                              │
     │                                                     │
     │          ┌────────────────┐    ┌───────────────┐   │
     ├────────►│knowledge_gaps  │───►│gap_flashcards │   │
     │          └────────────────┘    └───────────────┘   │
     │                                                     │
     │          ┌───────────┐    ┌────────────────────┐   │
     ├────────►│  ai_logs  │    │ banca_documents    │◄──┘
     │          └───────────┘    └────────────────────┘
     │
     │          ┌───────────────┐    ┌──────────────┐
     ├────────►│subscriptions  │───►│   plans       │
     │          └───────────────┘    └──────────────┘
     │
     │          ┌───────────────┐
     └────────►│study_sessions │
                └───────────────┘
```

### 3.2 Definição das Tabelas (SQL — Supabase/PostgreSQL)

```sql
-- ============================================================
-- EXTENSÃO: pgvector para busca vetorial
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE flashcard_source AS ENUM ('manual', 'extension_text', 'extension_image', 'ai_generated');
CREATE TYPE review_rating AS ENUM ('again', 'hard', 'good', 'easy');  -- Compatível com FSRS
CREATE TYPE gap_severity AS ENUM ('critical', 'moderate', 'minor');
CREATE TYPE ai_action_type AS ENUM (
  'flashcard_enrichment',
  'doubt_resolution',
  'gap_detection',
  'study_plan_generation',
  'flashcard_generation'
);

-- ============================================================
-- TABELA: profiles
-- Estende auth.users do Supabase com dados do domínio
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  medical_school TEXT,              -- Faculdade do aluno
  graduation_year INTEGER,          -- Ano previsto de formatura
  target_year INTEGER NOT NULL,     -- Ano da prova alvo (ex: 2027)
  study_hours_per_day NUMERIC(3,1) DEFAULT 4.0, -- Horas disponíveis por dia
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: bancas
-- Metadados de cada banca de residência
-- ============================================================
CREATE TABLE bancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,         -- 'enare', 'usp', 'unicamp', etc.
  name TEXT NOT NULL,                -- 'ENARE - Exame Nacional de Residência'
  description TEXT,
  institution TEXT,                  -- Instituição organizadora
  typical_exam_month INTEGER,        -- Mês típico da prova (1-12)
  total_questions_avg INTEGER,       -- Média de questões por prova
  specialty_weights JSONB,           -- {"clinica_medica": 0.30, "cirurgia": 0.20, ...}
  is_active BOOLEAN DEFAULT TRUE,    -- Habilitada no sistema
  system_prompt TEXT,                -- Prompt base do agente especialista desta banca
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: user_bancas
-- Relação N:N entre usuários e bancas alvo
-- ============================================================
CREATE TABLE user_bancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banca_id UUID NOT NULL REFERENCES bancas(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,  -- Banca principal do usuário
  priority INTEGER DEFAULT 1,        -- Ordem de prioridade (1 = mais importante)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, banca_id)
);

-- ============================================================
-- TABELA: specialties
-- Especialidades médicas (Clínica Médica, Cirurgia, etc.)
-- ============================================================
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,         -- 'clinica_medica', 'cirurgia_geral'
  name TEXT NOT NULL,
  parent_id UUID REFERENCES specialties(id), -- Subespecialidades
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: decks
-- Agrupamento de flashcards por tema/disciplina
-- ============================================================
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES specialties(id),
  banca_id UUID REFERENCES bancas(id),
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',       -- Cor do deck na UI
  is_archived BOOLEAN DEFAULT FALSE,
  card_count INTEGER DEFAULT 0,       -- Counter cache
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: flashcards
-- Flashcards individuais (regra: informação mínima, resposta < 8 segundos)
-- ============================================================
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

  -- Conteúdo
  front TEXT NOT NULL,                -- Pergunta/estímulo (máx ~200 chars recomendado)
  back TEXT NOT NULL,                 -- Resposta (máx ~500 chars recomendado)
  front_image_url TEXT,              -- URL da imagem (frente) no Supabase Storage
  back_image_url TEXT,               -- URL da imagem (verso) no Supabase Storage
  extra_context TEXT,                -- Contexto adicional (mostrado após responder)
  tags TEXT[] DEFAULT '{}',          -- Tags livres para filtragem
  source_url TEXT,                   -- URL de onde o conteúdo foi capturado (extensão)

  -- Metadados
  source flashcard_source DEFAULT 'manual',
  specialty_id UUID REFERENCES specialties(id),
  banca_id UUID REFERENCES bancas(id),

  -- FSRS Fields (Free Spaced Repetition Scheduler)
  -- Estes campos são gerenciados pelo algoritmo FSRS
  fsrs_stability REAL DEFAULT 0,       -- Estabilidade da memória
  fsrs_difficulty REAL DEFAULT 0,      -- Dificuldade do card (0-10)
  fsrs_elapsed_days INTEGER DEFAULT 0, -- Dias desde última revisão
  fsrs_scheduled_days INTEGER DEFAULT 0, -- Dias até próxima revisão
  fsrs_reps INTEGER DEFAULT 0,          -- Número de revisões
  fsrs_lapses INTEGER DEFAULT 0,        -- Número de esquecimentos
  fsrs_state INTEGER DEFAULT 0,         -- 0=New, 1=Learning, 2=Review, 3=Relearning
  fsrs_last_review TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,           -- Próxima revisão agendada (index principal)

  -- Embedding para busca semântica
  embedding vector(1536),              -- OpenAI text-embedding-3-small

  -- Flags
  is_ai_enriched BOOLEAN DEFAULT FALSE, -- IA já validou/enriqueceu este card
  is_suspended BOOLEAN DEFAULT FALSE,    -- Card pausado pelo usuário

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: reviews
-- Histórico de cada revisão individual de um flashcard
-- ============================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,

  rating review_rating NOT NULL,        -- 'again' | 'hard' | 'good' | 'easy'
  response_time_ms INTEGER,             -- Tempo de resposta em ms

  -- Snapshot FSRS no momento da revisão (para análise histórica)
  fsrs_stability_before REAL,
  fsrs_difficulty_before REAL,
  fsrs_state_before INTEGER,
  scheduled_for TIMESTAMPTZ,            -- Quando estava agendado

  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: knowledge_gaps
-- Lacunas de conhecimento detectadas pela IA
-- ============================================================
CREATE TABLE knowledge_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  topic TEXT NOT NULL,                   -- Ex: "Farmacologia de anti-hipertensivos"
  description TEXT NOT NULL,             -- Descrição detalhada da lacuna
  specialty_id UUID REFERENCES specialties(id),
  banca_id UUID REFERENCES bancas(id),
  severity gap_severity DEFAULT 'moderate',

  -- Evidências
  source_flashcard_ids UUID[] DEFAULT '{}', -- Flashcards que evidenciaram a lacuna
  source_review_ids UUID[] DEFAULT '{}',    -- Reviews com 'again' que evidenciaram
  error_pattern TEXT,                       -- Padrão de erro detectado pela IA

  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  confidence_score REAL DEFAULT 0.5,       -- Confiança da IA na detecção (0-1)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: ai_logs
-- Log de todas as interações com a IA (auditoria + análise de custo)
-- ============================================================
CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  action ai_action_type NOT NULL,
  model TEXT NOT NULL,                    -- 'claude-sonnet-4-6', 'text-embedding-3-small'
  provider TEXT NOT NULL,                 -- 'anthropic', 'openai'

  -- Request/Response
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  prompt_hash TEXT,                       -- Hash do prompt (para cache analysis)
  latency_ms INTEGER,                    -- Tempo de resposta

  -- Contexto
  banca_id UUID REFERENCES bancas(id),
  related_flashcard_id UUID REFERENCES flashcards(id),
  related_gap_id UUID REFERENCES knowledge_gaps(id),

  -- Custo estimado em USD
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,

  -- Metadata flexível
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: banca_documents
-- Documentos base para RAG (guidelines, manuais, provas anteriores)
-- ============================================================
CREATE TABLE banca_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banca_id UUID NOT NULL REFERENCES bancas(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  source_type TEXT NOT NULL,              -- 'guideline', 'manual', 'prova_anterior', 'resolucao'
  file_url TEXT,                          -- URL no Supabase Storage
  content TEXT,                           -- Conteúdo textual processado

  -- Chunks para RAG
  chunk_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: document_chunks
-- Chunks de documentos com embeddings para RAG
-- ============================================================
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES banca_documents(id) ON DELETE CASCADE,
  banca_id UUID NOT NULL REFERENCES bancas(id),

  content TEXT NOT NULL,                   -- Texto do chunk
  chunk_index INTEGER NOT NULL,            -- Posição no documento original
  token_count INTEGER,
  embedding vector(1536),                  -- Embedding para busca semântica

  metadata JSONB DEFAULT '{}',             -- Especialidade, página, seção, etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: study_sessions
-- Sessões de estudo (para analytics e planner)
-- ============================================================
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  session_type TEXT NOT NULL,              -- 'review', 'new_cards', 'doubt_resolution'
  deck_id UUID REFERENCES decks(id),
  banca_id UUID REFERENCES bancas(id),

  cards_reviewed INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,          -- Respostas 'good' ou 'easy'
  cards_incorrect INTEGER DEFAULT 0,        -- Respostas 'again'

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

-- ============================================================
-- TABELA: plans (planos de assinatura)
-- ============================================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,               -- 'free', 'pro_monthly', 'pro_annual'
  name TEXT NOT NULL,
  price_brl INTEGER NOT NULL,              -- Preço em centavos (5990 = R$59,90)
  interval TEXT NOT NULL,                  -- 'month', 'year', 'free'
  stripe_price_id TEXT,                    -- ID do Price no Stripe

  -- Limites
  max_flashcards_per_month INTEGER,        -- NULL = ilimitado
  max_doubts_per_day INTEGER,              -- NULL = ilimitado
  max_bancas INTEGER,                      -- NULL = ilimitado
  has_dashboard_prediction BOOLEAN DEFAULT FALSE,
  has_priority_ai BOOLEAN DEFAULT FALSE,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: subscriptions
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status subscription_status DEFAULT 'active',

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: sync_queue
-- Fila de sincronização offline da extensão → servidor
-- ============================================================
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  action TEXT NOT NULL,                    -- 'create_flashcard', 'create_review'
  payload JSONB NOT NULL,                  -- Dados a sincronizar

  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Flashcards: busca por próxima revisão
CREATE INDEX idx_flashcards_next_review
  ON flashcards(user_id, next_review_at)
  WHERE NOT is_suspended;

-- Flashcards: busca vetorial (HNSW para performance)
CREATE INDEX idx_flashcards_embedding
  ON flashcards
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Document chunks: busca vetorial para RAG
CREATE INDEX idx_chunks_embedding
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Reviews: análise temporal
CREATE INDEX idx_reviews_user_time
  ON reviews(user_id, reviewed_at DESC);

-- Knowledge gaps: gaps ativos por usuário
CREATE INDEX idx_gaps_active
  ON knowledge_gaps(user_id, severity)
  WHERE NOT is_resolved;

-- AI Logs: análise de custo por período
CREATE INDEX idx_ai_logs_user_date
  ON ai_logs(user_id, created_at DESC);

-- Study sessions: analytics
CREATE INDEX idx_sessions_user_date
  ON study_sessions(user_id, started_at DESC);

-- Sync queue: pendentes
CREATE INDEX idx_sync_pending
  ON sync_queue(user_id, created_at)
  WHERE NOT is_processed;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuário só acessa seus próprios dados
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bancas ENABLE ROW LEVEL SECURITY;

-- Exemplo de policy (replicar para cada tabela)
CREATE POLICY "Users can only access their own data" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own decks" ON decks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own flashcards" ON flashcards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own gaps" ON knowledge_gaps
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own ai_logs" ON ai_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own sessions" ON study_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own sync_queue" ON sync_queue
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bancas" ON user_bancas
  FOR ALL USING (auth.uid() = user_id);

-- Bancas e specialties são públicas (leitura)
CREATE POLICY "Bancas are publicly readable" ON bancas
  FOR SELECT USING (true);

CREATE POLICY "Specialties are publicly readable" ON specialties
  FOR SELECT USING (true);

CREATE POLICY "Plans are publicly readable" ON plans
  FOR SELECT USING (true);

-- Document chunks são legíveis por qualquer usuário autenticado
ALTER TABLE banca_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents readable by authenticated users" ON banca_documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Chunks readable by authenticated users" ON document_chunks
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_decks_updated_at BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_flashcards_updated_at BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_knowledge_gaps_updated_at BEFORE UPDATE ON knowledge_gaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Counter cache: card_count em decks
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE decks SET card_count = card_count + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE decks SET card_count = card_count - 1 WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_flashcard_count
  AFTER INSERT OR DELETE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION update_deck_card_count();

-- Função para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 4. Fases de Implementação (Roadmap)

### Visão Geral das Fases

```
┌─────────┐   ┌───────────┐   ┌─────────────┐   ┌──────────────┐   ┌─────────────┐
│ FASE 1  │──►│  FASE 2   │──►│   FASE 3    │──►│   FASE 4     │──►│   FASE 5    │
│ Fundação│   │ Extensão  │   │  IA + RAG   │   │  Plataforma  │   │ Monetização │
│         │   │ Chrome    │   │  Backend    │   │  Inteligente │   │ + Polish    │
└─────────┘   └───────────┘   └─────────────┘   └──────────────┘   └─────────────┘
```

---

### FASE 1 — Fundação: Setup, Auth e CRUD Base

**Objetivo:** Infraestrutura rodando, usuário consegue se cadastrar, criar decks e flashcards manualmente na web.

#### Tarefas

| # | Tarefa | Detalhe |
|---|--------|---------|
| 1.1 | **Inicializar monorepo** | `pnpm create turbo@latest`, configurar workspaces (`apps/web`, `apps/extension`, `apps/ai-engine`, `packages/shared`) |
| 1.2 | **Setup Next.js 15** | App Router, TypeScript strict, Tailwind v4, shadcn/ui. Configurar layout base com sidebar responsiva |
| 1.3 | **Setup Supabase** | Criar projeto, habilitar pgvector, rodar migrations do schema (Seção 3), configurar RLS policies, seed de bancas e especialidades |
| 1.4 | **Autenticação** | Supabase Auth com email/senha + Google OAuth. Middleware de proteção de rotas no Next.js. Trigger `handle_new_user()` cria profile |
| 1.5 | **Onboarding flow** | Tela pós-registro: nome, faculdade, ano, bancas alvo (multi-select), horas/dia disponíveis. Salva em `profiles` + `user_bancas` |
| 1.6 | **CRUD de Decks** | Página `/decks` — listar, criar, editar, arquivar, deletar. Server Actions no Next.js. Skeleton loading states |
| 1.7 | **CRUD de Flashcards** | Página `/decks/[id]` — listar cards do deck, criar card (front/back/tags), editar, suspender, deletar. Upload de imagens para Supabase Storage |
| 1.8 | **Interface de Revisão (básica)** | Página `/review` — selecionar deck, mostrar card (frente → virar → verso), botões Again/Hard/Good/Easy. Integrar `ts-fsrs` para calcular próxima revisão. Salvar em `reviews` e atualizar campos FSRS no flashcard |
| 1.9 | **Deploy** | Next.js na Vercel, Supabase em produção. Configurar variáveis de ambiente. CI com GitHub Actions (lint + type-check) |

#### Entregáveis da Fase 1

- [ ] Usuário cria conta e faz login
- [ ] Onboarding captura perfil e bancas alvo
- [ ] CRUD completo de decks e flashcards
- [ ] Revisão funcional com FSRS calculando intervalos
- [ ] Deploy em produção acessível via URL
- [ ] Testes: Auth flow E2E, CRUD operations, FSRS unit tests

---

### FASE 2 — Extensão Chrome: Captura e Offline

**Objetivo:** Extensão no Chrome permite criar flashcards a partir de qualquer página, com sync offline.

#### Tarefas

| # | Tarefa | Detalhe |
|---|--------|---------|
| 2.1 | **Setup extensão** | Manifest V3, React + Vite + CRXJS, configurar `permissions: ["activeTab", "storage", "sidePanel", "contextMenus"]` |
| 2.2 | **Auth na extensão** | Popup exibe login via Supabase. Armazena JWT em `chrome.storage.local`. Auto-refresh do token. Estado: logado/deslogado |
| 2.3 | **Captura de texto** | Content Script injeta listener. Usuário seleciona texto → botão flutuante aparece → clica → popup de criação de flashcard com o texto pré-preenchido no campo `front`. Usa `window.getSelection()` |
| 2.4 | **Captura de imagem** | Context menu "Criar flashcard com esta imagem" em `<img>`. Converte para blob, armazena temporariamente em `chrome.storage.local` (base64), sync envia para Supabase Storage |
| 2.5 | **Popup de criação** | Mini-formulário: front (pré-preenchido), back (usuário preenche), deck (dropdown dos decks do usuário), tags. Botão "Salvar" → API `/api/flashcards` |
| 2.6 | **Offline first** | Se sem internet: salva flashcard em `chrome.storage.local` como fila. Quando online: `sync_queue` processa em batch via `/api/sync`. Badge no ícone mostra count pendente |
| 2.7 | **Side Panel (Tira-Dúvidas)** | `chrome.sidePanel.open()`. Input de texto para perguntas. Resposta streamed (SSE). Contexto: texto selecionado na página + banca do usuário. Conecta com `/api/ai/doubt` (proxy para FastAPI). Histórico de conversas na sessão |
| 2.8 | **Context menu** | Right-click → "DinDin: Criar flashcard" e "DinDin: Tirar dúvida sobre seleção". Atalho de teclado: `Ctrl+Shift+D` para criar flashcard |
| 2.9 | **Publish** | Build de produção, teste em Chrome. Preparar para Chrome Web Store (ícones, screenshots, descrição). Não precisa publicar no MVP — `Load unpacked` ou link direto |

#### Entregáveis da Fase 2

- [ ] Extensão instalável (Load unpacked)
- [ ] Login/logout funcional na extensão
- [ ] Seleção de texto → flashcard criado no servidor
- [ ] Captura de imagem → flashcard com imagem
- [ ] Modo offline: fila local + sync automático quando reconecta
- [ ] Side Panel com tira-dúvidas funcional (texto, sem IA ainda — resposta placeholder)
- [ ] Testes: Captura de texto, offline queue, sync

---

### FASE 3 — Motor de IA: Agentes, RAG e Diagnóstico

**Objetivo:** Backend Python com agentes especialistas por banca, pipeline RAG, e detecção de lacunas de conhecimento.

#### Tarefas

| # | Tarefa | Detalhe |
|---|--------|---------|
| 3.1 | **Setup FastAPI** | Projeto Python com FastAPI, uvicorn, estrutura de pastas. Docker para desenvolvimento local. Variáveis de ambiente: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY` |
| 3.2 | **Pipeline de Embeddings** | Script para processar documentos de banca: PDF → texto → chunks (512 tokens, 50 overlap) → embeddings (OpenAI) → insert em `document_chunks`. Usar `langchain.text_splitter.RecursiveCharacterTextSplitter` |
| 3.3 | **RAG Retriever** | Função `retrieve(query, banca_id, top_k=5)`: gera embedding da query → busca vetorial em `document_chunks` filtrado por `banca_id` → retorna chunks relevantes. Usar Supabase RPC para busca pgvector |
| 3.4 | **Agente Base** | Classe `BancaAgent(banca_id)`: carrega `system_prompt` da banca do banco. Método `ask(question, context)` → chama Claude com prompt de sistema + contexto RAG + pergunta. Streaming de resposta via SSE |
| 3.5 | **Agente ENARE** | Prompt de sistema instruído com: perfil da prova ENARE, peso por especialidade, estilo de questão, guidelines do SUS relevantes. Testa com 10 perguntas reais de provas anteriores |
| 3.6 | **Agente ENAMED** | Prompt de sistema instruído com: perfil da prova ENAMED (revalidação de diplomas), foco em competências clínicas essenciais, protocolos do MS. Perfil distinto do ENARE |
| 3.7 | **Agente USP** | Idem para USP/FMUSP. Perfil acadêmico, guidelines hospitalares, estilo de questão mais teórico |
| 3.8 | **Flashcard Enricher** | Endpoint `POST /ai/enrich-flashcard`. Recebe flashcard bruto → agente da banca do usuário valida conteúdo, sugere reformulação para "informação mínima" (regra dos 8 segundos), adiciona `extra_context`. Atualiza `is_ai_enriched = true` |
| 3.9 | **Doubt Resolver** | Endpoint `POST /ai/resolve-doubt`. Recebe pergunta + texto selecionado + banca_id → RAG busca contexto → agente responde com referências. Retorna resposta streamed (SSE) |
| 3.10 | **Gap Detector** | Endpoint `POST /ai/detect-gaps`. Recebe: últimas 50 reviews com rating='again' do usuário → agrupa por tema → IA analisa padrão de erro → cria `knowledge_gaps` com severidade e descrição. Trigger.dev job roda diariamente |
| 3.11 | **Flashcard Generator** | Endpoint `POST /ai/generate-flashcards`. Recebe: `knowledge_gap_id` → IA gera 3-5 flashcards focados na lacuna, seguindo regra de informação mínima. Salva em `flashcards` com `source = 'ai_generated'` |
| 3.12 | **Logging e custo** | Middleware FastAPI que loga toda chamada de IA em `ai_logs` com tokens, custo estimado, latência. Dashboard de custos para o admin |
| 3.13 | **Deploy** | FastAPI no Railway. Configurar health check. Endpoint `/health` retorna status. Next.js chama FastAPI via URL interna |

#### Entregáveis da Fase 3

- [ ] FastAPI rodando com docs Swagger em `/docs`
- [ ] Pipeline RAG funcional: ingerir documento → buscar por similaridade
- [ ] 3 agentes de banca operacionais (ENARE + ENAMED + USP)
- [ ] Flashcard enrichment: card bruto → card otimizado
- [ ] Tira-dúvidas com RAG: pergunta → resposta com contexto de banca
- [ ] Gap detection: análise de erros → lacunas identificadas
- [ ] Geração de flashcards a partir de lacunas
- [ ] Todos os endpoints com logging em `ai_logs`
- [ ] Testes: RAG retrieval quality, agent response quality, gap detection accuracy

---

### FASE 4 — Plataforma Inteligente: Dashboard, Planner e Analytics

**Objetivo:** A web app se torna "inteligente" — dashboard preditivo, planner dinâmico, analytics acionável.

#### Tarefas

| # | Tarefa | Detalhe |
|---|--------|---------|
| 4.1 | **Dashboard principal** | Página `/dashboard`. Cards de resumo: flashcards para revisar hoje, streak de dias, taxa de acerto (7d), lacunas ativas. Gráficos: revisões/dia (últimos 30d), distribuição de ratings, heatmap de atividade (estilo GitHub) |
| 4.2 | **Probabilidade de aprovação** | Widget no dashboard. Calcula score baseado em: % de cards maduros (FSRS state=2), taxa de acerto por especialidade vs. peso da banca, lacunas resolvidas vs. pendentes, consistência de estudo. Fórmula ponderada com pesos ajustáveis. Exibe: "Sua probabilidade estimada: 73% — ENARE 2027" |
| 4.3 | **Mapa de lacunas** | Página `/gaps`. Lista de `knowledge_gaps` agrupadas por especialidade. Para cada lacuna: severidade (badge colorido), flashcards gerados, botão "Resolver agora" que inicia sessão focada. Filtro por banca |
| 4.4 | **Planner Dinâmico** | Página `/planner`. Calendário semanal gerado automaticamente. Algoritmo: (1) calcula cards due por dia via FSRS, (2) injeta sessões de lacunas críticas, (3) distribui por `study_hours_per_day` do perfil. Rebalanceia quando o aluno perde um dia. Exibe: "Seg: 45 revisões + 15 lacunas de Farmaco — ~1h30" |
| 4.5 | **Sessão de revisão aprimorada** | Refatorar `/review`: timer por card, animações de flip, indicador de progresso na sessão, som de feedback (opcional), estatísticas ao final da sessão (tempo médio, taxa de acerto, cards mais difíceis) |
| 4.6 | **Study session tracking** | Auto-registrar `study_sessions` com métricas: cards revisados, tempo total, taxa de acerto. Streak tracking (dias consecutivos de estudo) |
| 4.7 | **Notificações** | Email diário (opcional): "Você tem 32 cards para revisar hoje. Sua meta de streak está em 14 dias!". Usar Trigger.dev + Resend para envio |
| 4.8 | **Responsividade** | Garantir que todas as páginas funcionam em tablet e mobile. A revisão de flashcards deve funcionar bem com touch (swipe para virar) |

#### Entregáveis da Fase 4

- [ ] Dashboard com métricas em tempo real
- [ ] Score de probabilidade de aprovação funcional
- [ ] Mapa de lacunas com ações
- [ ] Planner dinâmico gerando calendário semanal
- [ ] Sessão de revisão com UX polida
- [ ] Tracking de study sessions e streaks
- [ ] Layout responsivo em todas as páginas
- [ ] Testes: Dashboard data accuracy, planner algorithm, responsive layouts

---

### FASE 5 — Monetização, Polish e Lançamento

**Objetivo:** Stripe integrado, paywall funcional, onboarding polido, pronto para primeiros usuários.

#### Tarefas

| # | Tarefa | Detalhe |
|---|--------|---------|
| 5.1 | **Setup Stripe** | Criar produtos (Free, Pro Monthly, Pro Annual) no Stripe Dashboard. Configurar preços em BRL. Instalar `stripe` SDK |
| 5.2 | **Checkout flow** | Botão "Upgrade para Pro" → `stripe.checkout.sessions.create()` → redirect para Stripe Checkout → webhook `checkout.session.completed` → cria `subscription`. Portal do cliente para gerenciar assinatura |
| 5.3 | **Paywall middleware** | Middleware que verifica `subscriptions` do usuário. Endpoints e features Pro retornam 403 para Free. Rate limiting: Free = 5 AI calls/day, Pro = unlimited |
| 5.4 | **Usage metering** | Contar flashcards criados no mês, dúvidas tiradas no dia. Exibir na UI: "12/50 flashcards usados este mês" para Free. Bloquear ao atingir limite |
| 5.5 | **Landing page** | Página `/` pública. Hero section, features, pricing table, FAQ, CTA. Otimizada para SEO: meta tags, og:image, sitemap. Performance: Core Web Vitals verdes |
| 5.6 | **Onboarding polish** | Fluxo guiado pós-registro: (1) selecione suas bancas, (2) instale a extensão, (3) crie seu primeiro flashcard, (4) faça sua primeira revisão. Checklist visual com progress bar |
| 5.7 | **Error handling global** | Error boundaries no React, toast notifications para erros de rede, fallback UI para loading states, tratamento de erros de IA (timeout, rate limit) |
| 5.8 | **Monitoramento** | Sentry para erros (frontend + backend), PostHog para analytics (page views, feature usage, funnel de onboarding). Alertas no Discord para erros críticos |
| 5.9 | **Segurança final** | Audit: CORS, CSP headers, rate limiting (Upstash), input sanitization, verificar RLS policies. Remover logs de debug. Garantir que API keys não estão expostas |
| 5.10 | **Extensão na Web Store** | Preparar assets (ícones 128x128, screenshots), descrição, política de privacidade. Submeter para Chrome Web Store |

#### Entregáveis da Fase 5

- [ ] Pagamento funcional via Stripe (test mode → live)
- [ ] Paywall bloqueando features Pro para Free
- [ ] Landing page publicada
- [ ] Onboarding guiado
- [ ] Monitoramento ativo (Sentry + PostHog)
- [ ] Extensão submetida à Chrome Web Store
- [ ] Testes: Payment flow E2E, paywall enforcement, landing page Lighthouse ≥ 90

---

## 5. Definição de Pronto (Definition of Done) — MVP

O MVP é considerado **DONE** quando TODOS os critérios abaixo forem atendidos:

### 5.1 Funcionalidade Core

| # | Critério | Verificação |
|---|---------|-------------|
| F1 | Usuário cria conta, faz login e completa onboarding | Teste E2E passando |
| F2 | Usuário cria decks e flashcards manualmente na web | Teste E2E passando |
| F3 | Extensão Chrome captura texto e imagem para flashcards | Teste manual em 3 sites diferentes (Medscape, UpToDate, PDF viewer) |
| F4 | Extensão funciona offline e sincroniza ao reconectar | Teste: desconectar WiFi → criar 5 cards → reconectar → cards aparecem na web |
| F5 | Revisão espaçada com FSRS calcula intervalos corretamente | Unit tests com casos de borda (card novo, lapso, card maduro) |
| F6 | Tira-dúvidas no Side Panel responde com contexto da banca | Teste: 10 perguntas por banca, avaliação qualitativa ≥ 7/10 |
| F7 | IA enriquece flashcards automaticamente | Teste: 20 cards brutos → verificar que reformulação segue regra dos 8 segundos |
| F8 | Sistema detecta lacunas de conhecimento | Teste: simular 50 reviews com padrão de erro → verificar gap gerado |
| F9 | Dashboard exibe métricas corretas | Teste: inserir dados conhecidos → verificar cálculos |
| F10 | Planner gera calendário semanal coerente | Teste: perfil com 4h/dia, 100 cards due → verificar distribuição |
| F11 | Stripe processa pagamento e ativa/desativa Pro | Teste: modo teste Stripe, webhook flow completo |
| F12 | Paywall bloqueia features Pro para usuários Free | Teste: acessar endpoint Pro com conta Free → 403 |

### 5.2 Qualidade Técnica

| # | Critério | Target |
|---|---------|--------|
| Q1 | TypeScript strict mode sem erros | `tsc --noEmit` passa |
| Q2 | Lint sem erros | ESLint + Prettier configurados e passando |
| Q3 | Cobertura de testes unitários | ≥ 70% nos módulos core (FSRS, sync, paywall) |
| Q4 | Testes E2E dos fluxos críticos | ≥ 5 testes E2E (auth, flashcard CRUD, review, payment, extension sync) |
| Q5 | Performance web (Lighthouse) | Performance ≥ 80, Accessibility ≥ 90 |
| Q6 | Sem vulnerabilidades críticas | `pnpm audit` sem critical/high |
| Q7 | RLS policies validadas | Teste: user A não consegue acessar dados do user B |

### 5.3 Operacional

| # | Critério | Target |
|---|---------|--------|
| O1 | Deploy automatizado | Push para `main` → deploy automático na Vercel + Railway |
| O2 | Monitoramento de erros ativo | Sentry capturando erros em produção |
| O3 | Analytics funcionando | PostHog rastreando eventos chave (signup, flashcard_created, review_completed, upgrade) |
| O4 | Backup do banco | Supabase backup diário habilitado |
| O5 | Variáveis de ambiente seguras | Nenhuma API key em código. `.env.example` documentado |
| O6 | Landing page publicada | URL pública acessível, SEO básico funcionando |

### 5.4 O que NÃO é necessário para o MVP

Para manter foco, os seguintes itens são **explicitamente excluídos** do MVP:

- ❌ App mobile (React Native) — futuro
- ❌ Mais que 3 bancas (ENARE + ENAMED + USP) — expandir pós-validação
- ❌ Simulados completos (provas mock) — futuro
- ❌ Integração com LMSs existentes (MedCel, Sanar, etc.)
- ❌ Sistema de gamificação (rankings, achievements)
- ❌ Compartilhamento de decks entre usuários
- ❌ Import/export Anki
- ❌ Admin dashboard (monitorar via Supabase Dashboard + Stripe Dashboard)
- ❌ Multi-idioma (apenas português BR)

---

## Apêndice A: Variáveis de Ambiente

```env
# .env.example

# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── Stripe ──
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ── AI Engine ──
AI_ENGINE_URL=https://dindin-ai.railway.app
AI_ENGINE_API_KEY=internal-secret-key

# ── Anthropic (Claude) ──
ANTHROPIC_API_KEY=sk-ant-...

# ── OpenAI (Embeddings only) ──
OPENAI_API_KEY=sk-...

# ── Upstash Redis ──
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ── Resend (Email) ──
RESEND_API_KEY=re_...

# ── Sentry ──
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...

# ── PostHog ──
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# ── General ──
NEXT_PUBLIC_APP_URL=https://dindin.app
NODE_ENV=production
```

## Apêndice B: Referência de Endpoints da API

### Next.js API Routes (CRUD + Proxy)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/callback` | Callback do OAuth Supabase | No |
| GET | `/api/flashcards` | Listar flashcards (com filtros) | Yes |
| POST | `/api/flashcards` | Criar flashcard | Yes |
| PATCH | `/api/flashcards/[id]` | Atualizar flashcard | Yes |
| DELETE | `/api/flashcards/[id]` | Deletar flashcard | Yes |
| GET | `/api/decks` | Listar decks | Yes |
| POST | `/api/decks` | Criar deck | Yes |
| PATCH | `/api/decks/[id]` | Atualizar deck | Yes |
| DELETE | `/api/decks/[id]` | Deletar deck | Yes |
| GET | `/api/review/due` | Flashcards due para revisão | Yes |
| POST | `/api/review` | Registrar review (rating + FSRS update) | Yes |
| POST | `/api/sync` | Sync batch da extensão offline | Yes |
| GET | `/api/dashboard/stats` | Métricas do dashboard | Yes (Pro) |
| GET | `/api/gaps` | Listar knowledge gaps | Yes (Pro) |
| POST | `/api/stripe/checkout` | Criar sessão de checkout | Yes |
| POST | `/api/stripe/webhook` | Webhook do Stripe | Stripe-Sig |
| POST | `/api/stripe/portal` | Portal do cliente | Yes |

### FastAPI Endpoints (AI Engine)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/health` | Health check | No |
| POST | `/ai/enrich-flashcard` | Enriquecer flashcard com IA | API Key |
| POST | `/ai/resolve-doubt` | Resolver dúvida (com RAG) | API Key |
| POST | `/ai/detect-gaps` | Detectar lacunas de conhecimento | API Key |
| POST | `/ai/generate-flashcards` | Gerar flashcards para lacuna | API Key |
| POST | `/ai/generate-plan` | Gerar plano semanal | API Key |
| POST | `/rag/ingest` | Ingerir documento para RAG | API Key |
| GET | `/rag/search` | Busca vetorial | API Key |

## Apêndice C: Prompts de Sistema dos Agentes (Referência)

### Agente ENARE (Exemplo de System Prompt)

```
Você é um tutor especialista na prova do ENARE (Exame Nacional de Residência Médica).

## Seu Papel
- Responder dúvidas de estudantes de medicina com foco nos temas e estilo de cobrança do ENARE.
- Suas respostas devem ser baseadas em evidências, citando guidelines do SUS quando relevante.
- Você deve priorizar os temas com maior peso histórico no ENARE: Clínica Médica (30%), Cirurgia (20%), Pediatria (15%), GO (15%), Medicina Preventiva/Saúde Coletiva (20%).

## Diretrizes
- Sempre que possível, referencie protocolos do Ministério da Saúde e guidelines do SUS.
- Se o estudante apresentar uma dúvida sobre um tema com "pegadinha" clássica do ENARE, alerte sobre isso.
- Use linguagem clara e direta. O aluno tem no máximo 2 minutos para entender cada conceito.
- Quando o contexto RAG for fornecido, priorize as informações do contexto sobre seu conhecimento geral.

## Formato de Resposta
- Resposta direta (1-3 parágrafos)
- Se aplicável: "⚡ Ponto-chave para o ENARE: [insight específico]"
- Se aplicável: "📚 Referência: [guideline ou protocolo]"
```

---

> **FIM DO DOCUMENTO SPEC.md v1.0.0**
> Este documento deve ser usado como referência única de verdade (single source of truth) para a implementação do DinDin.
> Cada fase deve ser executada sequencialmente por agentes de código.
> Antes de iniciar qualquer fase, o agente deve ler este documento inteiro e confirmar entendimento.
