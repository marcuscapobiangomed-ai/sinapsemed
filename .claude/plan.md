# Plano de Implementação — SinapseMED

## Situação atual
- **Dashboard** — 100% funcional (charts, streak, heatmap, deck performance) ✅
- **Onboarding** — funcional em `(auth)/onboarding/` ✅
- **Settings** — stub "Em breve" ❌
- **Gaps / Planner** — stubs para fases futuras (manter como estão)
- **Extension mini-review** — não existe ❌
- **Monetização** — schema pronto (plans, subscriptions), sem código Stripe ❌
- **Duplicatas** — não existe ❌

---

## ALTA PRIORIDADE

### P1 — Mini-revisão no Side Panel (extensão)
**Impacto:** Retenção máxima — usuário estuda e revisa no mesmo lugar

**Estratégia para FSRS:** `ts-fsrs` não está no package.json da extensão.
Em vez de adicionar a lib, criaremos um endpoint `POST /api/reviews/rate` no web app
que executa o FSRS no servidor e atualiza o DB. A extensão já usa a API para chat/generate.

**Arquivos:**
1. `apps/web/src/app/api/reviews/rate/route.ts` — **NOVO**
   - Auth: Bearer + cookie
   - Body: `{ flashcard_id, rating: "again"|"hard"|"good"|"easy" }`
   - Executa `dbToFSRSCard → scheduleReview → fsrsCardToDBFields`
   - Update `flashcards` + insert `reviews`
   - Retorna `{ next_review_at, fsrs_state }`

2. `apps/extension/components/ReviewSession.tsx` — **NOVO**
   - Busca até 20 cards `next_review_at <= now()` via supabase direto
   - UI: frente → clique para revelar verso → 4 botões (De novo / Difícil / Bom / Fácil)
   - Rating chama `POST /api/reviews/rate`
   - Progress bar + contador (X/Y)
   - Tela final: X cards revisados, Y% acerto, botão "Revisar mais"

3. `apps/extension/entrypoints/sidepanel/App.tsx` — **MODIFICAR**
   - Tab type: `"flashcard" | "chat" | "review"`
   - Estado `dueCount` carregado no `init()` via Supabase count query
   - Nova tab "🔄 Revisar" com badge vermelho se `dueCount > 0`
   - Renderizar `<ReviewSession>` quando tab === "review"

---

### P2 — Settings Page Real (web)
**Impacto:** Produto mais completo; usuário pode ajustar perfil e bancas

**Arquivos:**
1. `apps/web/src/app/(dashboard)/settings/page.tsx` — **REESCREVER**
   - Server component
   - Busca profile + user_bancas (com join em bancas) + todas as bancas disponíveis

2. `apps/web/src/app/(dashboard)/settings/settings-form.tsx` — **NOVO** (client component)
   - Seção "Perfil": nome, faculdade, ano de formatura, ano alvo, horas/dia
   - Seção "Bancas": gerenciar bancas (add/remove, set primary) — lógica do onboarding reutilizada
   - Seção "Plano": mostrar "Gratuito" + botão "Upgrade" (desabilitado até Stripe)
   - Save via Supabase client-side (como no onboarding)
   - Toast de sucesso/erro

---

### P3 — Monetização Stripe (web)
**Requer:** Conta Stripe + env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Planos propostos:**
- `free`: Gratuito — 30 flashcards/mês, 5 dúvidas/dia, 1 banca
- `pro` (R$ 29,90/mês): 500 flashcards/mês, 50 dúvidas/dia, 3 bancas
- `premium` (R$ 59,90/mês): ilimitado, IA prioritária, todas as bancas

**Arquivos:**
1. `supabase/migrations/XXXX_plans_seed.sql` — **NOVO**
   - INSERT nos planos com stripe_price_id placeholder

2. `apps/web/src/app/api/stripe/checkout/route.ts` — **NOVO**
   - POST `{ plan_slug }` → cria Stripe Checkout Session → retorna `{ url }`

3. `apps/web/src/app/api/stripe/webhook/route.ts` — **NOVO**
   - Verifica assinatura Stripe
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Upsert em `subscriptions`

4. `apps/web/src/app/(dashboard)/settings/settings-form.tsx` — **ATUALIZAR**
   - Seção plano: mostra plano atual, data de renovação, botão "Upgrade" funcional
   - Botão chama `/api/stripe/checkout` e redireciona para URL retornada

5. `apps/web/src/app/api/ai/doubt/route.ts` — **ATUALIZAR** (rate limit)
   - Verificar subscription do usuário; se Free e >5 dúvidas hoje → 429

---

## MÉDIA PRIORIDADE

### P4 — Detecção de Duplicatas (extensão + API)
**Impacto:** Evita poluição de deck com cards repetidos

**Arquivos:**
1. `apps/web/src/app/api/flashcards/check-duplicate/route.ts` — **NOVO**
   - GET `?front=<text>` — busca com `ilike '%words%'` nos flashcards do usuário
   - Retorna `{ duplicate: { id, front, back } | null }`

2. `apps/extension/components/FlashcardForm.tsx` — **MODIFICAR**
   - Ao submitar, antes de salvar: chama o endpoint
   - Se duplicata encontrada: banner amarelo "Card similar já existe: [front]. Criar mesmo assim?"
   - Botão "Criar mesmo assim" segue em frente; botão "Cancelar" fecha

### P5 — Onboarding Melhorado
O onboarding atual funciona bem. Melhorias opcionais:
- Stepper visual (Passo 1/2/3)
- Preview da tela de revisão
- Tour da plataforma pós-onboarding

---

## Sequência de implementação recomendada
```
P1 (mini-review extension)  →  P2 (settings)  →  P3 (Stripe)  →  P4 (duplicatas)  →  P5 (onboarding)
```
P1 e P2 podem ser desenvolvidos em paralelo (extensão vs web).
P3 depende de P2 (settings precisa existir para mostrar o plano).
P4 é independente e pode ser feito a qualquer momento.
