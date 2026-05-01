import axios from 'axios';
import { normalizeQuery } from '../../lib/helpers';
import { cacheService } from '@/services/cache/RedisCacheService';
import type { ProductResult, PriceResult } from '@/types/api';
import { PriceProvider } from './PriceProvider';

export class N8nScraperProvider implements PriceProvider {
  name = 'n8n_scraper';
  private readonly webhookUrl = process.env.N8N_SCRAPER_WEBHOOK_URL || 'https://n8n.gptgov.com.br/webhook/infore-busca-parceiros';

  isAvailable(): boolean {
    return !!this.webhookUrl;
  }

  async searchProduct(query: string, options: { forceRefresh?: boolean, listId?: string, targetPartners?: string[] } = {}): Promise<PriceResult> {
    const normalized = normalizeQuery(query);
    const partnersKey = (options.targetPartners || []).sort().join(',');
    const cacheKey = `search:v3:${normalized}:n8n:${partnersKey}`;

    if (!options.forceRefresh) {
      try {
        const cached = await cacheService.get<PriceResult>(cacheKey);
        if (cached) {
          console.log(`[N8nScraperProvider] Cache hit for: ${query}`);
          return { ...cached, searchedAt: new Date(cached.searchedAt) };
        }
      } catch {
        // Cache miss
      }
    }

    try {
      const targetPartners = options.targetPartners && options.targetPartners.length > 0
        ? options.targetPartners
        : ['todos']; // se nenhum parceiro selecionado, passa 'todos' para o n8n decidir

      console.log(`[N8nScraperProvider] Triggering webhook for: "${query}" | Partners: ${targetPartners.join(', ')}`);
      const response = await axios.post(
        this.webhookUrl,
        {
          query: query,
          listId: options.listId || null,
          targetPartners: targetPartners,
        },
        {
          timeout: 25000,
        }
      );

      // We expect the n8n webhook to return a JSON array of items or an object with 'results'
      const data = response.data;
      const shoppingResults = Array.isArray(data) ? data : (data?.results || []);

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
          // Robust price parsing in case n8n sends raw strings or numbers
          let numericPrice: number | null = null;
          if (typeof item.price === 'number') {
            numericPrice = item.price;
          } else if (typeof item.price === 'string') {
            const cleaned = item.price.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed)) numericPrice = parsed;
          }

          return {
            title: item.title || 'Sem título',
            price: numericPrice,
            source: item.source || item.seller || 'Fornecedor Parceiro',
            link: item.link || null,
            thumbnail: item.thumbnail || item.imageUrl || null,
            description: item.description || null,
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
      console.error(`[N8nScraperProvider] Error scraping via n8n for "${query}":`, error.message);
      return {
        status: 'error',
        results: [],
        searchedAt: new Date(),
      };
    }
  }
}
