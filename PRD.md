# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## BuscaPrecosWeb (codinome: BuscaPrecosWeb) - MVP - Versão 1.1

---

## 1. VISÃO GERAL

### 1.1 Objetivo do MVP
BuscaPrecosWeb é uma aplicação web que permite aos usuários comparar preços de múltiplos produtos simultaneamente através de consultas em tempo real a APIs de e-commerce. O sistema processa listas de 30+ itens, retornando o menor preço encontrado para cada produto com link direto para compra.

### 1.2 Problema que Resolve
Comparar preços manualmente para múltiplos produtos é tedioso e ineficiente. O BuscaPrecosWeb automatiza este processo, economizando tempo e dinheiro dos consumidores.

### 1.3 Stack Tecnológica
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS
- **Backend**: Node.js 20+, TypeScript, Express 4+
- **Banco de Dados**: PostgreSQL 15+ (via Neon/Railway ou local)
- **Cache**: Redis 7+ (via Upstash ou Redis Stack)
- **APIs Externas**: SerpApi (primária), GeckoAPI (preparação)

---

## 2. USER FLOW

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  1. Upload de   │    │  2. Processa-   │    │  3. Preview     │
│     Lista       │───▶     mento       │───▶│   da Lista      │
│  (TXT/CSV/Manual│    │  (30+ itens)    │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  5. Resultados  │◀───│  4. Confirmação │◀───│  Validação/    │
│     Consolidados│    │     da Busca    │    │  Edição         │
│  (Menor Preço   │    │                 │    │                 │
│   + Link)       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Detalhamento**:
1. Usuário acessa `/app` e escolhe método de entrada do MVP: digitar manualmente, upload TXT (um item por linha) ou CSV (coluna "produto")
2. Sistema valida formato e exibe preview da lista parseada
3. Usuário confirma itens e clica "Buscar Preços"
4. Backend processa requisições paralelas com cache
5. Resultados são exibidos ordenados por menor preço (`best_price asc`) no MVP

### 2.1 Escopo de Entrada (MVP)
- Incluído no MVP: Manual, TXT, CSV.
- Fora do MVP (pós-MVP): PDF e Imagem (OCR), devido a maior complexidade e custo operacional.

### 2.2 Regra de Ordenação de Resultados
- Ordenação padrão MVP: `best_price asc`.
- Ordenação por economia potencial: habilitar apenas quando existir `preco_referencia` por item.
- Fórmula de economia (quando aplicável): `economia = preco_referencia - best_price`.

---

## 3. ARQUITETURA DO SISTEMA

### 3.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Upload   │  │ Lista    │  │ Loading  │  │ Resulta- │        │
│  │ Component│  │ Preview  │  │ Skeleton │  │ dos Table│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │ API REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Controllers                    Services                    │ │
│  │ ┌────────┐ ┌────────┐        ┌────────┐ ┌────────┐       │ │
│  │ │ListaCtrl│ │Search  │        │SerpApi │ │GeckoAPI│       │ │
│  │ │        │ │Ctrl    │        │Service │ │Service │       │ │
│  │ └────────┘ └────────┘        └────────┘ └────────┘       │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Repositories                   Workers                     │ │
│  │ ┌────────┐ ┌────────┐        ┌─────────────────────────┐  │ │
│  │ │UserRepo│ │ListRepo│        │ParallelRequestManager   │  │ │
│  │ └────────┘ └────────┘        │(Promise.allSettled +    │  │ │
│  │ ┌────────┐ ┌────────┐        │ rate limiting)          │  │ │
│  │ │ItemRepo│ │Cache   │        └─────────────────────────┘  │ │
│  │ │        │ │Repo    │                                      │ │
│  │ └────────┘ └────────┘                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │ SerpApi/     │
│ (Dados       │    │ (Cache de    │    │ GeckoAPI/Serper.dev │
│  Persistentes│    │  Resultados) │    │ (Externas)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 3.2 Estratégia de Cache (CRÍTICO)

**Política**:
- **TTL Padrão**: 6 horas para resultados de busca
- **Chave versionada**: `search:v1:${normalizedProductName}:${source}`
- **Cache Aside Pattern**: Verificar Redis antes de consultar API externa
- **Invalidação**: Forçar refresh com parâmetro `?force=true`

**Normalização obrigatória para chave**:
- Converter para minúsculas.
- Remover acentos.
- Colapsar múltiplos espaços.
- Remover pontuação não relevante.
- Padronizar unidades comuns (ex.: `128 gb` -> `128gb`).

**Benefício**: 1 requisição externa → 1 write + N reads sem custo adicional

### 3.3 Processamento Assíncrono e Resiliência
- O processamento em lote deve ser assíncrono e não bloquear a resposta HTTP inicial.
- Progresso de job deve ser persistido (PostgreSQL ou Redis), não apenas em memória.
- Em caso de restart da API, o status do job deve continuar consultável por `jobId`.

---

## 4. ESQUEMA DE DADOS (SGBD)

### 4.1 PostgreSQL - Modelo Relacional

```sql
-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: shopping_lists
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB -- armazenar nome do arquivo original, etc.
);

-- Table: shopping_list_items
CREATE TABLE shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
    original_query VARCHAR(300) NOT NULL,
    normalized_query VARCHAR(300),
    status VARCHAR(20) DEFAULT 'pending', -- pending, found, not_found, error
    -- Resultados da busca (denormalizado para performance)
    best_price DECIMAL(10,2),
    best_store VARCHAR(200),
    best_product_title TEXT,
    best_product_link TEXT,
    -- Metadados
    raw_response JSONB, -- resposta completa da API para auditoria
    searched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_lists_status ON shopping_lists(status);
CREATE INDEX idx_items_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_items_status ON shopping_list_items(status);
CREATE INDEX idx_items_original_query ON shopping_list_items(original_query);
```

### 4.2 Redis - Estruturas de Cache

```typescript
// Chave: search:v1:{normalized_query}:{api_source}
// Exemplo: search:v1:iphone 13 128gb:serpapi
// Valor: {
//   title: "iPhone 13 128GB - Tela 6.1”",
//   price: 3899.00,
//   store: "Magazine Luiza",
//   link: "https://...",
//   fetched_at: "2024-01-15T10:30:00Z",
//   api_source: "serpapi"
// }
// TTL: 21600 segundos (6 horas)
```

### 4.3 Persistência de Jobs (mínimo para MVP)

```sql
-- Table: search_jobs
CREATE TABLE search_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  progress INTEGER DEFAULT 0, -- 0..100
  processed_items INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_list_id ON search_jobs(shopping_list_id);
CREATE INDEX idx_jobs_status ON search_jobs(status);
```

---

## 5. ROTAS DA API INTERNA (RESTful)

### 5.1 Endpoints Principais

```typescript
// ============================================
// LISTS ENDPOINTS
// ============================================

/**
 * POST /api/v1/lists
 * Cria uma nova lista de compras
 * Body: {
 *   name: string,
 *   items: string[] // ["iphone 13", "notebook dell", ...]
 * }
 * Response: 201 Created
 * {
 *   id: uuid,
 *   name: string,
 *   items_count: number,
 *   status: "pending"
 * }
 */
POST /api/v1/lists

/**
 * GET /api/v1/lists/:listId
 * Retorna detalhes da lista com status atual
 */
GET /api/v1/lists/:listId

/**
 * GET /api/v1/lists/:listId/results
 * Retorna resultados processados com paginação
 * Query Params: ?page=1&limit=20&sort=price_asc
 */
GET /api/v1/lists/:listId/results

// ============================================
// SEARCH ENDPOINTS
// ============================================

/**
 * POST /api/v1/search/batch
 * Inicia busca em lote para uma lista existente
 * Body: { listId: uuid }
 * Response: 202 Accepted com jobId
 */
POST /api/v1/search/batch

/**
 * GET /api/v1/search/status/:jobId
 * Verifica progresso da busca
 * Response: {
 *   progress: 45, // porcentagem
 *   processed: 15,
 *   total: 30,
 *   status: "processing"
 * }
 */
GET /api/v1/search/status/:jobId

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * POST /api/v1/cache/clear
 * Admin: Limpa cache para produtos específicos
 * Segurança: requer autenticação e role de administrador
 * Body: { queries: string[] } ou { all: true }
 */
POST /api/v1/cache/clear
```

### 5.2 Contratos de Dados (TypeScript)

```typescript
// Tipos compartilhados entre frontend/backend
interface PriceResult {
  productQuery: string;
  normalizedQuery: string;
  bestPrice: number | null;
  bestStore: string | null;
  productTitle: string | null;
  productLink: string | null;
  status: 'found' | 'not_found' | 'error';
  searchedAt: Date;
}

interface BatchSearchResponse {
  jobId: string;
  listId: string;
  estimatedTimeSeconds: number;
}

interface JobStatusResponse {
  jobId: string;
  listId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  processed: number;
  total: number;
  message?: string;
  requestId: string;
}

interface ErrorResponse {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'RATE_LIMITED' | 'EXTERNAL_API_ERROR' | 'INTERNAL_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN';
  message: string;
  details?: unknown;
  requestId: string;
}

interface SerpApiResponse {
  search_metadata: { id: string; status: string };
  shopping_results?: Array<{
    title: string;
    price: string; // "$599.99" - precisa parsear
    extracted_price: number; // Campo crítico
    source: string; // Nome da loja
    link: string;
    thumbnail?: string;
  }>;
}
```

### 5.3 Contratos de Erro e Observabilidade

- Toda resposta de erro deve seguir `ErrorResponse`.
- Endpoints devem retornar `requestId` para rastreabilidade.
- Códigos mínimos por endpoint: `400`, `401`, `403`, `404`, `429`, `500`.
- Falha de API externa não deve quebrar lote inteiro: item deve virar `status = 'error'` com fallback controlado.

---

## 6. FASES DE IMPLEMENTAÇÃO (ROADMAP PARA IA)

### ✅ FASE 1: Setup e Estrutura Base (Dias 1-2)

**Objetivo**: Inicializar projeto com arquitetura limpa

**Tarefas**:
1. **Backend Setup**
   ```bash
   mkdir BuscaPrecosWeb && cd BuscaPrecosWeb
   mkdir backend frontend
   cd backend && npm init -y
   npm install express typescript ts-node nodemon @types/express
   npm install pg redis dotenv cors helmet express-rate-limit
   npm install -D @types/node @types/pg @types/redis
   ```
   
2. **Estrutura de Pastas (Backend)**
   ```
   backend/
   ├── src/
   │   ├── controllers/     # req/res handlers
   │   ├── services/        # lógica de negócio
   │   │   ├── api/         # integrações externas
   │   │   └── cache/       # redis service
   │   ├── repositories/    # db operations
   │   ├── models/          # types/interfaces
   │   ├── middleware/      # auth, validation
   │   ├── utils/           # helpers
   │   └── app.ts           # express setup
   ├── docker-compose.yml   # postgres + redis
   └── package.json
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npx create-next-app@latest . --typescript --tailwind
   npm install axios react-hook-form @hookform/resolvers zod
   npm install @tanstack/react-query (opcional)
   ```

4. **Docker Compose para Dev**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: BuscaPrecosWeb
         POSTGRES_USER: dev
         POSTGRES_PASSWORD: dev123
       ports: ["5432:5432"]
       volumes: [postgres_data:/var/lib/postgresql/data]
     
     redis:
       image: redis:7-alpine
       ports: ["6379:6379"]
       command: redis-server --appendonly yes
   
   volumes: { postgres_data: {} }
   ```

### 🔧 FASE 2: Backend Core + Banco de Dados (Dias 3-4)

**Objetivo**: Implementar camada de dados e endpoints básicos

**Tarefas**:

1. **Modelos e Migrations**
   - Criar scripts SQL para schema
   - Implementar `DatabaseService` com pool de conexões
   - Configurar `Repository` pattern para cada entidade

2. **Repositories**
   ```typescript
   // backend/src/repositories/ListRepository.ts
   export class ListRepository {
     async create(userId: string, name: string, items: string[]): Promise<List> {
       // Transaction: criar lista + itens em batch
       const client = await pool.connect();
       try {
         await client.query('BEGIN');
         const list = await this.createList(client, userId, name);
         await this.createItems(client, list.id, items);
         await client.query('COMMIT');
         return list;
       } catch (error) {
         await client.query('ROLLBACK');
         throw error;
       } finally {
         client.release();
       }
     }
   }
   ```

3. **Controllers Base**
   - `POST /api/v1/lists` - validação com Zod
   - `GET /api/v1/lists/:id` - retornar com contagem

4. **Testes** (opcional mas recomendado)
   ```typescript
   // Teste simples com Jest
   describe('ListRepository', () => {
     it('should create list with items', async () => {
       // implementar
     });
   });
   ```

### 🔌 FASE 3: Integração de APIs + Cache (Dias 5-6)

**Objetivo**: Conectar SerpApi/Serper.dev ou GeckoAPI e implementar estratégia de cache

**Tarefas**:

1. **Cache Service**
   ```typescript
   // backend/src/services/cache/RedisCacheService.ts
   export class RedisCacheService {
     async getOrSet<T>(
       key: string,
       fetcher: () => Promise<T>,
       ttl: number = 21600
     ): Promise<T> {
       // 1. Try cache
       const cached = await this.get<T>(key);
       if (cached) return cached;
       
       // 2. Fetch from source
       const fresh = await fetcher();
       
       // 3. Store in cache
       await this.set(key, fresh, ttl);
       
       return fresh;
     }
   }
   ```

2. **API Services**
   ```typescript
   // backend/src/services/api/SerpApiService.ts
   export class SerpApiService {
     private readonly baseUrl = 'https://serpapi.com/search';
     private readonly apiKey: string;
     
     async searchProduct(query: string): Promise<PriceResult | null> {
       // Implementar chamada com axios
       // Extrair campos: extracted_price (CRÍTICO), source, link
       // Normalizar preço (string → number)
       // Fallback se não encontrar
     }
   }
   ```

3. **Parallel Request Manager**
   ```typescript
   // backend/src/services/ParallelRequestManager.ts
   export async function processBatch(
     items: string[],
     searchFn: (item: string) => Promise<PriceResult>,
     concurrency: number = 5
   ): Promise<PriceResult[]> {
     const results: PriceResult[] = [];
     const chunks = chunk(items, concurrency);
     
     for (const chunk of chunks) {
       const chunkResults = await Promise.allSettled(
         chunk.map(item => searchFn(item))
       );
       results.push(...processResults(chunkResults));
       
       // Rate limiting: delay entre chunks
       await sleep(1000);
     }
     
     return results;
   }
   ```

4. **Processamento de Job com Persistência**
   ```typescript
   // backend/src/services/BatchProcessor.ts
   export class BatchProcessor {
     // Estado principal persistido em banco/redis; memória apenas como cache local opcional
     
     startJob(listId: string, items: string[]): string {
       const jobId = generateId();
       // Persistir job: status=pending, progress=0
       
       // Processar em background (não bloquear response)
       setImmediate(() => this.process(jobId, items));
       
       return jobId;
     }
     
     private async process(jobId: string, items: string[]) {
       // Lógica de processamento em lote
       // Atualizar progresso persistido a cada 5 itens
     }
   }
   ```

### 🎨 FASE 4: Frontend + Integração Final (Dias 7-8)

**Objetivo**: UI/UX completa seguindo DesignSystem/SKILL.md

**Tarefas**:

1. **Componentes Core** (seguindo SKILL.md)
   ```
   frontend/src/components/
   ├── upload/
   │   ├── FileUploader.tsx    # Drag & drop TXT/CSV
   │   └── ManualInput.tsx     # Textarea para digitar
   ├── list/
   │   ├── ListPreview.tsx     # Tabela editável
   │   └── ListItem.tsx
   ├── results/
   │   ├── ResultsTable.tsx    # Ordenação por preço
   │   ├── PriceTag.tsx        # Formatação R$
   │   └── StoreBadge.tsx      # Ícone da loja
   └── common/
       ├── Button.tsx          # Estilizado
       ├── Spinner.tsx         # Loading states
       └── ProgressBar.tsx     # Progresso batch
   ```

2. **Páginas Next.js**
   ```typescript
   // frontend/src/app/page.tsx - Landing page
   // frontend/src/app/app/page.tsx - Área logada
   // frontend/src/app/app/lists/[id]/page.tsx - Resultados
   ```

3. **Integração API**
   ```typescript
   // frontend/src/services/api.ts
   export const api = {
     async createList(name: string, items: string[]) {
       const response = await axios.post('/api/v1/lists', { name, items });
       return response.data;
     },
     
     async startSearch(listId: string) {
       const response = await axios.post('/api/v1/search/batch', { listId });
       return response.data; // { jobId }
     },
     
     async pollResults(jobId: string, onProgress: (p: number) => void) {
       // Polling com backoff (2s, 3s, 5s...) até completar
       // Alternativa recomendada: SSE para progresso em tempo real
     }
   };
   ```

4. **Design System Integration**
   - Aplicar cores, tipografia conforme SKILL.md
   - Implementar modo claro/escuro
   - Animações com Framer Motion (opcional)

---

## 7. CRITÉRIOS DE ACEITE

### 7.1 Funcionais
- [ ] Upload/manual/CSV com 30+ itens processa em < 30 segundos quando >= 80% dos itens vierem de cache
- [ ] Upload/manual/CSV com 30+ itens processa com fallback parcial quando houver limite/instabilidade da API externa
- [ ] Cache Redis reduz chamadas repetidas em >90%
- [ ] Preços formatados em R$ (BRL)
- [ ] Links funcionam e abrem nova aba
- [ ] Histórico de buscas disponível

### 7.2 Não-Funcionais
- [ ] Tempo de resposta API < 200ms para leituras com cache (P95)
- [ ] Concorrência controlada (não exceder rate limits)
- [ ] Logs estruturados com `requestId`, `jobId`, latência e status
- [ ] Tratamento de erros graceful (fallbacks)

---

## 8. PRÓXIMOS PASSOS (PÓS-MVP)

1. Autenticação de usuários (NextAuth)
2. Compartilhamento de listas
3. Alertas de queda de preço
4. Suporte a mais APIs (Buscape, Zoom)
5. Dashboard com histórico de economia
6. Suporte a PDF e Imagem com OCR

---

**Instrução Final**: Este PRD está otimizado para implementação incremental. Cada fase pode ser entregue separadamente ao assistente de código com o prompt: "Implementar FASE X do PRD BuscaPrecosWeb, mantendo padrões e tipos definidos."