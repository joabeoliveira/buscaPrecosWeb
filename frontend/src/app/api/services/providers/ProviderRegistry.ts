import { PriceProvider } from './PriceProvider';
import { PriceResult } from '@/types/api';

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
        return result;
      }
      // If error or not found, try the next provider (fallback mechanism)
      console.log(`[ProviderRegistry] Provider ${provider.name} returned ${result.status}. Trying next fallback...`);
    }

    return { status: 'error', results: [], searchedAt: new Date() };
  }
}
