import axios from 'axios';
import { normalizeQuery } from '../../lib/helpers';
import { cacheService } from '@/services/cache/RedisCacheService';
import type { ProductResult, PriceResult } from '@/types/api';
import { PriceProvider } from './PriceProvider';

export class MercadoLivreProvider implements PriceProvider {
  name = 'mercadolivre';
  private readonly baseUrl = 'https://api.mercadolibre.com/sites/MLB/search';

  isAvailable(): boolean {
    return true; // MLB public API is always available without key
  }

  async searchProduct(query: string, options: { forceRefresh?: boolean } = {}): Promise<PriceResult> {
    const normalized = normalizeQuery(query);
    const cacheKey = `search:v2:${normalized}:meli`;

    if (!options.forceRefresh) {
      try {
        const cached = await cacheService.get<PriceResult>(cacheKey);
        if (cached) {
          console.log(`[MercadoLivreProvider] Cache hit for: ${query}`);
          return { ...cached, searchedAt: new Date(cached.searchedAt) };
        }
      } catch {
        // Cache miss
      }
    }

    try {
      console.log(`[MercadoLivreProvider] Searching for: "${query}"`);
      const response = await axios.get(this.baseUrl, {
        params: {
          q: query,
          limit: 15,
          condition: 'new'
        },
        timeout: 10000,
      });

      const shoppingResults = response.data?.results || [];

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
          return {
            title: item.title || 'Sem título',
            price: item.price,
            source: 'Mercado Livre',
            link: item.permalink || null,
            thumbnail: item.thumbnail ? item.thumbnail.replace('http:', 'https:') : null,
            description: null,
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
      console.error(`[MercadoLivreProvider] Error searching for "${query}":`, error.message);
      return {
        status: 'error',
        results: [],
        searchedAt: new Date(),
      };
    }
  }
}
