# SinapseMED — Roadmap de Produto

> Documento vivo. Atualizar ao concluir cada fase ou ao mudar prioridade.
> Última atualização: 2026-03-06

---

## Visão do Produto

Plataforma de preparação para residência médica que:
1. **Rastreia o que o aluno praticou** (questões, simulados, flashcards)
2. **Gera automaticamente a agenda de revisão** baseada no desempenho
3. **Analisa lacunas com profundidade** cruzando todas as fontes de dados
4. **Oferece mentor IA especializado** por banca, com memória de sessão
5. **Orienta o dia a dia** com um guia claro do que estudar hoje

**Os 4 pilares:**
- Planner Adaptativo (agenda gerada por dados, não manualmente)
- Registro de Simulados (captura rica → alimenta o planner)
- Flashcards (criação fluida + revisão FSRS)
- Dúvidas IA (mentor com contexto e histórico)

---

## Estado Atual do Schema (referência)

```
profiles          — dados do usuário
bancas            — ENARE, ENAMED, USP, etc.
specialties       — especialidades (parent_id para subtemas)
decks             — agrupamentos de flashcards
flashcards        — cards com campos FSRS + specialty_id + tags
reviews           — histórico de revisões FSRS
simulations       — simulados registrados (por data, banca, total)
simulation_results — breakdown por especialidade + dificuldade
study_plan_entries — blocos do planner semanal (manual hoje)
doubt_logs        — contagem de dúvidas por dia (sem conteúdo)
sprints           — ciclos de estudo de longo prazo
```

**Tabelas que precisam ser criadas:**
- `question_sessions` (Fase 3) — sessões de questões avulsas
- `doubt_sessions` + `doubt_messages` (Fase 5) — histórico de chat IA

---

## Fase 1 — Flashcards: Corrigir o que está ruim

**Objetivo:** Tornar o ciclo de criação e gerenciamento de flashcards fluido.
**Status:** `[ ] Pendente`
**Dependências:** Nenhuma. Pode ser iniciada imediatamente.

### Microtasks

**1.1 — Edição de flashcard**
- Adicionar botão "Editar" no `flashcard-item.tsx` (ícone de lápis no menu)
- Criar `EditFlashcardDialog` (modal com front, back, tags, extra_context)
- Criar PATCH `/api/flashcards/[id]` para atualizar
- Callback `onEdit` no `DeckDetailClient` para atualizar estado local

**1.2 — Busca e filtro na lista de cards**
- Adicionar input de busca no topo da `deck-detail-client.tsx`
- Filtrar localmente por front + back + tags (client-side, sem query)
- Adicionar filtro por estado FSRS (Novo / Aprendendo / Revisão / Suspenso)

**1.3 — Geração em lote com IA dentro do deck**
- Adicionar botão "Gerar cards com IA" na `deck-detail-client.tsx`
- Criar `GenerateCardsDialog` (input de tema, quantidade: 5/10/20, preview dos cards)
- Chamar `/api/ai/generate-batch` existente
- Inserir cards gerados no deck atual via `/api/flashcards` em lote

**1.4 — Exibir estado FSRS de cada card**
- Badge em `flashcard-item.tsx`: Novo (azul) / Aprendendo (laranja) / Revisão (verde) / Suspenso (cinza)
- Mapear `fsrs_state`: 0=Novo, 1=Aprendendo, 2=Revisão, 3=Reaprendendo

**1.5 — Confirmação antes de deletar**
- Substituir delete direto por `AlertDialog` de confirmação no `flashcard-item.tsx`

**1.6 — Melhorias de UX na criação manual**
- Sugestão automática de tags baseada no front do card (debounced)
- Preview do card enquanto digita (ao lado do formulário em telas grandes)

**Entrega:** Build passando + commit `feat: flashcards — edição, busca, geração IA, estados FSRS`

---

## Fase 2 — Registro de Simulados: Capturar mais dados

**Objetivo:** Enriquecer o registro de simulados com subtemas e fonte estruturada.
**Status:** `[ ] Pendente`
**Dependências:** Nenhuma. Pode rodar em paralelo com Fase 1.

### Microtasks

**2.1 — Renomear "Simulados" para "Registro de Simulados"**
- `sidebar.tsx`: label "Simulados" → "Reg. Simulados"
- `simulados/page.tsx`: metadata title + heading
- `simulados/simulations-dashboard.tsx`: título da página

**2.2 — Migration: campo `subtopic` em `simulation_results`**
- Arquivo: `supabase/migrations/20260306000001_simulation_subtopics.sql`
- Adicionar coluna `subtopic TEXT` em `simulation_results`
- Adicionar coluna `source_url TEXT` em `simulations` (link do QBank)
- Zero-downtime: colunas nullable, sem default obrigatório

**2.3 — Atualizar formulário de registro**
- Em `add-simulation-dialog.tsx`: adicionar campo "Subtema" por linha de especialidade (input text, opcional)
- Adicionar campo "Link do simulado/QBank" (source_url) no cabeçalho do formulário
- Passar subtopic no payload de cada `SpecialtyRow`

**2.4 — Atualizar parser de imagem**
- Em `/api/ai/parse-simulation`: extrair subtemas do texto da imagem quando presentes
- Adicionar `subtopic` no schema de resposta do parser

**2.5 — Exibir subtemas nos cards de simulado**
- Em `simulation-card.tsx`: mostrar subtemas por especialidade (se preenchidos)
- Em `feedback-card.tsx`: incluir subtema na análise de lacunas

**Entrega:** Build passando + commit `feat: simulados — subtemas, source_url, parser atualizado`

---

## Fase 3 — Planner Adaptativo: Motor de Revisão

**Objetivo:** Transformar o planner de calendário manual em sistema que agenda revisões automaticamente baseado no que o aluno praticou.
**Status:** `[ ] Pendente`
**Dependências:** Fase 2 (subtemas nos simulados) deve estar concluída.
**Atenção:** Esta é a maior fase. Estimar 3-4 sessões de trabalho.

### Microtasks

**3.1 — Migration: tabela `question_sessions`**
- Arquivo: `supabase/migrations/20260306000002_question_sessions.sql`
- Schema:
  ```sql
  question_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    specialty_id UUID REFERENCES specialties(id),
    subtopic TEXT,           -- subtema específico praticado
    questions_count INTEGER, -- total de questões feitas
    correct_count INTEGER,   -- acertos
    source TEXT,             -- "medcel", "qconcursos", "livro", etc.
    practiced_at DATE,       -- data da sessão
    created_at TIMESTAMPTZ
  )
  ```
- RLS: user_id = auth.uid()
- Index em (user_id, practiced_at)

**3.2 — API: POST `/api/question-sessions`**
- Validação de input (specialty_id, questions_count, correct_count, practiced_at)
- Inserir no banco + disparar trigger de agendamento (ver 3.4)
- Retornar sessão criada + dias de revisão agendados

**3.3 — Lógica de agendamento adaptativo**
- Criar `lib/adaptive-scheduler.ts`
- Função `calculateRevisionDates(accuracy, questionsCount): number[]`
  - accuracy >= 80%: revisar em [7, 21] dias
  - accuracy 60-79%: revisar em [3, 7, 14] dias
  - accuracy < 60%: revisar em [1, 3, 7, 14] dias
- Função `scheduleFromSession(session): PlanEntry[]` — gera blocos no planner
- Função `scheduleFromSimulation(simulation, results): PlanEntry[]` — gera revisões das especialidades fracas do simulado

**3.4 — Integrar simulados no agendador**
- Em `/api/simulados` (POST ao criar simulado): após salvar, chamar `scheduleFromSimulation`
- Auto-criar `study_plan_entries` nas datas calculadas para especialidades com accuracy < 70%
- Flag `is_auto_scheduled: boolean` em `study_plan_entries` (nova coluna na migration 3.1)

**3.5 — UI: Widget "Registrar sessão de questões" no `/hoje`**
- Card compacto com: especialidade (select), subtema (text), total, acertos, fonte
- Submit chama POST `/api/question-sessions`
- Feedback: "X revisões agendadas para os próximos dias"

**3.6 — Refatorar WeeklyPlanner para exibir plano gerado**
- Distinguir visualmente blocos manuais vs. auto-agendados (ícone diferente)
- Blocos auto-agendados mostram origem: "Revisão: Pediatria (sessão 03/03)"
- Manter possibilidade de edição manual (adicionar/remover blocos)
- Remover AI plan generation (substituída pelo agendador automático)

**3.7 — Refatorar `getWeekPlan` query**
- Incluir metadados de origem em cada entry (is_auto_scheduled, source_session_id)
- Separar visualmente no frontend

**Entrega:** Build passando + commit `feat: planner adaptativo — agendamento automático por sessões e simulados`

---

## Fase 4 — Hoje: Home Inteligente

**Objetivo:** `/hoje` vira guia real do dia, alimentado pelo planner adaptativo.
**Status:** `[ ] Pendente`
**Dependências:** Fase 3 concluída.

### Microtasks

**4.1 — Widget "Agenda de hoje" (replace atual)**
- Mostrar `study_plan_entries` do dia atual (gerados pelo planner)
- Cada bloco: especialidade, subtema (se houver), duração sugerida, origem
- Checkbox para marcar como concluído (atualiza `is_completed` na entry)
- Se vazio: CTA para registrar sessão de questões ou simulado

**4.2 — Widget "Insights da semana"**
- Total de questões feitas esta semana (de `question_sessions`)
- Accuracy média da semana vs. semana anterior
- Número de simulados registrados
- Flashcards revisados

**4.3 — Widget "Insights do mês"**
- Gráfico de linha: accuracy por especialidade no mês (de question_sessions + simulations)
- Especialidade mais melhorada e mais fraca do mês
- Streak de dias com atividade

**4.4 — Estado de onboarding para novo usuário**
- Detectar usuário sem dados (sem sessions, sem simulados, sem cards)
- Exibir checklist: "Configure suas bancas → Registre seu primeiro simulado → Adicione flashcards → Faça sua primeira revisão"
- Cada item do checklist com link para a ação correspondente

**4.5 — Remover dependência de sprint**
- `/hoje` não deve exigir sprint ativo para ser útil
- Sprint goals aparecem como seção adicional (se sprint ativo), não como conteúdo principal

**Entrega:** Build passando + commit `feat: hoje — home inteligente com agenda e insights`

---

## Fase 5 — Dúvidas: Pilar IA com Histórico

**Objetivo:** Chat IA com memória de sessões, histórico acessível, e UX de nível de produto.
**Status:** `[ ] Pendente`
**Dependências:** Nenhuma. Pode rodar após Fase 1 ou em paralelo.

### Microtasks

**5.1 — Migration: `doubt_sessions` + `doubt_messages`**
- Arquivo: `supabase/migrations/20260306000003_doubt_history.sql`
- Schema:
  ```sql
  doubt_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    title TEXT,          -- gerado da primeira pergunta (primeiras 60 chars)
    created_at TIMESTAMPTZ
  )

  doubt_messages (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES doubt_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT,
    bancas TEXT[],       -- bancas contextualizadas na resposta
    created_at TIMESTAMPTZ
  )
  ```
- RLS em ambas (via user_id em doubt_sessions)

**5.2 — Persistir mensagens durante streaming**
- Em `chat-client.tsx`: ao enviar pergunta, criar/usar session_id
- Ao completar stream: POST `/api/doubt-messages` com conteúdo completo
- Atualizar contagem em `doubt_logs` (manter compatibilidade existente)

**5.3 — Listar sessões anteriores no sidebar do chat**
- Layout do `/duvidas` vira split: lista de sessões (esquerda) + chat (direita)
- Fetch de sessões anteriores do usuário (título + data)
- Clicar em sessão: carregar mensagens dessa sessão no chat

**5.4 — Criar tela de histórico `/duvidas/[sessionId]`**
- Rota dinâmica que carrega sessão específica
- Read-only (não permite continuar sessão antiga — nova pergunta = nova sessão)

**5.5 — Melhorar design do chat**
- Layout full-height sem padding desnecessário
- Área de mensagens com scroll suave
- Input com suporte a Shift+Enter para quebra de linha
- Botão "Criar flashcard" ao lado de cada resposta do mentor

**5.6 — Integração: sugerir flashcard ao final da resposta**
- Após streaming completo: botão "Salvar como flashcard" na mensagem do assistente
- Pré-preenche `CreateFlashcardDialog` com front (a pergunta) e back (resumo da resposta)

**Entrega:** Build passando + commit `feat: dúvidas — histórico de sessões, persistência, UX melhorada`

---

## Fase 6 — Dashboard: Analytics Profundos

**Objetivo:** Dashboard orientado a desempenho real, com análise de simulados como protagonista.
**Status:** `[ ] Pendente`
**Dependências:** Fase 2 (subtemas) e Fase 3 (question_sessions).

### Microtasks

**6.1 — Seção "Análise de Simulados" no Dashboard**
- Tabela: simulado | data | banca | acerto% | tendência (↑↓)
- Gráfico de evolução de acerto geral ao longo do tempo
- Especialidade com maior melhora e maior queda

**6.2 — Análise por especialidade com drilldown**
- Click em especialidade → modal com breakdown: accuracy geral, por dificuldade, por subtema
- Cruzar dados de simulados + question_sessions para essa especialidade

**6.3 — Análise por dificuldade**
- Gráfico de barras: fácil/médio/difícil — accuracy em cada nível
- Identificar se o aluno tem fraqueza específica em questões difíceis

**6.4 — Revisão da "Previsão de Aprovação"**
- Adicionar aviso claro de "baseado em X simulados — pouca confiabilidade" se dados escassos (< 5 simulados)
- Esconder probabilidade numérica se dados insuficientes — mostrar apenas "Dados insuficientes para previsão"
- Manter tendência e pontos fortes/fracos (mais confiáveis com menos dados)

**6.5 — Widget "Próximo simulado sugerido"**
- Baseado na data do último simulado + frequência histórica do aluno
- "Seu último simulado foi há X dias. Sugerimos fazer um novo esta semana."
- CTA direto para `/simulados`

**Entrega:** Build passando + commit `feat: dashboard — analytics de simulados, drilldown, previsão revisada`

---

## Funcionalidades Fora do Roadmap Atual

Itens identificados mas não priorizados. Reavaliar após Fase 3.

| Feature | Motivo do adiamento |
|---|---|
| Browser Extension | Alta complexidade técnica, pouco impacto imediato |
| Marketplace de decks | Requer curadoria de conteúdo + moderação |
| Modo offline | PWA complexidade + Supabase sync |
| Sprint (refactor) | Funciona, mas depende do planner adaptativo para ter valor real |
| Gamificação (XP, badges) | Nice-to-have, não core |

---

## Convenções de Commit por Fase

```
feat(flashcards): ...      → Fase 1
feat(simulados): ...       → Fase 2
feat(planner): ...         → Fase 3
feat(hoje): ...            → Fase 4
feat(duvidas): ...         → Fase 5
feat(dashboard): ...       → Fase 6
migration: ...             → qualquer migration de schema
fix: ...                   → correção de bug fora de feature
```

---

## Checklist de Saída por Fase

Antes de marcar qualquer fase como concluída:
- [ ] `npx turbo build --filter=@dindin/web` passando sem erros
- [ ] Nenhum `console.log` em código de produção
- [ ] Migrations com RLS em todas as tabelas novas
- [ ] Sem `any` no TypeScript (exceto com eslint-disable comentado)
- [ ] Commit com mensagem Conventional Commits
- [ ] `git push` feito
