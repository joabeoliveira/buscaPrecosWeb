import axios from 'axios';
import { normalizeQuery } from '../../utils/helpers.js';
import { cacheService } from '../cache/RedisCacheService.js';

export interface ProductResult {
  title: string;
  price: number;
  source: string;
  link: string | null;
  thumbnail: string | null;
  description: string | null;
}

export interface PriceResult {
  status: 'found' | 'not_found' | 'error' | 'pending';
  results: ProductResult[];
  searchedAt: Date;
}

export class SerperService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://google.serper.dev/shopping';

  constructor() {
    this.apiKey = process.env.SERPER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[Serper] WARNING: SERPER_API_KEY is not set! Searches will fail.');
    }
  }

  async searchProduct(query: string, options: { forceRefresh?: boolean } = {}): Promise<PriceResult> {
    const normalized = normalizeQuery(query);
    const cacheKey = `search:v2:${normalized}:serper`;

    if (!options.forceRefresh) {
      try {
        const cached = await cacheService.get<PriceResult>(cacheKey);
        if (cached) {
          console.log(`[Serper] Cache hit for: ${query}`);
          return { ...cached, searchedAt: new Date(cached.searchedAt) };
        }
      } catch {
        // Cache miss
      }
    }

    if (!this.apiKey) {
      console.error(`[Serper] No API key configured.`);
      return this.errorResult();
    }

    try {
      // Refine query for technical precision
      const terms = query.split(/\s+/);
      const refinedQ = terms.map(t => {
        // Quote terms that look like technical specs (dimensions, models, or alphanumeric codes)
        // Match: 580mm, 12,6mm, G10, 4.8x380, etc.
        if (t.length >= 3 && (/\d+(mm|cm|m|pol|x|v|w|ah|g|kg|l)/i.test(t) || (/\d/.test(t) && /[a-z]/i.test(t)))) {
          return `"${t}"`;
        }
        return t;
      }).join(' ');

      console.log(`[Serper] Searching for: "${query}" (Refined: "${refinedQ}")`);
      const response = await axios.post(
        this.baseUrl,
        {
          q: refinedQ,
          gl: 'br',
          hl: 'pt-br',
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const shoppingResults = response.data?.shopping || response.data?.shopping_results || [];

      if (!shoppingResults || shoppingResults.length === 0) {
        return {
          status: 'not_found',
          results: [],
          searchedAt: new Date(),
        };
      }

      // Parse all valid results
      const results: ProductResult[] = shoppingResults
        .map((item: any) => {
          let numericPrice: number | null = null;

          if (typeof item.price === 'number') {
            numericPrice = item.price;
          } else if (typeof item.price === 'string') {
            const cleaned = item.price
              .replace(/[R$\s]/g, '')
              .replace(/\./g, '')
              .replace(',', '.');
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed)) numericPrice = parsed;
          }

          return {
            title: item.title || 'Sem título',
            price: numericPrice,
            source: item.source || item.seller || 'Loja desconhecida',
            link: item.link || null,
            thumbnail: item.imageUrl || item.thumbnail || null,
            description: item.snippet || item.description || null,
          };
        })
        .filter((item: any) => item.price !== null && item.price > 0)
        .sort((a: any, b: any) => a.price - b.price);

      if (results.length === 0) {
        return {
          status: 'not_found',
          results: [],
          searchedAt: new Date(),
        };
      }

      const result: PriceResult = {
        status: 'found',
        results,
        searchedAt: new Date(),
      };

      try {
        await cacheService.set(cacheKey, result);
      } catch {
        // Ignore cache errors
      }

      return result;
    } catch (error: any) {
      console.error(`[Serper] Error searching for "${query}":`, error.message);
      return this.errorResult();
    }
  }

  private errorResult(): PriceResult {
    return {
      status: 'error',
      results: [],
      searchedAt: new Date(),
    };
  }
}
