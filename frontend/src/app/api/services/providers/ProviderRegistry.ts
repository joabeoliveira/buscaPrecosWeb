import { PriceProvider } from './PriceProvider';
import { PriceResult } from '@/types/api';
import { TextMatcher } from '../../lib/TextMatcher';

export class ProviderRegistry {
  private providers: PriceProvider[] = [];

  register(provider: PriceProvider) {
    this.providers.push(provider);
  }

  async searchProduct(query: string, options?: { forceRefresh?: boolean, activeProviders?: string[], targetPartners?: string[], listId?: string }): Promise<PriceResult> {
    
    // Sort and filter providers based on activeProviders preference if provided
    let providersToRun = this.providers;
    
    if (options?.activeProviders && options.activeProviders.length > 0) {
      providersToRun = [];
      for (const providerName of options.activeProviders) {
        const found = this.providers.find(p => p.name === providerName);
        if (found) {
          providersToRun.push(found);
        }
      }
    } else {
      // Default to SerperProvider if nothing is passed, to maintain backward compatibility
      providersToRun = this.providers.filter(p => p.name === 'serper');
      if (providersToRun.length === 0) {
         providersToRun = this.providers; // Fallback to all if serper is not registered
      }
    }

    console.log(`[ProviderRegistry] Starting search for "${query}" using cascade: ${providersToRun.map(p => p.name).join(' -> ')}`);

    for (const provider of providersToRun) {
      if (!provider.isAvailable()) {
         console.log(`[ProviderRegistry] Provider ${provider.name} is unavailable. Skipping...`);
         continue;
      }

      const result = await provider.searchProduct(query, options);
      if (result.status === 'found' && result.results.length > 0) {
        
        // Phase 6: Advanced Text Matching Filter
        const filteredResults = TextMatcher.filterBySimilarity(query, result.results, 0.15);
        
        if (filteredResults.length > 0) {
          console.log(`[ProviderRegistry] Results found and verified via ${provider.name}. Aborting fallback (Cost saving achieved).`);
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
