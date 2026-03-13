import pLimit from 'p-limit';
import type { PriceResult } from './api/SerperService.js';
import { sleep } from '../utils/helpers.js';

export class ParallelRequestManager {
  private limit;

  constructor(concurrency: number = 5) {
    this.limit = pLimit(concurrency);
  }

  async processBatch(
    items: string[],
    searchFn: (item: string) => Promise<PriceResult>,
    onItemProcessed?: (query: string, result: PriceResult) => Promise<void>
  ): Promise<PriceResult[]> {
    const tasks = items.map((query, index) => {
      return this.limit(async () => {
        // Delay to avoid aggressive bursts and respect rate limits
        if (index > 0) await sleep(500);
        
        const result = await searchFn(query);
        
        if (onItemProcessed) {
          await onItemProcessed(query, result);
        }
        
        return result;
      });
    });

    return await Promise.all(tasks);
  }
}
