import { PriceResult } from '@/types/api';

export interface PriceProvider {
  name: string;
  searchProduct(query: string, options?: { forceRefresh?: boolean, listId?: string, targetPartners?: string[] }): Promise<PriceResult>;
  isAvailable(): boolean;
}
