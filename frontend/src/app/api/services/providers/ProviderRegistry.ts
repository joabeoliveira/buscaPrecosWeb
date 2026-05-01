import { PriceProvider } from './PriceProvider';
import { PriceResult } from '@/types/api';
import { TextMatcher } from '../../lib/TextMatcher';

export class ProviderRegistry {
  private providers: PriceProvider[] = [];

  register(provider: PriceProvider) {
    this.providers.push(provider);
  }

  async searchProduct(query: string, options?: { forceRefresh?: boolean }): Promise<PriceResult> {
    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;

      const result = await provider.searchProduct(query, options);
      if (result.status === 'found' && result.results.length > 0) {
        
        // Phase 6: Advanced Text Matching Filter
        const filteredResults = TextMatcher.filterBySimilarity(query, result.results, 0.15);
        
        if (filteredResults.length > 0) {
          return {
            ...result,
            results: filteredResults
          };
        } else {
          console.log(`[ProviderRegistry] Provider ${provider.name} found results, but all were filtered out by Jaccard Similarity for query: "${query}"`);
        }
      }
      
      // If error, not found, or entirely filtered, try the next provider (fallback mechanism)
      console.log(`[ProviderRegistry] Provider ${provider.name} returned insufficient matches. Trying next fallback...`);
    }

    return { status: 'error', results: [], searchedAt: new Date() };
  }
}
