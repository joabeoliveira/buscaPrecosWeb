# Plano de Refatoração para Next.js API Routes

## Objetivo
Converter a arquitetura de monorepo (Express Backend + Next.js Frontend) para uma arquitetura Full-Stack Next.js com API Routes, permitindo deploy único e otimizado na Vercel.

## Motivação
- ✅ Deploy único na Vercel
- ✅ Reduz complexity (um package.json, um tsconfig)
- ✅ Melhor performance (sem chamadas HTTP externas na rede)
- ✅ Serverless nativo (sem gerenciar servidor Express)
- ✅ Ambiente de desenvolvimento mais simples
- ✅ Compartilhamento de tipos entre frontend e API

## Fases de Refatoração

### **Fase 1: Preparação e Setup (Dia 1)**
Status: `não iniciado`

#### Tarefas:
- [ ] Criar branch `refactor/nextjs-api-routes`
- [ ] Consolidar `tsconfig` (remover do backend, estender do frontend)
- [ ] Estruturar diretório `frontend/src/app/api/`
- [ ] Mover types compartilhadas para `frontend/src/types/`
- [ ] Configurar variáveis de ambiente para API no frontend
- [ ] Remover duplicação de dependências

**Arquivos afetados:**
```
frontend/
  src/
    app/
      api/          ← NEW API routes
      (dashboard)/
      login/
    types/          ← NEW shared types
    services/
      db/           ← Move db pool here
      cache/        ← Move redis cache here
      api/          ← Existing API client
  .env.local
  tsconfig.json
  package.json
```

---

### **Fase 2: Migração de Serviços Compartilhados (Dia 2)**

Status: `não iniciado`

#### Tarefas:
- [ ] Mover `backend/src/db/pool.ts` → `frontend/src/services/db/pool.ts`
- [ ] Mover `backend/src/services/cache/RedisCacheService.ts` → `frontend/src/services/cache/RedisCacheService.ts`
- [ ] Mover tipos de database para `frontend/src/types/database.ts`
- [ ] Atualizar imports em todo o frontend

**Estrutura de destino:**
```
frontend/src/
  services/
    db/
      pool.ts       ← Backend pool.ts movido
    cache/
      RedisCacheService.ts
    api.ts          ← Client API (existente)
  types/
    database.ts     ← From backend
    api.ts          ← Consolidar ListResult, et cetera
```

---

### **Fase 3: Migração de Repositories (Dias 3-4)**

Status: `não iniciado`

#### Tarefas:
- [ ] Mover `JobRepository` → `frontend/src/app/api/repositories/JobRepository.ts`
- [ ] Mover `ListRepository` → `frontend/src/app/api/repositories/ListRepository.ts`
- [ ] Mover `UserRepository` → `frontend/src/app/api/repositories/UserRepository.ts`
- [ ] Adicionar validação com Zod se não existir
- [ ] Atualizar imports

**Arquivos novos:**
```
frontend/src/app/api/
  repositories/
    JobRepository.ts
    ListRepository.ts
    UserRepository.ts
```

---

### **Fase 4: Migração de Serviços de Negócio (Dias 5-6)**

Status: `não iniciado`

#### Tarefas:
- [ ] Mover `SerperService` → `frontend/src/app/api/services/SerperService.ts`
- [ ] Mover `BatchProcessor` → `frontend/src/app/api/services/BatchProcessor.ts`
- [ ] Mover `ParallelRequestManager` → `frontend/src/app/api/services/ParallelRequestManager.ts`
- [ ] Revisar dependências de cada serviço
- [ ] Testar em desenvolvimento

**Arquivos novos:**
```
frontend/src/app/api/
  services/
    SerperService.ts
    BatchProcessor.ts
    ParallelRequestManager.ts
```

---

### **Fase 5: Migração de Controllers para API Routes (Dias 7-8)**

Status: `não iniciado`

#### Tarefas:

##### SearchController → API Routes
- [ ] Criar `frontend/src/app/api/search/batch/route.ts` (POST)
  - Move lógica de `SearchController.startBatch`
- [ ] Criar `frontend/src/app/api/search/status/[jobId]/route.ts` (GET)
  - Move lógica de `SearchController.getStatus`

##### ListController → API Routes
- [ ] Criar `frontend/src/app/api/lists/route.ts` (GET, POST)
- [ ] Criar `frontend/src/app/api/lists/[id]/route.ts` (GET)
- [ ] Criar `frontend/src/app/api/lists/[id]/results/route.ts` (GET)
- [ ] Criar `frontend/src/app/api/lists/[id]/export/route.ts` (GET)

##### UserController → API Routes
- [ ] Criar `frontend/src/app/api/users/route.ts` (GET, POST, DELETE)
- [ ] Criar `frontend/src/app/api/users/login/route.ts` (POST)

**Estrutura final:**
```
frontend/src/app/api/
  search/
    batch/
      route.ts      ← POST /api/search/batch
    status/
      [jobId]/
        route.ts    ← GET /api/search/status/:jobId
  lists/
    route.ts        ← GET /api/lists, POST /api/lists
    [id]/
      route.ts      ← GET /api/lists/:id
      results/
        route.ts    ← GET /api/lists/:id/results
      export/
        route.ts    ← GET /api/lists/:id/export
      approve/
        [itemId]/
          route.ts  ← PATCH /api/lists/:id/items/:itemId/approve
      select/
        [itemId]/
          route.ts  ← POST /api/lists/:id/items/:itemId/select
  users/
    route.ts        ← GET /api/users, POST /api/users, DELETE
    login/
      route.ts      ← POST /api/users/login
```

---

### **Fase 6: Atualizar Client API (Frontend) (Dia 9)**

Status: `não iniciado`

#### Tarefas:
- [ ] Remover imports internos do `backend/` em `frontend/src/services/api.ts`
- [ ] Garantir URLs de API usam `/api/*` (local) ou env var (produção)
- [ ] Testar todas as chamadas da UI

---

### **Fase 7: Middleware, Validação e Segurança (Dias 10-11)**

Status: `não iniciado`

#### Tarefas:
- [ ] Criar middleware de autenticação em `frontend/src/middleware.ts`
- [ ] Aplicar rate limiting com `express-rate-limit` ou alternativa Next.js
- [ ] Validar requests com Zod em cada route
- [ ] Adicionar CORS se necessário
- [ ] Headers de segurança

**Arquivo novo:**
```
frontend/src/
  middleware.ts     ← Auth, CORS, rate limit
  app/api/
    lib/
      validation.ts ← Shared validation schemas
      auth.ts       ← JWT, session handling
```

---

### **Fase 8: Testes e Verificação Local (Dias 12-13)**

Status: `não iniciado`

#### Tarefas:
- [ ] Rodar `npm run dev` e verificar:
  - Todas as rotas de search funcionam
  - CRUD de listas funciona
  - Autenticação funciona
  - Upload de Excel funciona
  - Exportação de Excel funciona
- [ ] Testar fluxo completo:
  1. Criar cotação
  2. Fazer upload
  3. Iniciar busca
  4. Aprovar itens
  5. Exportar
- [ ] Verificar console para erros

---

### **Fase 9: Variáveis de Ambiente e Deploy (Dias 14-15)**

Status: `não iniciado`

#### Tarefas:
- [ ] Consolidar `.env.example` com variáveis de API
- [ ] Documentar setup de Vercel Postgres (se usar)
- [ ] Documentar setup de Redis Cloud (se usar)
- [ ] Criar `.env.production.example`
- [ ] Testar build: `npm run build`
- [ ] Configurar Vercel com variáveis secrets

**Exemplo .env consolidado:**
```env
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# APIs Externas
SERPER_API_KEY=...
SERPAPI_API_KEY=...

# Auth
JWT_SECRET=...

# App
PORT=3000
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

### **Fase 10: Limpeza e Documentação (Dias 16)**

Status: `não iniciado`

#### Tarefas:
- [ ] Remover diretório `backend/` (ou arquivar em branch)
- [ ] Remover scripts de monorepo em `package.json` raiz
- [ ] Atualizar `README.md` com novo setup
- [ ] Atualizar `SETUP.md` com instruções Next.js apenas
- [ ] Documentar estrutura de pastas da API
- [ ] Criar guide de debugging

---

## Estrutura Final Esperada

```
buscaPrecosWeb/
├── frontend/                          ← aplicação unificada
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                   ← ⭐ NOVO: API Routes
│   │   │   │   ├── search/
│   │   │   │   │   ├── batch/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── status/[jobId]/route.ts
│   │   │   │   ├── lists/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── route.ts
│   │   │   │   │       ├── results/route.ts
│   │   │   │   │       ├── export/route.ts
│   │   │   │   │       └── items/[itemId]/...
│   │   │   │   ├── users/
│   │   │   │   ├── lib/                ← ⭐ NOVO: validation, auth
│   │   │   │   └── repositories/       ← ⭐ MOVIDO: DB access
│   │   │   ├── (dashboard)/
│   │   │   ├── login/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   ├── services/                   ← ⭐ CONSOLIDADO
│   │   │   ├── db/                     ← ⭐ MOVIDO: pool.ts
│   │   │   ├── cache/                  ← ⭐ MOVIDO: RedisCacheService
│   │   │   └── api/                    ← ⭐ EXISTENTE: client API
│   │   ├── types/                      ← ⭐ NOVO: shared types
│   │   ├── middleware.ts               ← ⭐ NOVO: auth, rate limit
│   │   └── lib/
│   ├── public/
│   ├── .env.local
│   ├── .env.example
│   ├── package.json                    ← ⭐ CONSOLIDA tudo
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── README.md
├── REFACTORING_PLAN_NEXTJS_API.md     ← Este arquivo
├── SETUP.md                            ← Atualizado
├── PROJECT_STATUS.md
├── docker-compose.yml                  ← Pode manter para local dev
└── .github/                            ← Manter skills, prompts, etc
```

---

## Checklist de Migração

### Antes de começar
- [ ] Criar branch `refactor/nextjs-api-routes`
- [ ] Backup do código atual
- [ ] Comunicar ao time (se houver)

### Durante o processo
- [ ] Testar a cada fase
- [ ] Commit incremental após cada fase
- [ ] Documentar problemas encontrados
- [ ] Manter `.env`, credentials seguros

### Após conclusão
- [ ] PR review
- [ ] Merge em development
- [ ] Testar em staging/preview
- [ ] Deploy na Vercel
- [ ] Monitorar logs

---

## Benefícios Esperados

| Antes (Express + Next) | Depois (Next.js Only) |
|---|---|
| 2 `package.json` | 1 `package.json` |
| 2 repositórios de código | 1 diretório |
| Deploy em 2 plataformas | Deploy único (Vercel) |
| Chamadas HTTP entre serviços | Chamadas diretas de função |
| 2 processos em dev (`npm run dev`) | 1 processo (`npm run dev`) |
| Complexidade de cors/auth | Simplificado |

---

## Timeline Estimado

- **Fase 1-2:** 2 dias
- **Fase 3-4:** 4 dias
- **Fase 5-6:** 3 dias
- **Fase 7-9:** 4 dias
- **Fase 10:** 1 dia
- **Total:** ~2 semanas com paralelismo, 1 semana full-time

---

## Dependências Afetadas

### Remove do Backend (não mais necessário)
```json
{
  "express": "^5.2.1",
  "helmet": "^8.1.0",
  "cors": "^2.8.6",
  "express-rate-limit": "^8.3.1"
}
```

### Adiciona ao Frontend
```json
{
  "pg": "^8.20.0",           // DB client
  "redis": "^5.11.0",        // Redis client
  "p-limit": "^7.3.0",       // Parallel processing
  "zod": "^4.3.6"            // Validation (já tem)
}
```

### Framework/Tooling
```json
{
  "next": "16.1.6",          // Next.js (já tem)
  "typescript": "^5.9.3",    // TypeScript (já tem)
  "axios": "^1.13.6"         // HTTP client (já tem)
}
```

---

## Riscos e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Perda de dados | Baixa | Alto | Backup antes, testar em branch |
| Performance degradação | Média | Médio | Bench antes/depois, cache strategy |
| Incompatibilidade de API | Média | Médio | Testes unitários, integration tests |
| Timeout em serverless | Média | Médio | Otimizar batch, usar queue (Bull/BullMQ) |

---

## Próximos Passos

1. ✅ Revisar este plano com o time
2. ⏳ Criar branch e iniciar Fase 1
3. ⏳ Executar iterativamente com commits
4. ⏳ PR e review cada fase importante
5. ⏳ Deploy inicial em Vercel com preview
6. ⏳ Monitorar e iterar

---

**Versão:** 1.0  
**Data:** 13 de abril de 2026  
**Autor:** GitHub Copilot
