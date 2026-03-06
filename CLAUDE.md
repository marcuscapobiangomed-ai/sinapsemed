# SinapseMED — Claude Code Instructions

## Projeto
SaaS de educação médica para preparação de residência (ENARE, ENAMED, USP).
Monorepo Turborepo + pnpm. Stack: Next.js 15, Supabase, shadcn/ui, Tailwind v4, ts-fsrs.
UI em Português (BR). Dev solo com agentes AI.

---

## Metodologia de Trabalho (OBRIGATÓRIO)

**Antes de escrever qualquer linha de código**, seguir este processo sem exceção:

### Passo 1 — Estruturar o Plano de Ação
1. Ler todos os arquivos relevantes para a tarefa (pages, queries, migrations, types)
2. Identificar o estado atual vs. o estado desejado
3. Mapear dependências técnicas (ex: migration antes de UI, types antes de queries)
4. Identificar riscos e decisões necessárias — **se houver decisão de produto/arquitetura, perguntar antes de codar**
5. Escrever o plano em `task_plan.md` na raiz

### Passo 2 — Dividir em Fases
- Cada fase deve ser **independente e entregável** — build passa ao final de cada fase
- Ordem obrigatória dentro de cada fase: `schema (migration) → types → queries/lib → API routes → UI`
- **Nunca misturar** mudança de schema com mudança de UI na mesma fase
- Fase com risco alto de breaking change: avisar o usuário antes de executar
- Nomear cada fase claramente (ex: "Fase 1: Migration + Types", "Fase 2: API", "Fase 3: UI")

### Passo 3 — Microtasks por Fase
- Cada microtask = **1 arquivo ou 1 mudança atômica** (ex: "criar migration X", "atualizar type Y", "criar componente Z")
- Usar TodoWrite para rastrear progresso em tempo real
- Marcar cada microtask como concluída **imediatamente** após terminar
- Nunca passar para a próxima microtask sem a atual estar passando no TypeScript
- Ao final de cada fase: rodar `npx turbo build --filter=@dindin/web` para validar

### Regras de Ouro
- **Ler antes de escrever** — nunca editar arquivo sem tê-lo lido
- **Build must pass** — cada commit entregável deve compilar sem erros
- **Uma fase por vez** — não iniciar Fase 2 sem Fase 1 completa e buildando
- **Consultar ROADMAP.md** — todas as features devem estar alinhadas com o roadmap do produto
- **Schema é irreversível em produção** — migrations precisam de atenção redobrada

---

## Comandos
- `pnpm dev:web` — dev server
- `npx turbo build --filter=@dindin/web` — build produção
- `npx supabase db push` — push migrations

## Estrutura
```
apps/web/          → Next.js 15 App Router
packages/shared/   → Tipos e utilitários compartilhados
supabase/          → Migrations e Edge Functions
```

---

## Auto-Skills (OBRIGATÓRIO)

Skills instaladas em `.claude/skills/`. O Claude DEVE aplicar automaticamente a skill correta baseado no contexto da tarefa. O usuário NÃO precisa pedir — o Claude detecta e aplica.

### Regras de Auto-Trigger

**ANTES de começar qualquer tarefa com 3+ passos:**
→ Ler `.claude/skills/planning-with-files/SKILL.md` e seguir o método (criar task_plan.md)

**Ao editar/criar arquivos em `apps/web/app/`** (pages, layouts, routing):
→ Ler `.claude/skills/nextjs-best-practices/SKILL.md` e seguir os padrões

**Ao mexer em autenticação, middleware, OAuth, cookies, sessions:**
→ Ler `.claude/skills/nextjs-supabase-auth/SKILL.md` e seguir os padrões

**Ao criar/modificar componentes React (.tsx com JSX):**
→ Ler `.claude/skills/react-patterns/SKILL.md` para padrões de composição e hooks

**Ao escrever tipos TypeScript complexos (generics, branded types, utility types):**
→ Ler `.claude/skills/typescript-expert/SKILL.md` para referência

**Ao estilizar com Tailwind (classes, @theme, responsive, dark mode):**
→ Ler `.claude/skills/tailwind-patterns/SKILL.md` para padrões v4

**Ao escrever/otimizar queries SQL, schemas, RLS policies:**
→ Ler `.claude/skills/postgres-best-practices/SKILL.md` para regras de performance

**Ao criar/modificar migrations em `supabase/migrations/`:**
→ Ler `.claude/skills/database-migration/SKILL.md` para padrões zero-downtime

**Ao implementar pagamentos, assinaturas, webhooks Stripe:**
→ Ler `.claude/skills/stripe-integration/SKILL.md` para fluxos seguros

**Ao configurar turbo.json ou pipeline de build:**
→ Ler `.claude/skills/turborepo-caching/SKILL.md` para caching otimizado

**Ao configurar deploy Vercel, env vars, Edge/Serverless Functions:**
→ Ler `.claude/skills/vercel-deployment/SKILL.md` para boas práticas

**APÓS terminar qualquer bloco de código:**
→ Ler `.claude/skills/lint-and-validate/SKILL.md` e rodar lint/tsc. Nunca commitar sem lint passing.

**Quando encontrar erros, test failures, comportamento inesperado:**
→ Ler `.claude/skills/debugger/SKILL.md` e seguir: Capturar → Identificar → Isolar → Corrigir → Verificar

**Quando o usuário pedir testes ou TDD:**
→ Ler `.claude/skills/test-driven-development/SKILL.md` (Red-Green-Refactor)
→ Para gerar testes de código existente: `.claude/skills/unit-testing-test-generate/SKILL.md`

**Quando o usuário pedir review, audit, ou preparar para deploy:**
→ Ler `.claude/skills/comprehensive-review-full-review/SKILL.md` para review completo
→ Ler `.claude/skills/security-audit/SKILL.md` se envolve auth/pagamentos/dados sensíveis
→ Ler `.claude/skills/production-code-audit/SKILL.md` para audit pré-produção

**Quando o usuário pedir otimização de performance:**
→ Ler `.claude/skills/web-performance-optimization/SKILL.md` para Core Web Vitals e bundle

**Quando o usuário pedir design system ou componentes visuais consistentes:**
→ Ler `.claude/skills/tailwind-design-system/SKILL.md` para tokens e padrões

### Como aplicar

1. Detectar o contexto da tarefa
2. Ler a SKILL.md relevante (pode ser mais de uma)
3. Aplicar os padrões e regras da skill no código gerado
4. NÃO precisa mencionar a skill pro usuário a menos que seja útil explicar

---

## Regras do Projeto

### Next.js 15
- Params dinâmicos são `Promise<{ id: string }>` — sempre usar await
- Preferir Server Components; usar `"use client"` somente quando necessário
- App Router: layouts, loading.tsx, error.tsx para cada rota importante

### Supabase
- Trigger functions em `auth.users` DEVEM ter `SET search_path = public`
- Usar `flowType: "pkce"` no `createBrowserClient`
- Excluir `auth/callback` do middleware matcher
- RLS obrigatório em todas as tabelas com dados de usuário

### TypeScript
- Strict mode sempre ativo
- ts-fsrs: cast via `unknown` para `scheduler.repeat()` → `(result as unknown as Record<number, { card: FSRSCard }>)[rating as number]`
- `Buffer`/`Uint8Array` em Response: usar `new Uint8Array(buffer) as unknown as BodyInit`

### Estilo de Código
- Componentes: PascalCase, arquivos: kebab-case
- Sem código comentado no commit final
- Sem `console.log` em produção (usar logger)
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.)
