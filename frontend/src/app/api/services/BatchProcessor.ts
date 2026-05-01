import { SerperService } from './SerperService';
import { ParallelRequestManager } from './ParallelRequestManager';
import { ListRepository } from '../repositories/ListRepository';
import { JobRepository } from '../repositories/JobRepository';
import { CanonicalProductRepository } from '../repositories/CanonicalProductRepository';
import { PriceHistoryRepository } from '../repositories/PriceHistoryRepository';
import { ScoreEngine } from './ScoreEngine';

// Local helper to replace helpers.js until moved
function normalizeQuery(query: string): string {
  return query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export class BatchProcessor {
  private serperService: SerperService;
  private listRepository: ListRepository;
  private jobRepository: JobRepository;
  private requestManager: ParallelRequestManager;
  private canonicalProductRepo: CanonicalProductRepository;
  private priceHistoryRepo: PriceHistoryRepository;

  constructor() {
    this.serperService = new SerperService();
    this.listRepository = new ListRepository();
    this.jobRepository = new JobRepository();
    this.requestManager = new ParallelRequestManager(3); // 3 concurrent to be safer
    this.canonicalProductRepo = new CanonicalProductRepository();
    this.priceHistoryRepo = new PriceHistoryRepository();
  }

  async startJob(listId: string, itemId?: string): Promise<{ jobId: string, processFunction: () => Promise<void> }> {
    const items = itemId 
      ? await this.listRepository.getItemById(itemId)
      : await this.listRepository.getItems(listId);
      
    const itemsList = Array.isArray(items) ? items : [items];

    if (!itemsList || itemsList.length === 0) {
      throw new Error('No items to process');
    }

    console.log(`[BatchProcessor] Starting job for list ${listId} (Individual: ${!!itemId}) with ${itemsList.length} items`);
    const jobId = await this.jobRepository.create(listId, itemsList.length);

    // Instead of firing and forgetting internally which breaks Serverless,
    // we return the function so the API route can use Next.js `after()` or `await`
    const processFunction = async () => {
      try {
        await this.process(jobId, listId, itemsList);
      } catch (err) {
        console.error(`[BatchProcessor] Unhandled error in job ${jobId}:`, err);
      }
    };

    return { jobId, processFunction };
  }

  private async process(jobId: string, listId: string, items: string[]) {
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    console.log(`[BatchProcessor] Processing job ${jobId}...`);

    try {
      await this.requestManager.processBatch(
        items,
        (query) => this.serperService.searchProduct(query),
        async (query, result) => {
          let canonicalProductId: string | undefined;

          if (result.status === 'found') {
            try {
              const normalized = normalizeQuery(query);
              const canonical = await this.canonicalProductRepo.getOrCreate(normalized);
              canonicalProductId = canonical.id;

              for (const offer of result.results) {
                await this.priceHistoryRepo.addRecord({
                  canonical_product_id: canonicalProductId,
                  price: offer.price,
                  store: offer.source,
                  product_title: offer.title,
                  product_link: offer.link || '',
                  source: 'serper',
                  shopping_list_id: listId
                });
              }
            } catch (err: any) {
              console.error(`[BatchProcessor] Error handling canonical/history for "${query}":`, err.message);
            }
          }

          try {
            let offerScoreValue: number | undefined;
            let opportunityFlags: string[] | undefined;
            let autoSelected = false;

            if (result.results.length > 0) {
              const bestOffer = result.results[0]!;
              let stats = null;
              
              if (canonicalProductId) {
                stats = await this.priceHistoryRepo.getStats(canonicalProductId);
              }
              
              const scoreResult = ScoreEngine.calculateScore(bestOffer, stats);
              offerScoreValue = scoreResult.score;
              opportunityFlags = scoreResult.flags;

              if (offerScoreValue >= 100) {
                autoSelected = true;
              }
            }

            await this.listRepository.updateItemResult(listId, query, {
              status: result.status,
              results: result.results,
              canonical_product_id: canonicalProductId,
              auto_selected: autoSelected,
              offer_score: offerScoreValue,
              opportunity_flags: opportunityFlags
            });
          } catch (dbErr: any) {
            console.error(`[BatchProcessor] DB update failed for "${query}":`, dbErr.message);
          }

          processedCount++;
          if (result.status === 'found') successCount++;
          if (result.status === 'error') errorCount++;

          console.log(`[BatchProcessor] [${processedCount}/${items.length}] "${query}" → ${result.status}${result.results.length > 0 ? ` (Found ${result.results.length} options)` : ''}`);

          try {
            await this.jobRepository.updateProgress(jobId, processedCount, items.length);
          } catch (progressErr: any) {
            console.error(`[BatchProcessor] Progress update failed:`, progressErr.message);
          }
        }
      );

      console.log(`[BatchProcessor] Job ${jobId} completed. Success: ${successCount}, Errors: ${errorCount}, Total: ${items.length}`);

      try {
        await this.priceHistoryRepo.refreshStats();
        console.log(`[BatchProcessor] Price stats view refreshed`);
      } catch (err: any) {
        console.error(`[BatchProcessor] Failed to refresh stats view:`, err.message);
      }

      if (errorCount === items.length) {
        await this.jobRepository.fail(jobId, 'Todas as buscas falharam. Verifique a chave da API Serper.');
      }
    } catch (error: any) {
      console.error(`[BatchProcessor] Job ${jobId} FAILED:`, error.message);
      await this.jobRepository.fail(jobId, error.message);
    }
  }
}
