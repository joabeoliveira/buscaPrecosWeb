---
name: api-serpapi-integration
description: "Skill de integração com a API SerpApi para busca de preços no Google Shopping. Use para implementar serviços de busca de produtos, cache Redis, processamento paralelo e extração do menor preço com foco em mercado brasileiro (gl=br, hl=pt-br) utilizando o bloco immersive_products da SerpApi."
argument-hint: "Descreva a funcionalidade de busca necessária: consulta única, batch de múltiplos produtos, necessidade de cache, ou integração com o fluxo existente do BuscaPrecosWeb."
user-invocable: true
---

# 📋 VISÃO GERAL DA SKILL
Esta Skill implementa a integração completa da API SerpApi no MVP BuscaPrecosWeb. Ela substitui a Serper.dev pela SerpApi, mantendo toda a arquitetura de cache Redis, processamento paralelo e tipos definidos, mas adaptando para o formato de resposta específico da SerpApi (usando o bloco immersive_products e o campo extracted_price).

## Quando usar
- Implementar a funcionalidade de busca de preços no Google Shopping.
- Substituir a Serper.dev original do PRD por uma solução mais robusta.
- Integrar a busca de preços com o fluxo existente do BuscaPrecosWeb.
- Otimizar consultas com cache Redis e processamento paralelo.
## Funcionalidades principais
- Consulta à API SerpApi com parâmetros específicos para o mercado brasileiro.
- Extração do menor preço do bloco `immersive_products`.
- Implementação de cache Redis para resultados de busca.
- Tratamento de erros e falhas na API.
- Processamento paralelo para múltiplas consultas de produtos.
## Considerações técnicas
- Utilizar a biblioteca oficial da SerpApi para integração.
- Configurar o cache Redis para armazenar resultados de busca e reduzir latência.
- Garantir que a implementação seja escalável e mantenha a performance mesmo com múltiplas consultas simultâneas.
- Documentar a implementação para facilitar manutenção e futuras melhorias.

## Exemplo:
```typescript
// metadata.ts
export const skillMetadata = {
  name: "apiSerpApiIntegration",
  version: "1.0.0",
  description: "Integração com SerpApi para busca de preços no Google Shopping",
  author: "BuscaPrecosWeb Team",
  dependencies: {
    axios: "^1.6.0",
    redis: "^4.6.0",
    zod: "^3.22.0"
  },
  config: {
    apiKey: process.env.SERPAPI_API_KEY,
    baseUrl: "https://serpapi.com/search",
    engine: "google",
    defaultCountry: "br",
    defaultLanguage: "pt",
    numResults: 20,
    cacheTTL: 21600 // 6 horas em segundos
  }
};
```

---

## 🏗️ **ARQUITETURA DO SERVIÇO**

```
┌─────────────────────────────────────────────────────────────┐
│                    SERPAPI SERVICE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               SerpApiService (Main)                 │   │
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
// backend/src/services/api/serpapi/types.ts
import { z } from 'zod';

// Schema para o produto individual no immersive_products
export const SerpApiProductSchema = z.object({
  title: z.string(),
  source: z.string(),
  price: z.string().optional(),
  extracted_price: z.number().positive().optional(),
  original_price: z.string().optional(),
  extracted_original_price: z.number().positive().optional(),
  thumbnail: z.string().url().optional(),
  source_logo: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().positive().optional(),
  delivery: z.string().optional(),
  extensions: z.array(z.string()).optional(),
  link: z.string().url().optional() // Importante para redirecionamento
});

// Schema para a resposta completa da SerpApi
export const SerpApiResponseSchema = z.object({
  search_metadata: z.object({
    id: z.string(),
    status: z.string(),
    created_at: z.string(),
    processed_at: z.string(),
    total_time_taken: z.number().optional()
  }),
  search_parameters: z.object({
    engine: z.string(),
    q: z.string(),
    location_requested: z.string().optional(),
    location_used: z.string().optional(),
    google_domain: z.string().optional(),
    device: z.string().optional(),
    gl: z.string().optional(),
    hl: z.string().optional()
  }),
  immersive_products: z.array(SerpApiProductSchema).optional(),
  shopping_results: z.array(SerpApiProductSchema).optional(), // Fallback
  organic_results: z.array(z.any()).optional(),
  related_searches: z.array(z.any()).optional(),
  error: z.string().optional()
});

// Tipos inferidos
export type SerpApiProduct = z.infer<typeof SerpApiProductSchema>;
export type SerpApiResponse = z.infer<typeof SerpApiResponseSchema>;

// Interface para o resultado processado no BuscaPrecosWeb
export interface PriceResult {
  productQuery: string;
  normalizedQuery: string;
  bestPrice: number | null;
  bestStore: string | null;
  productTitle: string | null;
  productLink: string | null;
  thumbnail: string | null;
  rating: number | null;
  reviews: number | null;
  status: 'found' | 'not_found' | 'error';
  searchedAt: Date;
  apiSource: 'serpapi';
  rawResponse?: any;
}

// Configuração do serviço
export interface SerpApiConfig {
  apiKey: string;
  baseUrl: string;
  engine: string;
  defaultCountry: string;
  defaultLanguage: string;
  numResults: number;
  cacheTTL: number;
  timeoutMs: number;
  retryAttempts: number;
}

// Erros customizados
export class SerpApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public query?: string
  ) {
    super(message);
    this.name = 'SerpApiError';
  }
}

export class SerpApiRateLimitError extends SerpApiError {
  constructor(retryAfter?: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}s`);
    this.name = 'SerpApiRateLimitError';
  }
}
```

### 2. **Serviço Principal (serpapi.service.ts)**

```typescript
// backend/src/services/api/serpapi/serpapi.service.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  SerpApiConfig, 
  SerpApiResponse, 
  SerpApiResponseSchema,
  SerpApiProduct,
  PriceResult,
  SerpApiError,
  SerpApiRateLimitError
} from './types';
import { CacheManager } from '../../cache/cache.manager';
import { Logger } from '../../../utils/logger';
import { normalizeQuery } from '../../../utils/string-utils';

export class SerpApiService {
  private readonly client: AxiosInstance;
  private readonly cache: CacheManager;
  private readonly logger: Logger;
  private readonly config: SerpApiConfig;

  constructor(config: Partial<SerpApiConfig> = {}) {
    this.config = {
      apiKey: process.env.SERPAPI_API_KEY!,
      baseUrl: 'https://serpapi.com/search',
      engine: 'google',
      defaultCountry: 'br',
      defaultLanguage: 'pt',
      numResults: 20,
      cacheTTL: 21600, // 6 horas
      timeoutMs: 10000, // 10 segundos (SerpApi pode ser mais lenta)
      retryAttempts: 3,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs,
      params: {
        api_key: this.config.apiKey,
        engine: this.config.engine
      }
    });

    this.cache = new CacheManager();
    this.logger = new Logger('SerpApiService');

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
          throw new SerpApiRateLimitError(retryAfter);
        }
        
        // Erro específico da SerpApi (pode vir no corpo da resposta)
        if (error.response?.data && (error.response.data as any).error) {
          throw new SerpApiError(
            (error.response.data as any).error,
            error.response.status,
            (error.config?.params as any)?.q
          );
        }
        
        throw new SerpApiError(
          error.message,
          error.response?.status,
          (error.config?.params as any)?.q
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
      this.logger.debug(`Fetching from SerpApi: ${normalizedQuery}`);
      const result = await this.fetchFromApi(normalizedQuery, options);

      // 3. Salvar no cache se encontrou resultado
      if (result && result.status === 'found') {
        await this.cache.set(cacheKey, result, this.config.cacheTTL);
      } else if (result && result.status === 'not_found') {
        // Cache negativo mais curto (1 hora) para evitar buscas repetidas de produtos inexistentes
        await this.cache.set(cacheKey, result, 3600);
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
      concurrency = 3, // SerpApi recomenda limite menor por API key
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

      // Coletar resultados
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

      // Delay maior entre chunks para rate limiting da SerpApi
      if (chunks.length > 1) {
        await this.sleep(1500); // 1.5 segundos
      }
    }

    return results;
  }

  /**
   * Busca direta da API SerpApi
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
        const response = await this.client.get('', {
          params: {
            q: query,
            gl: options.country || this.config.defaultCountry,
            hl: options.language || this.config.defaultLanguage,
            num: this.config.numResults,
            // Parâmetros específicos SerpApi para melhorar resultados
            device: 'desktop',
            google_domain: 'google.com.br'
          }
        });

        // Verificar se a API retornou erro
        if (response.data.error) {
          throw new SerpApiError(response.data.error, 400, query);
        }

        // Validar resposta com Zod
        const validated = SerpApiResponseSchema.parse(response.data);
        
        return this.processSerpApiResponse(query, validated);
      } catch (error) {
        lastError = error as Error;
        
        // Se for rate limit, esperar mais tempo
        if (error instanceof SerpApiRateLimitError) {
          const waitTime = Math.pow(2, attempt) * 2000; // Exponential backoff maior
          this.logger.warn(`Rate limited, waiting ${waitTime}ms before retry ${attempt}`);
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
   * Foca no bloco immersive_products da SerpApi
   */
  private processSerpApiResponse(
    query: string, 
    response: SerpApiResponse
  ): PriceResult | null {
    // 1. Tentar extrair de immersive_products (principal para shopping)
    const products = response.immersive_products || response.shopping_results || [];
    
    if (!products.length) {
      return {
        productQuery: query,
        normalizedQuery: normalizeQuery(query),
        bestPrice: null,
        bestStore: null,
        productTitle: null,
        productLink: null,
        thumbnail: null,
        rating: null,
        reviews: null,
        status: 'not_found',
        searchedAt: new Date(),
        apiSource: 'serpapi'
      };
    }

    // 2. Filtrar produtos que têm preço extraído
    const productsWithPrice = products.filter(
      p => p.extracted_price !== undefined && p.extracted_price > 0
    );

    if (!productsWithPrice.length) {
      return {
        productQuery: query,
        normalizedQuery: normalizeQuery(query),
        bestPrice: null,
        bestStore: null,
        productTitle: null,
        productLink: null,
        thumbnail: null,
        rating: null,
        reviews: null,
        status: 'not_found',
        searchedAt: new Date(),
        apiSource: 'serpapi'
      };
    }

    // 3. Encontrar o menor preço
    const cheapest = productsWithPrice.reduce(
      (min, current) => (current.extracted_price || 0) < (min.extracted_price || 0) ? current : min
    );

    return {
      productQuery: query,
      normalizedQuery: normalizeQuery(query),
      bestPrice: cheapest.extracted_price || null,
      bestStore: cheapest.source || null,
      productTitle: cheapest.title || null,
      productLink: cheapest.link || null,
      thumbnail: cheapest.thumbnail || null,
      rating: cheapest.rating || null,
      reviews: cheapest.reviews || null,
      status: 'found',
      searchedAt: new Date(),
      apiSource: 'serpapi',
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
      rating: null,
      reviews: null,
      status: 'error',
      searchedAt: new Date(),
      apiSource: 'serpapi'
    };
  }

  /**
   * Utilitários
   */
  private buildCacheKey(query: string, options: any): string {
    return `serpapi:${query}:${options.country || 'br'}:${options.language || 'pt'}`;
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

  /**
   * Estatísticas de uso (para monitoramento)
   */
  async getUsageStats(): Promise<{
    cacheHits: number;
    cacheMisses: number;
    apiCalls: number;
  }> {
    // Implementar se quiser trackear métricas
    return {
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0
    };
  }
}
```

### 3. **Cache Manager (reutilizado da skill anterior)**

```typescript
// backend/src/services/cache/cache.manager.ts
// (mesmo código da skill apiSerperDev)
```

### 4. **Utilitários Adaptados (string-utils.ts)**

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
 * Formata preço para exibição em R$ (BRL)
 */
export function formatPriceBRL(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

/**
 * Extrai domínio de uma URL para exibição
 */
export function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace('www.', '');
  } catch {
    return url;
  }
}
```

### 5. **Testes Unitários (serpapi.service.test.ts)**

```typescript
// backend/tests/services/api/serpapi/serpapi.service.test.ts
import { SerpApiService } from '../../../../src/services/api/serpapi/serpapi.service';
import { CacheManager } from '../../../../src/services/cache/cache.manager';

jest.mock('../../../../src/services/cache/cache.manager');

describe('SerpApiService', () => {
  let service: SerpApiService;
  let mockCache: jest.Mocked<CacheManager>;

  beforeEach(() => {
    mockCache = new CacheManager() as jest.Mocked<CacheManager>;
    service = new SerpApiService();
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

      // Mock da chamada API com estrutura da SerpApi
      const mockApiResponse = {
        data: {
          immersive_products: [
            { 
              title: 'iPhone 13 128GB', 
              extracted_price: 3500, 
              source: 'Magazine Luiza',
              link: 'https://www.magazineluiza.com.br/iphone-13/p'
            },
            { 
              title: 'iPhone 13 128GB', 
              extracted_price: 3699, 
              source: 'Amazon',
              link: 'https://www.amazon.com.br/iphone-13/dp/B09G9D7K6S'
            }
          ]
        }
      };

      (service as any).client.get = jest.fn().mockResolvedValue(mockApiResponse);

      const result = await service.searchProduct('iphone 13');

      expect(result).toBeDefined();
      expect(result?.bestPrice).toBe(3500); // Menor preço
      expect(result?.bestStore).toBe('Magazine Luiza');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockCache.get.mockResolvedValue(null);
      (service as any).client.get = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await service.searchProduct('iphone 13');

      expect(result?.status).toBe('error');
      expect(result?.bestPrice).toBeNull();
    });

    it('should handle empty results', async () => {
      mockCache.get.mockResolvedValue(null);
      
      const mockApiResponse = {
        data: {
          immersive_products: []
        }
      };

      (service as any).client.get = jest.fn().mockResolvedValue(mockApiResponse);

      const result = await service.searchProduct('produto inexistente 12345');

      expect(result?.status).toBe('not_found');
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
          rating: null,
          reviews: null,
          status: 'found',
          searchedAt: new Date(),
          apiSource: 'serpapi'
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

    it('should respect abort signal', async () => {
      const queries = ['iphone', 'samsung', 'xiaomi'];
      const controller = new AbortController();
      
      const mockSearch = jest.spyOn(service, 'searchProduct')
        .mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return null;
        });

      // Cancelar após primeira chamada
      setTimeout(() => controller.abort(), 50);

      await expect(service.searchBatch(queries, { 
        signal: controller.signal 
      })).rejects.toThrow('cancelled');
    });
  });
});
```

### 6. **Configuração de Ambiente (.env.example)**

```env
# backend/.env.example
# SerpApi Configuration
SERPAPI_API_KEY=sua_chave_api_aqui
SERPAPI_ENGINE=google
SERPAPI_DEFAULT_COUNTRY=br
SERPAPI_DEFAULT_LANGUAGE=pt
SERPAPI_NUM_RESULTS=20
SERPAPI_TIMEOUT_MS=10000
SERPAPI_RETRY_ATTEMPTS=3

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
import { SerpApiService } from './api/serpapi/serpapi.service';

export class BatchProcessor {
  private serpapiService: SerpApiService;
  
  constructor() {
    this.serpapiService = new SerpApiService({
      // Configurações específicas se necessário
      numResults: 10, // Buscar apenas 10 resultados por produto
      retryAttempts: 2
    });
  }

  async processList(listId: string, items: string[]): Promise<void> {
    const startTime = Date.now();
    this.logger.info(`Starting batch processing for list ${listId} with ${items.length} items`);

    try {
      // Buscar em batch com progresso
      const results = await this.serpapiService.searchBatch(items, {
        concurrency: 3, // Controlado para não exceder rate limit
        onProgress: (progress) => {
          // Atualizar progresso no banco
          this.updateProgress(listId, progress);
          
          // Emitir via WebSocket se tiver
          this.emitProgress(listId, progress);
        }
      });

      // Calcular estatísticas
      const foundCount = results.filter(r => r.status === 'found').length;
      const notFoundCount = results.filter(r => r.status === 'not_found').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      this.logger.info(`Batch completed for list ${listId}: ${foundCount} found, ${notFoundCount} not found, ${errorCount} errors in ${Date.now() - startTime}ms`);

      // Salvar resultados no PostgreSQL
      await this.saveResults(listId, results);
      
      // Atualizar status da lista
      await this.updateListStatus(listId, 'completed', {
        foundCount,
        notFoundCount,
        errorCount,
        processingTimeMs: Date.now() - startTime
      });
    } catch (error) {
      this.logger.error(`Batch processing failed for list ${listId}:`, error);
      await this.updateListStatus(listId, 'failed');
      throw error;
    }
  }

  private async updateProgress(listId: string, progress: number): Promise<void> {
    // Implementar atualização no banco
    // Pode usar SSE ou WebSocket para notificar o frontend
  }

  private async saveResults(listId: string, results: PriceResult[]): Promise<void> {
    // Implementar save no PostgreSQL
    // Usar batch insert para performance
  }
}
```

### Controller de Busca

```typescript
// backend/src/controllers/search.controller.ts
import { SerpApiService } from '../services/api/serpapi/serpapi.service';
import { ListRepository } from '../repositories/list.repository';

export class SearchController {
  private serpapiService: SerpApiService;
  private listRepository: ListRepository;

  constructor() {
    this.serpapiService = new SerpApiService();
    this.listRepository = new ListRepository();
  }

  /**
   * Inicia busca em lote para uma lista
   * POST /api/v1/search/batch
   */
  async batchSearch(req: Request, res: Response) {
    const { listId } = req.body;
    
    if (!listId) {
      return res.status(400).json({ error: 'listId is required' });
    }

    try {
      // Buscar itens da lista no banco
      const list = await this.listRepository.findById(listId);
      if (!list) {
        return res.status(404).json({ error: 'List not found' });
      }

      const items = list.items.map((item: any) => item.original_query);
      
      // Criar job ID
      const jobId = `job_${Date.now()}_${listId}`;
      
      // Armazenar job em memória ou Redis para acompanhamento
      this.jobs.set(jobId, {
        id: jobId,
        listId,
        status: 'processing',
        progress: 0,
        createdAt: new Date()
      });

      // Processar em background (não bloquear response)
      setImmediate(async () => {
        try {
          const results = await this.serpapiService.searchBatch(items, {
            concurrency: 3,
            onProgress: (progress) => {
              // Atualizar progresso do job
              const job = this.jobs.get(jobId);
              if (job) {
                job.progress = progress;
              }
              
              // Emitir via SSE se configurado
              this.emitProgress(jobId, progress);
            }
          });
          
          await this.listRepository.saveResults(listId, results);
          
          // Atualizar job como concluído
          const job = this.jobs.get(jobId);
          if (job) {
            job.status = 'completed';
            job.progress = 100;
            job.completedAt = new Date();
          }
        } catch (error) {
          console.error('Batch processing failed:', error);
          
          const job = this.jobs.get(jobId);
          if (job) {
            job.status = 'failed';
            job.error = error.message;
          }
        }
      });

      res.json({ 
        jobId, 
        status: 'processing',
        listId,
        estimatedTimeSeconds: items.length * 2 // Estimativa otimista
      });
    } catch (error) {
      console.error('Error starting batch search:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Verifica status de um job
   * GET /api/v1/search/status/:jobId
   */
  async getJobStatus(req: Request, res: Response) {
    const { jobId } = req.params;
    
    const job = this.jobs.get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      listId: job.listId,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      error: job.error
    });
  }

  // Armazenamento simples de jobs (em produção, usar Redis)
  private jobs = new Map();
}
```

---

## 📊 **MÉTRICAS E MONITORAMENTO**

### Health Check Endpoint

```typescript
// backend/src/routes/health.routes.ts
router.get('/health/serpapi', async (req, res) => {
  try {
    const service = new SerpApiService();
    
    // Teste simples com cache bypass
    const result = await service.searchProduct('teste', { forceRefresh: true });
    
    // Verificar conexão com Redis
    const cacheHealthy = await service['cache'].healthCheck();
    
    res.json({
      status: 'healthy',
      apiKey: !!process.env.SERPAPI_API_KEY,
      apiResponded: !!result,
      cacheConnected: cacheHealthy,
      timestamp: new Date().toISOString(),
      config: {
        country: service['config'].defaultCountry,
        language: service['config'].defaultLanguage,
        timeout: service['config'].timeoutMs
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Métricas de Uso

```typescript
// backend/src/services/metrics.service.ts
export class MetricsService {
  private metrics: {
    totalSearches: number;
    cacheHits: number;
    apiCalls: number;
    errors: number;
    avgResponseTime: number;
  } = {
    totalSearches: 0,
    cacheHits: 0,
    apiCalls: 0,
    errors: 0,
    avgResponseTime: 0
  };

  trackSearch(query: string, found: boolean, cached: boolean, responseTimeMs: number): void {
    this.metrics.totalSearches++;
    
    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.apiCalls++;
    }
    
    if (!found) {
      // Produto não encontrado
    }
    
    // Média móvel do tempo de resposta
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.totalSearches - 1) + responseTimeMs) 
      / this.metrics.totalSearches;
  }

  trackError(error: any): void {
    this.metrics.errors++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.totalSearches > 0 
        ? (this.metrics.cacheHits / this.metrics.totalSearches) * 100 
        : 0,
      timestamp: new Date().toISOString()
    };
  }
}
```

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

- [ ] **Conta e API Key**
  - [ ] Criar conta em [serpapi.com](https://serpapi.com)
  - [ ] Obter API key no dashboard
  - [ ] Adicionar `SERPAPI_API_KEY` ao `.env`

- [ ] **Dependências**
  ```bash
  cd backend
  npm install axios zod ioredis
  npm install -D @types/node @types/axios
  ```

- [ ] **Arquivos da Skill**
  - [ ] Criar pasta `src/services/api/serpapi/`
  - [ ] Copiar `types.ts`
  - [ ] Copiar `serpapi.service.ts`
  - [ ] Copiar `cache.manager.ts` (ou reutilizar existente)
  - [ ] Atualizar `string-utils.ts` se necessário

- [ ] **Redis**
  - [ ] Verificar se Redis está rodando: `docker ps | grep redis`
  - [ ] Ou iniciar com docker-compose do PRD original

- [ ] **Testes**
  - [ ] Executar testes unitários: `npm test serpapi.service`
  - [ ] Testar busca única manualmente
  - [ ] Testar batch com 5 produtos
  - [ ] Testar cache (segunda busca deve ser mais rápida)

- [ ] **Integração com o Sistema**
  - [ ] Conectar com o `BatchProcessor`
  - [ ] Implementar endpoints de status
  - [ ] Adicionar health check
  - [ ] Configurar logging

- [ ] **Otimizações Finais**
  - [ ] Ajustar `concurrency` baseado no plano SerpApi
  - [ ] Implementar cache negativo para produtos não encontrados