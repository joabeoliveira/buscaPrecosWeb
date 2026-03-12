# Plano: BuscaPrecosWeb MVP

## Repositório: zero código, apenas PRD.md + 4 skills (.github/skills/)
## Skills existentes: apiSerperDev, serpApi, designSystem, GeckoAPI (vazia)

---

## FASE 0 — Decisões e Setup de Ambiente (dia 0)

### Decisões obrigatórias antes de codar
1. API externa primária: Serper.dev (FREE tier, mais simples) 
2. Persistência de progresso de job: tabela `search_jobs` no Postgres (recomendado) 
3. Progresso no frontend: Comece com Polling com Backoff. Ele garante que o MVP saia rápido e sem bugs de timeout de conexão. Assim que o fluxo básico estiver redondo, faça o refactoring para SSE para o "Efeito Uau" na UX.
4. Auth no MVP: auth vai para pós-MVP
5. Deploy alvo: local/Docker e também deve nascer pronto para produção via Coolify

### Setup de ambiente
- `docker-compose.yml` com PostgreSQL 15 + Redis 7
- `.env.example` com SERPAPI_KEY / SERPER_KEY, DATABASE_URL, REDIS_URL
- Monorepo simples: `backend/` e `frontend/` na raiz

---

## FASE 1 — Estrutura Base Backend + Banco (dias 1–2)

### Dependências: nenhuma fase anterior
### Paraleliza com: FASE 1-Frontend (setup independente)

1. Inicializar `backend/` com Node 20 + TypeScript + Express
2. Configurar tsconfig, nodemon, scripts `dev`/`build`/`start`
3. Instalar: `pg`, `redis`, `dotenv`, `cors`, `helmet`, `express-rate-limit`, `zod`, `axios`, `p-limit`
4. Criar estrutura de pastas:
   - `src/controllers/`, `src/services/api/`, `src/services/cache/`, `src/repositories/`, `src/models/`, `src/middleware/`, `src/utils/`
5. Criar `DatabaseService` com pool de conexões (`pg.Pool`)
6. Criar migrations SQL:
   - `users`, `shopping_lists`, `shopping_list_items`, `search_jobs` (+ todos os índices do PRD)
7. Implementar `ListRepository`: create (transação lista+itens), getById, getResults
8. Implementar `JobRepository`: create, updateProgress, getById
9. Controllers base: `POST /api/v1/lists`, `GET /api/v1/lists/:id`
10. Middleware: `requestId` injetado em toda resposta, handler de erro padronizado (`ErrorResponse`)

**Arquivos críticos**: `src/app.ts`, `src/db/pool.ts`, `src/repositories/ListRepository.ts`, `src/repositories/JobRepository.ts`, `src/middleware/errorHandler.ts`, `migrations/001_initial.sql`

---

## FASE 2 — Cache + Integração API Externa (dias 3–4)

### Depende de: FASE 1 (backend base e banco)

1. Implementar `RedisCacheService` com `getOrSet<T>(key, fetcher, ttl)`
2. Implementar normalizador de chave de cache:
   - minúsculas, sem acentos, sem pontuação irrelevante, unidades padronizadas, prefixo `search:v1:`
3. Implementar `SerperService` (ou `SerpApiService`) baseado na skill escolhida na FASE 0:
   - `searchProduct(query)` → extrai `title`, `price`, `store`, `link`
   - parâmetros brasileiros: `gl=br`, `hl=pt-br`
4. Implementar `ParallelRequestManager`:
   - `processBatch(items[], searchFn, concurrency=5)` com `p-limit`
   - delay de 1s entre chunks para rate limiting
   - `Promise.allSettled` — falha individual não quebra lote
5. Implementar `BatchProcessor`:
   - `startJob(listId, items[])` → persiste job no Postgres, dispara `setImmediate`
   - atualiza `progress` a cada 5 itens processados
6. Endpoints:
   - `POST /api/v1/search/batch` → 202 Accepted + jobId
   - `GET /api/v1/search/status/:jobId` → `JobStatusResponse`
   - `POST /api/v1/cache/clear` → requer header `x-admin-token` (MVP simples)
   - `GET /api/v1/lists/:listId/results` → paginado, sort `price_asc`

**Arquivos críticos**: `src/services/cache/RedisCacheService.ts`, `src/utils/normalizeQuery.ts`, `src/services/api/SerperService.ts` (ou `SerpApiService.ts`), `src/services/ParallelRequestManager.ts`, `src/services/BatchProcessor.ts`

---

## FASE 1-Frontend — Setup Next.js + Design System (dias 1–2)

### Paraleliza com: FASE 1 backend

1. `npx create-next-app@latest frontend --typescript --tailwind`
2. Instalar: `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`
3. Configurar `tailwind.config.ts` com paleta `petroleum` e `darkMode: 'class'`
4. Criar tokens globais (CSS variables ou Tailwind theme):
   - Cores, bordas, tipografia conforme `designSystem/SKILL.md`
5. Criar componentes base:
   - `Button` (variantes: primary, secondary, ghost)
   - `Spinner` e `ProgressBar`
   - `PriceBadge` (states: normal, indisponivel)
   - `SearchInput` (focus, erro, loading, disabled)

---

## FASE 3 — Frontend Core + Integração (dias 5–6)

### Depende de: FASE 1-Frontend + FASE 2 (endpoints disponíveis)

1. Componente `ManualInput` — textarea para lista livre de produtos
2. Componente `FileUploader` — TXT (um por linha) e CSV (coluna "produto")
   - validação client: encoding UTF-8, limite de 100 itens, delimitador `,` ou `;`
3. Componente `ListPreview` — tabela editável pré-busca (editar/remover item)
4. Componente `ResultsTable` — ordenação por `best_price asc`, paginação
5. Componente `StoreBadge` — nome da loja com destaque
6. `ProgressBar` animada durante processamento do batch
7. Camada de serviço `frontend/src/services/api.ts`:
   - `createList`, `startSearch`, `pollStatus` (backoff 2s → 3s → 5s)
8. Páginas:
   - `/` — landing page com CTA
   - `/app` — entrada da lista (manual + upload)
   - `/app/lists/[id]` — resultados em tempo real
9. Estados visuais completos: loading skeleton, estado vazio, erro de API externa, sucesso

**Referências**: `designSystem/SKILL.md` para todos os tokens. Sem classes arbitrárias.

---

## FASE 4 — Integração Final, Ajustes e Validação (dias 7–8)

### Depende de: FASE 2 + FASE 3

1. Conectar frontend com backend via `NEXT_PUBLIC_API_URL`
2. Testar fluxo completo E2E: upload CSV → busca → resultados
   - Cenário happy path (30 itens, cache miss → API → cache hit)
   - Cenário parcial (5 itens com erro de API → fallback)
3. Validar critérios de aceite do PRD (seção 7)
4. Ajuste de performance: verificar concorrência, rate limits reais da API escolhida
5. Observabilidade mínima: logs estruturados com `requestId`, `jobId`, latência
6. Revisão de segurança: CORS restrito, rate limit no Express, sem chaves no frontend
7. Atualizar `docker-compose.yml` para subir tudo com um `docker compose up`

---

## Decisões em aberto (validar com usuário)

1. **API primária**: Serper.dev (skill `apiSerperDev`) ou SerpApi (skill `serpApi`)? Ambas têm skills prontas; GeckoAPI fica para pós-MVP.
2. **Autenticação no MVP**: sem auth (sessão anônima) ou auth mínima (e-mail/senha com JWT)?
3. **Progresso no frontend**: polling simples (mais rápido de implementar) ou SSE (melhor UX)?
4. **Deploy inicial**: apenas Docker local ou já provisionar Neon + Upstash + Railway?

---

## Verificação de cada fase
- FASE 0: `docker compose up` sobe Postgres + Redis sem erros
- FASE 1: `POST /api/v1/lists` cria lista + itens no banco com transação
- FASE 2: busca de 1 produto retorna menor preço; segunda busca vem do cache (< 10ms)
- FASE 1-Frontend: componentes base renderizam light e dark mode sem divergência visual
- FASE 3: upload de TXT com 30 itens exibe preview correto e permite editar antes da busca
- FASE 4: fluxo completo E2E funcional; critérios de aceite do PRD seção 7 verificados manualmente
