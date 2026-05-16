import { PriceResult } from '@/types/api';

export interface PriceProvider {
  name: string;
  searchProduct(query: string, options?: { forceRefresh?: boolean, listId?: string, supplier?: { id: string; name: string; url: string; category: string } | null }): Promise<PriceResult>;
  isAvailable(): boolean;
}
