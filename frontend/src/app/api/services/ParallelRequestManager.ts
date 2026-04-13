import pLimit from 'p-limit';
import type { PriceResult } from '@/types/api';
import { sleep } from '../lib/helpers';

export class ParallelRequestManager {
  private limit;
  private readonly itemTimeoutMs: number;

  constructor(concurrency: number = 5, itemTimeoutMs: number = 30000) {
    this.limit = pLimit(concurrency);
    this.itemTimeoutMs = itemTimeoutMs;
  }

  private async withTimeout(query: string, promise: Promise<PriceResult>): Promise<PriceResult> {
    let timeoutHandle: NodeJS.Timeout | null = null;

    try {
      const timeoutPromise = new Promise<PriceResult>((resolve) => {
        timeoutHandle = setTimeout(() => {
          console.warn(`[Batch] Timeout processing item "${query}" after ${this.itemTimeoutMs}ms`);
          resolve({
            status: 'error',
            results: [],
            searchedAt: new Date(),
          });
        }, this.itemTimeoutMs);
      });

      return await Promise.race([promise, timeoutPromise]);
    } catch (error: any) {
      console.error(`[Batch] Unexpected error processing item "${query}":`, error?.message || error);
      return {
        status: 'error',
        results: [],
        searchedAt: new Date(),
      };
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
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

        const result = await this.withTimeout(query, searchFn(query));

        if (onItemProcessed) {
          try {
            await onItemProcessed(query, result);
          } catch (error: any) {
            console.error(`[Batch] onItemProcessed failed for "${query}":`, error?.message || error);
          }
        }

        return result;
      });
    });

    return await Promise.all(tasks);
  }
}
