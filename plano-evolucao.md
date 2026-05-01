# 📈 Plano de Evolução — buscaPrecosWeb

**Objetivo:** Evoluir de agregador de preços → motor de decisão de compras B2B
**Horizonte:** 6–10 semanas (entregas incrementais)
**Stack atual:** Next.js (App Router) + Express (backend legado) + PostgreSQL + Redis + Serper API
**Deploy:** Vercel (serverless) + Docker local (dev)

---

## 🧭 DIAGNÓSTICO DO ESTADO ATUAL

### O que já existe e funciona
- **Coleta de preços** via Serper API (`SerperService.ts`) com cache Redis (TTL 6h)
- **Processamento em lote** via `BatchProcessor` + `ParallelRequestManager` (concurrency 3, p-limit)
- **Pipeline completo:** criar cotação → buscar preços → aprovar itens → exportar Excel → enviar via n8n
- **Multi-resultado:** `raw_response` armazena JSONB com todas as ofertas encontradas
- **Entidades:** `users`, `shopping_lists`, `shopping_list_items`, `search_jobs`, `clients`, `audit_logs`
- **Roles:** super_admin, admin, user com autenticação JWT
- **Frontend:** Dashboard com filtros, busca, cards de estatísticas, tabela de cotações

### Gaps identificados (o que falta)
| Gap | Impacto |
|-----|---------|
| Sem identidade de produto (canonical) | Impossível comparar histórico |
| Sem histórico de preços | Cada busca é descartada |
| `raw_response` é blob opaco | Dados presos, sem análise |
| Sem score de oferta | Decisão 100% manual |
| Jobs via `setImmediate` | Perde estado em restart, não escala |
| Fonte única (Serper) | Vendor lock-in + custo alto |
| Sem alertas de oportunidade | Usuário descobre tarde |

---

## 🧱 ARQUITETURA ALVO

```
Frontend (Next.js App Router)
       ↓ API Routes (/api/*)
Orchestration Layer
       ↓
┌──────┴──────┐
│  BullMQ     │ ← Filas de jobs
│  (Redis)    │
└──────┬──────┘
       ↓
Workers (Node.js standalone)
       ↓
┌──────┴──────────────────┐
│  Provider Registry      │
│  ├─ SerperProvider      │
│  ├─ GoogleProvider      │
│  └─ ScraperProvider     │
└──────┬──────────────────┘
       ↓
Normalização + Matching
       ↓
PostgreSQL (dados + histórico + stats)
       ↓
Score Engine → Alertas → Dashboard
```

> **Decisão-chave:** Workers rodam em processo separado (VPS/container), NÃO na Vercel.
> O frontend e API Routes continuam na Vercel normalmente.

---

## 🔴 FASE 1 — FUNDAÇÃO DE DADOS (Semanas 1–2)

**Prioridade:** MÁXIMA — sem isso, todo o resto perde valor.

### 1.1 Produto Canônico

Criar entidade central que unifica variações de nome do mesmo produto.

```sql
-- Migration: 007_canonical_products.sql
CREATE TABLE canonical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_name TEXT NOT NULL,       -- "resma a4 500 folhas chamex"
  brand TEXT,                          -- "Chamex"
  category TEXT,                       -- "Papelaria"
  attributes JSONB DEFAULT '{}',       -- {"folhas": 500, "formato": "A4"}
  gtin VARCHAR(14),                    -- código de barras (quando disponível)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_canonical_normalized ON canonical_products(normalized_name);

-- Vincular itens existentes ao produto canônico
ALTER TABLE shopping_list_items
  ADD COLUMN canonical_product_id UUID REFERENCES canonical_products(id);
```

**Integração com código existente:**
- Modificar `ListRepository.updateItemResult()` para chamar matching após salvar
- O `normalizeQuery()` em `helpers.ts` já faz lowercase + remove acentos — reutilizar como base

### 1.2 Histórico de Preços

Cada oferta encontrada vira um registro permanente.

```sql
-- Migration: 008_price_history.sql
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_product_id UUID NOT NULL REFERENCES canonical_products(id),
  price DECIMAL(12,2) NOT NULL,
  store TEXT NOT NULL,
  product_title TEXT,
  product_link TEXT,
  source VARCHAR(30) NOT NULL,        -- 'serper', 'google', 'scraper'
  shopping_list_id UUID REFERENCES shopping_lists(id),
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ph_canonical ON price_history(canonical_product_id);
CREATE INDEX idx_ph_captured ON price_history(captured_at);
CREATE INDEX idx_ph_store ON price_history(store);
```

**Integração:** Modificar o callback `onItemProcessed` dentro de `BatchProcessor.process()` para também inserir em `price_history`.

### 1.3 Estatísticas Materializadas

```sql
-- Migration: 009_price_stats.sql
CREATE MATERIALIZED VIEW price_stats AS
SELECT
  canonical_product_id,
  COUNT(*) as sample_count,
  ROUND(AVG(price), 2) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price,
  ROUND(STDDEV(price), 2) as std_dev,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
  MAX(captured_at) as last_seen
FROM price_history
WHERE captured_at > NOW() - INTERVAL '90 days'
GROUP BY canonical_product_id;

CREATE UNIQUE INDEX idx_ps_canonical ON price_stats(canonical_product_id);

-- Refresh programado (chamar via cron ou após batch)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY price_stats;
```

### ✅ Entregáveis Fase 1
- [ ] Migration 007 + `CanonicalProductRepository`
- [ ] Migration 008 + `PriceHistoryRepository`
- [ ] Migration 009 + função `refreshPriceStats()`
- [ ] Modificar `BatchProcessor` para alimentar histórico
- [ ] Endpoint `GET /api/products/:id/history`

---

## 🔴 FASE 2 — MOTOR DE DECISÃO (Semanas 2–3)

### 2.1 Score de Oferta

O score transforma dados brutos em recomendação acionável.

```typescript
// services/ScoreEngine.ts
interface OfferScore {
  price: number;
  score: number;
  flags: string[];  // ['ABAIXO_MEDIA', 'LOJA_CONFIAVEL', 'MELHOR_PRECO']
}

function calculateScore(offer: ProductResult, stats: PriceStats): OfferScore {
  let score = 100;

  // Preço vs média histórica (peso principal)
  const priceRatio = offer.price / stats.avg_price;
  if (priceRatio <= 0.85) {
    score += 30;  // Oportunidade
    flags.push('ABAIXO_MEDIA');
  } else if (priceRatio >= 1.15) {
    score -= 20;  // Caro
  }

  // Proximidade do mínimo histórico
  if (offer.price <= stats.min_price * 1.05) {
    score += 20;
    flags.push('PROXIMO_MINIMO');
  }

  // Loja conhecida (confiabilidade futura)
  // TODO: tabela store_reputation

  return { price: offer.price, score, flags };
}
```

**Onde encaixar:** No `ListRepository.updateItemResult()`, após salvar `raw_response`, calcular score para cada resultado e armazenar o ranking.

### 2.2 Seleção Automática da Melhor Oferta

```sql
-- Adicionar à shopping_list_items
ALTER TABLE shopping_list_items
  ADD COLUMN auto_selected BOOLEAN DEFAULT false,
  ADD COLUMN offer_score DECIMAL(6,2);
```

Quando o batch terminar, o `BatchProcessor` seleciona automaticamente a oferta com maior score (se `score >= threshold`). O usuário pode sobrescrever manualmente.

### 2.3 Endpoint de Recomendação

```
GET /api/lists/:id/recommendations
→ retorna itens ordenados por oportunidade (score desc)
→ destaca: "3 itens abaixo da média histórica"
```

### ✅ Entregáveis Fase 2
- [ ] `ScoreEngine` service
- [ ] Auto-seleção no `BatchProcessor`
- [ ] Migration com `offer_score` + `auto_selected`
- [ ] Endpoint de recomendações
- [ ] Card no Dashboard: "Oportunidades detectadas"

---

## 🟡 FASE 3 — PROCESSAMENTO ASSÍNCRONO ROBUSTO (Semanas 3–4)

### Problema atual
O `BatchProcessor` usa `setImmediate()` — se o processo reiniciar, o job some.
Na Vercel, o `unstable_after()` mitiga, mas não resolve para jobs longos.

### 3.1 Migrar para BullMQ

```
npm install bullmq ioredis
```

```typescript
// queue/connection.ts
import IORedis from 'ioredis';
export const redis = new IORedis(process.env.REDIS_URL);

// queue/searchQueue.ts
import { Queue } from 'bullmq';
export const searchQueue = new Queue('price-search', { connection: redis });

// workers/searchWorker.ts
import { Worker } from 'bullmq';
const worker = new Worker('price-search', async (job) => {
  const { listId, items } = job.data;
  // Reutilizar lógica do BatchProcessor.process()
  // job.updateProgress(percent) para atualizar progresso
}, {
  connection: redis,
  concurrency: 3,
  limiter: { max: 10, duration: 60000 }
});
```

### 3.2 Estrutura de diretórios

```
backend/src/
├── queue/
│   ├── connection.ts          # Conexão IORedis compartilhada
│   ├── searchQueue.ts         # Fila de busca
│   └── notificationQueue.ts   # Fila de alertas (futuro)
├── workers/
│   ├── searchWorker.ts        # Worker de busca (processo separado)
│   └── statsWorker.ts         # Worker de refresh de stats
```

### 3.3 Deploy

| Componente | Onde roda |
|-----------|-----------|
| Frontend + API Routes | Vercel |
| Workers BullMQ | VPS (DigitalOcean/Railway) ou Docker |
| PostgreSQL | Neon (produção) / Docker (dev) |
| Redis | Upstash (produção) / Docker (dev) |

### ✅ Entregáveis Fase 3
- [ ] `searchQueue` + `searchWorker` com BullMQ
- [ ] Refatorar `POST /api/search/batch` para enfileirar ao invés de `setImmediate`
- [ ] Dashboard de filas (BullMQ Board ou endpoint `/api/admin/queues`)
- [ ] Docker Compose atualizado com worker service
- [ ] Script `npm run worker` para desenvolvimento local

---

## 🟡 FASE 4 — ALERTAS E INTELIGÊNCIA (Semanas 4–5)

### 4.1 Alertas de Preço

```sql
-- Migration: 010_price_alerts.sql
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_product_id UUID NOT NULL REFERENCES canonical_products(id),
  alert_type VARCHAR(30) NOT NULL,    -- 'BELOW_AVERAGE', 'NEW_MINIMUM', 'PRICE_DROP'
  current_price DECIMAL(12,2),
  reference_price DECIMAL(12,2),      -- média, mínimo anterior, etc
  discount_pct DECIMAL(5,2),
  store TEXT,
  product_link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Regras de disparo

```typescript
// Dentro do worker, após salvar price_history:
if (price < stats.avg_price * 0.85) {
  await alertsRepo.create({
    type: 'BELOW_AVERAGE',
    currentPrice: price,
    referencePrice: stats.avg_price,
    discountPct: ((stats.avg_price - price) / stats.avg_price) * 100
  });
}

if (price < stats.min_price) {
  await alertsRepo.create({ type: 'NEW_MINIMUM', ... });
}
```

### 4.3 Endpoints

```
GET  /api/alerts                    → lista alertas (com paginação)
GET  /api/alerts/summary            → { total: 12, unread: 5, topOpportunity: {...} }
PATCH /api/alerts/:id/read          → marcar como lido
```

### 4.4 Integração com n8n (já existente)

Disparar webhook n8n quando alerta crítico for criado → enviar notificação por email/Telegram.

### ✅ Entregáveis Fase 4
- [ ] Migration 010 + `AlertRepository`
- [ ] Regras de disparo no worker
- [ ] Endpoints de alertas
- [ ] Página `/alerts` no frontend com badge de notificação
- [ ] Webhook para n8n (notificações externas)

---

## 🟢 FASE 5 — MULTI-PROVIDER (Semanas 5–7)

### 5.1 Interface de Provider

```typescript
// services/providers/PriceProvider.ts
export interface PriceProvider {
  name: string;
  search(query: string): Promise<ProductResult[]>;
  isAvailable(): boolean;
  costPerQuery(): number;  // centavos
}
```

### 5.2 Registry com fallback

```typescript
// services/providers/ProviderRegistry.ts
export class ProviderRegistry {
  private providers: PriceProvider[] = [];

  register(provider: PriceProvider) { ... }

  async search(query: string): Promise<ProductResult[]> {
    // Ordenar por custo, tentar o mais barato primeiro
    for (const provider of this.sortByCost()) {
      if (!provider.isAvailable()) continue;
      try {
        const results = await provider.search(query);
        if (results.length > 0) return results;
      } catch { continue; }
    }
    return [];
  }
}
```

### 5.3 Refatorar SerperService → SerperProvider

O `SerperService.ts` atual vira um provider. Mínima mudança no resto do sistema.

### 5.4 Roadmap de providers

| Provider | Custo | Prioridade |
|----------|-------|-----------|
| Serper (atual) | ~$0.004/query | Já existe |
| Google Shopping API | variável | Alta |
| Web scraping direto | $0 (infra) | Média |

### ✅ Entregáveis Fase 5
- [ ] Interface `PriceProvider`
- [ ] `ProviderRegistry` com fallback
- [ ] Refatorar `SerperService` → `SerperProvider`
- [ ] Métricas de custo por provider
- [ ] Config para escolher provider por cotação

---

## 🟢 FASE 6 — MATCHING INTELIGENTE (Semanas 7–9)

### 6.1 Normalização (já parcial em `helpers.ts`)

Expandir `normalizeQuery()`:

```typescript
function normalizeForMatching(query: string): string {
  let normalized = normalizeQuery(query);  // função existente
  // Padronizar unidades
  normalized = normalized
    .replace(/(\d+)\s*gb/g, '$1gb')
    .replace(/(\d+)\s*mm/g, '$1mm')
    .replace(/(\d+)\s*folhas?/g, '$1fls');
  return normalized;
}
```

### 6.2 Similaridade (Jaccard com tokens)

```typescript
function jaccardSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.split(' '));
  const tokensB = new Set(b.split(' '));
  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);
  return intersection.size / union.size;
}

// Threshold: >= 0.70 = mesmo produto
```

### 6.3 Pipeline de matching

Ao inserir novo item → normalizar → buscar canonical com similaridade ≥ 0.7 → vincular ou criar novo canonical.

### ✅ Entregáveis Fase 6
- [ ] `normalizeForMatching()` expandido
- [ ] `ProductMatcher` service
- [ ] Auto-vinculação no fluxo de criação de cotação
- [ ] Tela admin para merge manual de produtos

---

## 📊 MODELO DE DADOS CONSOLIDADO

```
users ──────────┐
                ├── shopping_lists ── shopping_list_items
clients ────────┘                           │
                                            │ canonical_product_id
                                            ▼
                                    canonical_products
                                            │
                                            ├── price_history
                                            ├── price_stats (materialized view)
                                            └── price_alerts

search_jobs ── shopping_lists
audit_logs  ── users
```

---

## 📅 ROADMAP RESUMIDO

| Semana | Fase | Entrega principal |
|--------|------|-------------------|
| 1–2 | Fase 1 | Canonical + histórico + stats |
| 2–3 | Fase 2 | Score engine + auto-seleção |
| 3–4 | Fase 3 | BullMQ + workers separados |
| 4–5 | Fase 4 | Alertas + integração n8n |
| 5–7 | Fase 5 | Multi-provider + registry |
| 7–9 | Fase 6 | Matching inteligente |

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Mitigação |
|-------|:---:|-----------|
| Serper muda API/preço | Média | Multi-provider (Fase 5) |
| Matching gera falsos positivos | Alta | Threshold conservador (0.7) + merge manual |
| Workers param silenciosamente | Média | Health checks + alertas de fila |
| Custo de infra com VPS | Baixa | Railway/Fly.io (free tier cobre MVP) |
| Volume de dados cresce rápido | Baixa | Particionamento de `price_history` por mês |

---

## 🧠 INSIGHT ESTRATÉGICO

> Você **não** está construindo um buscador de preços.
> Você está construindo um **sistema de decisão de compras** que:
> - Aprende com cada cotação realizada
> - Acumula inteligência de mercado ao longo do tempo
> - Reduz progressivamente a necessidade de intervenção humana

Cada cotação alimenta o histórico → que melhora o score → que acelera a decisão.
**O sistema fica mais valioso a cada uso.**

---

## 📌 PRÓXIMO PASSO IMEDIATO

Escolha um para começar hoje:

- [ ] **Fase 1.1** — Criar migration `007_canonical_products.sql` + repository
- [ ] **Fase 1.2** — Criar migration `008_price_history.sql` + alimentar no BatchProcessor
- [ ] **Fase 3.1** — Instalar BullMQ e refatorar o BatchProcessor

> **Recomendação:** Começar pela Fase 1.1 (canonical products). É a fundação de tudo.
