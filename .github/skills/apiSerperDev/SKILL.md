---
name: apiSerperDev
description: "Skill de integração com a API Serper.dev para busca de preços no Google Shopping. Use para implementar serviços de busca de produtos, cache Redis, processamento paralelo e extração do menor preço com foco em mercado brasileiro (gl=br, hl=pt-br)."
argument-hint: "Descreva a funcionalidade de busca necessária: consulta única, batch de múltiplos produtos, necessidade de cache, ou integração com o fluxo existente do BuscaPrecosWeb."
user-invocable: true
---

```typescript
// metadata.ts
export const skillMetadata = {
  name: "apiSerperDev",
  version: "1.0.0",
  description: "Integração com Serper.dev para busca de preços no Google Shopping",
  author: "BuscaPrecosWeb Team",
  dependencies: {
    axios: "^1.6.0",
    redis: "^4.6.0",
    zod: "^3.22.0"
  },
  config: {
    apiKey: process.env.SERPER_API_KEY,
    baseUrl: "https://google.serper.dev/shopping",
    defaultCountry: "br",
    defaultLanguage: "pt-br",
    maxResultsPerQuery: 20,
    cacheTTL: 21600 // 6 horas em segundos
  }
};
```

---

## 🏗️ **ARQUITETURA DO SERVIÇO**

```
┌─────────────────────────────────────────────────────────────┐
│                    SERPER SERVICE LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               SerperService (Main)                  │   │
│  │  • searchProduct()                                   │   │
│  │  • searchBatch()                                     │   │
│  │  • extractCheapestPrice()                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│           ┌───────────────┼───────────────┐                  │
│           ▼               ▼               ▼                  │
│  ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │  CacheManager   │ │   Parser    │ │   ErrorHandler  │   │
│  │  • getCached()  │ │ • normalize │ │ • retryWith     │   │
│  │  • setCache()   │ │ • validate  │ │   Backoff()     │   │
│  │  • invalidate() │ └─────────────┘ └─────────────────┘   │
│  └─────────────────┘                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 **IMPLEMENTAÇÃO COMPLETA**

### 1. **Tipos e Interfaces (types.ts)**

```typescript
// backend/src/services/api/serper/types.ts
import { z } from 'zod';

// Schema de validação com Zod para a resposta da API
export const SerperShoppingResultSchema = z.object({
  title: z.string(),
  price: z.number().positive(),
  source: z.string(),
  link: z.string().url(),
  thumbnail: z.string().url().optional(),
  delivery: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().positive().optional()
});

export const SerperResponseSchema = z.object({
  searchParameters: z.object({
    q: z.string(),
    gl: z.string(),
    hl: z.string(),
    num: z.number().optional(),
    page: z.number().optional(),
    type: z.string()
  }),
  shopping_results: z.array(SerperShoppingResultSchema).optional(),
  credits: z.number().int().positive()
});

// Tipos inferidos dos schemas
export type SerperShoppingResult = z.infer<typeof SerperShoppingResultSchema>;
export type SerperResponse = z.infer<typeof SerperResponseSchema>;

// Interface para o resultado processado no BuscaPrecosWeb
export interface PriceResult {
  productQuery: string;
  normalizedQuery: string;
  bestPrice: number | null;
  bestStore: string | null;
  productTitle: string | null;
  productLink: string | null;
  thumbnail: string | null;
  status: 'found' | 'not_found' | 'error';
  searchedAt: Date;
  apiSource: 'serper';
  rawResponse?: any; // Para debug/auditoria
}

// Configuração do serviço
export interface SerperConfig {
  apiKey: string;
  baseUrl: string;
  defaultCountry: string;
  defaultLanguage: string;
  maxResultsPerQuery: number;
  cacheTTL: number;
  timeoutMs: number;
  retryAttempts: number;
}

// Erros customizados
export class SerperApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public query?: string
  ) {
    super(message);
    this.name = 'SerperApiError';
  }
}

export class SerperRateLimitError extends SerperApiError {
  constructor(retryAfter?: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}s`);
    this.name = 'SerperRateLimitError';
  }
}
```

### 2. **Serviço Principal (serper.service.ts)**

```typescript
// backend/src/services/api/serper/serper.service.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  SerperConfig, 
  SerperResponse, 
  SerperResponseSchema,
  PriceResult,
  SerperApiError,
  SerperRateLimitError
} from './types';
import { CacheManager } from '../../cache/cache.manager';
import { Logger } from '../../../utils/logger';
import { normalizeQuery } from '../../../utils/string-utils';

export class SerperService {
  private readonly client: AxiosInstance;
  private readonly cache: CacheManager;
  private readonly logger: Logger;
  private readonly config: SerperConfig;

  constructor(config: Partial<SerperConfig> = {}) {
    this.config = {
      apiKey: process.env.SERPER_API_KEY!,
      baseUrl: 'https://google.serper.dev/shopping',
      defaultCountry: 'br',
      defaultLanguage: 'pt-br',
      maxResultsPerQuery: 20,
      cacheTTL: 21600, // 6 horas
      timeoutMs: 5000, // 5 segundos
      retryAttempts: 3,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs,
      headers: {
        'X-API-KEY': this.config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    this.cache = new CacheManager();
    this.logger = new Logger('SerperService');

    this.setupInterceptors();
  }

  /**
   * Configura interceptors para logging e tratamento de erros
   */
  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] 
            ? parseInt(error.response.headers['retry-after'] as string) 
            : 60;
          throw new SerperRateLimitError(retryAfter);
        }
        
        throw new SerperApiError(
          error.message,
          error.response?.status,
          error.config?.data ? JSON.parse(error.config.data).q : undefined
        );
      }
    );
  }

  /**
   * Busca preço de um produto com cache
   */
  async searchProduct(
    query: string, 
    options: { 
      forceRefresh?: boolean;
      country?: string;
      language?: string;
    } = {}
  ): Promise<PriceResult | null> {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = this.buildCacheKey(normalizedQuery, options);

    try {
      // 1. Tentar obter do cache (a menos que forceRefresh seja true)
      if (!options.forceRefresh) {
        const cached = await this.cache.get<PriceResult>(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for: ${normalizedQuery}`);
          return cached;
        }
      }

      // 2. Buscar da API
      this.logger.debug(`Fetching from API: ${normalizedQuery}`);
      const result = await this.fetchFromApi(normalizedQuery, options);

      // 3. Salvar no cache se encontrou resultado
      if (result && result.status === 'found') {
        await this.cache.set(cacheKey, result, this.config.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error searching for ${normalizedQuery}:`, error);
      return this.createErrorResult(normalizedQuery, error);
    }
  }

  /**
   * Busca múltiplos produtos em paralelo (otimizado para 30+ itens)
   */
  async searchBatch(
    queries: string[],
    options: {
      concurrency?: number;
      onProgress?: (progress: number) => void;
      signal?: AbortSignal;
    } = {}
  ): Promise<PriceResult[]> {
    const { 
      concurrency = 5, // Processar 5 por vez para não sobrecarregar
      onProgress,
      signal 
    } = options;

    const results: PriceResult[] = [];
    const chunks = this.chunkArray(queries, concurrency);
    let processed = 0;

    for (const chunk of chunks) {
      // Verificar se foi cancelado
      if (signal?.aborted) {
        throw new Error('Batch search cancelled');
      }

      // Processar chunk em paralelo
      const chunkResults = await Promise.allSettled(
        chunk.map(query => this.searchProduct(query))
      );

      // Coletar resultados bem-sucedidos
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        } else {
          // Resultado com erro
          results.push(this.createErrorResult(chunk[index]));
        }
      });

      // Atualizar progresso
      processed += chunk.length;
      onProgress?.(Math.round((processed / queries.length) * 100));

      // Delay entre chunks para rate limiting
      if (chunks.length > 1) {
        await this.sleep(1000);
      }
    }

    return results;
  }

  /**
   * Busca direta da API Serper
   */
  private async fetchFromApi(
    query: string,
    options: {
      country?: string;
      language?: string;
    }
  ): Promise<PriceResult | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.client.post('', {
          q: query,
          gl: options.country || this.config.defaultCountry,
          hl: options.language || this.config.defaultLanguage,
          num: this.config.maxResultsPerQuery
        });

        // Validar resposta com Zod
        const validated = SerperResponseSchema.parse(response.data);
        
        return this.processSerperResponse(query, validated);
      } catch (error) {
        lastError = error as Error;
        
        // Se for rate limit, esperar mais tempo
        if (error instanceof SerperRateLimitError) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.sleep(waitTime);
          continue;
        }
        
        // Se não for retryável, abortar
        break;
      }
    }

    throw lastError || new Error(`Failed after ${this.config.retryAttempts} attempts`);
  }

  /**
   * Processa a resposta da API e extrai o menor preço
   */
  private processSerperResponse(
    query: string, 
    response: SerperResponse
  ): PriceResult | null {
    if (!response.shopping_results?.length) {
      return {
        productQuery: query,
        normalizedQuery: normalizeQuery(query),
        bestPrice: null,
        bestStore: null,
        productTitle: null,
        productLink: null,
        thumbnail: null,
        status: 'not_found',
        searchedAt: new Date(),
        apiSource: 'serper'
      };
    }

    // Encontrar o menor preço
    const cheapest = response.shopping_results.reduce(
      (min, current) => current.price < min.price ? current : min
    );

    return {
      productQuery: query,
      normalizedQuery: normalizeQuery(query),
      bestPrice: cheapest.price,
      bestStore: cheapest.source,
      productTitle: cheapest.title,
      productLink: cheapest.link,
      thumbnail: cheapest.thumbnail || null,
      status: 'found',
      searchedAt: new Date(),
      apiSource: 'serper',
      rawResponse: process.env.NODE_ENV === 'development' ? response : undefined
    };
  }

  /**
   * Cria resultado de erro para fallback
   */
  private createErrorResult(query: string, error?: any): PriceResult {
    return {
      productQuery: query,
      normalizedQuery: normalizeQuery(query),
      bestPrice: null,
      bestStore: null,
      productTitle: null,
      productLink: null,
      thumbnail: null,
      status: 'error',
      searchedAt: new Date(),
      apiSource: 'serper'
    };
  }

  /**
   * Utilitários
   */
  private buildCacheKey(query: string, options: any): string {
    return `serper:${query}:${options.country || 'br'}:${options.language || 'pt-br'}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Invalidar cache para uma query específica
   */
  async invalidateCache(query: string, options: any = {}): Promise<void> {
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = this.buildCacheKey(normalizedQuery, options);
    await this.cache.del(cacheKey);
    this.logger.debug(`Cache invalidated for: ${normalizedQuery}`);
  }
}
```

### 3. **Cache Manager (cache.manager.ts)**

```typescript
// backend/src/services/cache/cache.manager.ts
import Redis from 'ioredis';

export class CacheManager {
  private redis: Redis;
  private readonly defaultTTL: number = 21600; // 6 horas

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.setex(key, this.defaultTTL, serialized);
      }
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushall();
    } catch (error) {
      console.error('Error flushing cache:', error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
```

### 4. **Utilitários (string-utils.ts)**

```typescript
// backend/src/utils/string-utils.ts
/**
 * Normaliza uma query de busca para uso em cache
 * Remove acentos, caracteres especiais e padroniza
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '')     // Remove caracteres especiais
    .replace(/\s+/g, ' ')             // Normaliza espaços
    .trim();
}

/**
 * Formata preço para exibição em R$
 */
export function formatPriceBRL(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}
```

### 5. **Testes Unitários (serper.service.test.ts)**

```typescript
// backend/tests/services/api/serper/serper.service.test.ts
import { SerperService } from '../../../../src/services/api/serper/serper.service';
import { CacheManager } from '../../../../src/services/cache/cache.manager';

jest.mock('../../../../src/services/cache/cache.manager');

describe('SerperService', () => {
  let service: SerperService;
  let mockCache: jest.Mocked<CacheManager>;

  beforeEach(() => {
    mockCache = new CacheManager() as jest.Mocked<CacheManager>;
    service = new SerperService();
    (service as any).cache = mockCache;
  });

  describe('searchProduct', () => {
    it('should return cached result if available', async () => {
      const mockResult = {
        productQuery: 'iphone 13',
        bestPrice: 3500,
        bestStore: 'Magazine Luiza',
        status: 'found'
      };

      mockCache.get.mockResolvedValue(mockResult);

      const result = await service.searchProduct('iphone 13');

      expect(result).toEqual(mockResult);
      expect(mockCache.get).toHaveBeenCalled();
    });

    it('should fetch from API when cache misses', async () => {
      mockCache.get.mockResolvedValue(null);

      // Mock da chamada API
      const mockApiResponse = {
        shopping_results: [
          { title: 'iPhone 13', price: 3500, source: 'Magalu', link: 'https://...' }
        ]
      };

      (service as any).client.post = jest.fn().mockResolvedValue({ data: mockApiResponse });

      const result = await service.searchProduct('iphone 13');

      expect(result).toBeDefined();
      expect(result?.bestPrice).toBe(3500);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockCache.get.mockResolvedValue(null);
      (service as any).client.post = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await service.searchProduct('iphone 13');

      expect(result?.status).toBe('error');
      expect(result?.bestPrice).toBeNull();
    });
  });

  describe('searchBatch', () => {
    it('should process multiple queries with concurrency control', async () => {
      const queries = ['iphone', 'samsung', 'xiaomi', 'motorola', 'lg'];
      const mockSearch = jest.spyOn(service, 'searchProduct')
        .mockResolvedValue({
          productQuery: '',
          normalizedQuery: '',
          bestPrice: 1000,
          bestStore: 'Store',
          productTitle: 'Product',
          productLink: 'https://...',
          thumbnail: null,
          status: 'found',
          searchedAt: new Date(),
          apiSource: 'serper'
        });

      const onProgress = jest.fn();

      const results = await service.searchBatch(queries, {
        concurrency: 2,
        onProgress
      });

      expect(results).toHaveLength(5);
      expect(mockSearch).toHaveBeenCalledTimes(5);
      expect(onProgress).toHaveBeenCalled();
    });
  });
});
```

### 6. **Configuração de Ambiente (.env.example)**

```env
# backend/.env.example
# Serper.dev Configuration
SERPER_API_KEY=sua_chave_api_aqui
SERPER_BASE_URL=https://google.serper.dev/shopping
SERPER_DEFAULT_COUNTRY=br
SERPER_DEFAULT_LANGUAGE=pt-br
SERPER_MAX_RESULTS=20
SERPER_TIMEOUT_MS=5000
SERPER_RETRY_ATTEMPTS=3

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
REDIS_CACHE_TTL=21600

# Node Environment
NODE_ENV=development
```

---

## 🚀 **COMO USAR NO BuscaPrecosWeb**

### Integração com o BatchProcessor

```typescript
// backend/src/services/BatchProcessor.ts
import { SerperService } from './api/serper/serper.service';

export class BatchProcessor {
  private serperService: SerperService;
  
  constructor() {
    this.serperService = new SerperService();
  }

  async processList(listId: string, items: string[]): Promise<void> {
    // Buscar em batch com progresso
    const results = await this.serperService.searchBatch(items, {
      concurrency: 5,
      onProgress: (progress) => {
        // Atualizar progresso no banco
        this.updateProgress(listId, progress);
      }
    });

    // Salvar resultados no PostgreSQL
    await this.saveResults(listId, results);
  }
}
```

### Controller de Busca

```typescript
// backend/src/controllers/search.controller.ts
import { SerperService } from '../services/api/serper/serper.service';

export class SearchController {
  private serperService: SerperService;

  constructor() {
    this.serperService = new SerperService();
  }

  async batchSearch(req: Request, res: Response) {
    const { listId } = req.body;
    
    // Buscar itens da lista no banco
    const items = await this.getListItems(listId);
    
    // Criar job
    const jobId = generateId();
    
    // Processar em background
    setImmediate(async () => {
      try {
        const results = await this.serperService.searchBatch(items, {
          onProgress: (progress) => {
            // SSE ou WebSocket para atualizações em tempo real
          }
        });
        
        await this.saveResults(listId, results);
      } catch (error) {
        console.error('Batch processing failed:', error);
      }
    });

    res.json({ jobId, status: 'processing' });
  }
}
```

---

## 📊 **MÉTRICAS E MONITORAMENTO**

### Health Check Endpoint

```typescript
// backend/src/routes/health.routes.ts
router.get('/health/serper', async (req, res) => {
  try {
    const service = new SerperService();
    const result = await service.searchProduct('test', { forceRefresh: true });
    
    res.json({
      status: 'healthy',
      apiKey: !!process.env.SERPER_API_KEY,
      cacheConnected: await service['cache'].healthCheck(),
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Métricas de Uso

```typescript
// backend/src/services/metrics.service.ts
export class MetricsService {
  trackSearch(query: string, found: boolean, cached: boolean): void {
    // Implementar tracking para:
    // - Taxa de cache hit
    // - Taxa de sucesso por produto
    // - Tempo médio de resposta
    // - Créditos consumidos
  }
}
```

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

- [ ] Adicionar `SERPER_API_KEY` ao `.env`
- [ ] Instalar dependências: `npm install axios zod ioredis`
- [ ] Copiar arquivos da skill para `backend/src/services/api/serper/`
- [ ] Configurar Redis local ou via Docker
- [ ] Testar integração: `npm test serper.service`
- [ ] Validar cache: buscar mesmo produto duas vezes
- [ ] Testar batch com 30+ produtos
- [ ] Implementar fallback para produtos não encontrados
- [ ] Adicionar logging estruturado
- [ ] Configurar health check endpoint

---

## 🎯 **RESUMO PARA VIBE CODING**

Quando for instruir a IA para implementar esta skill, use:

> "Implemente a skill `apiSerperDev` conforme documentação. Crie o serviço SerperService com cache Redis, processamento paralelo com concurrency control, tratamento de erros com retry exponential backoff, e tipos Zod para validação. A resposta deve incluir o menor preço do array shopping_results. Configure para mercado brasileiro (gl=br, hl=pt-br)."

---

**Esta skill está pronta para ser integrada ao PRD original, substituindo a menção à SerpApi pela Serper.dev, mantendo toda a estrutura de cache e processamento paralelo que você definiu.**