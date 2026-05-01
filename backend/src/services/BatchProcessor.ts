import { SerperService } from './api/SerperService.js';
import { ParallelRequestManager } from './ParallelRequestManager.js';
import { ListRepository } from '../repositories/ListRepository.js';
import { JobRepository } from '../repositories/JobRepository.js';
import { CanonicalProductRepository } from '../repositories/CanonicalProductRepository.js';
import { PriceHistoryRepository } from '../repositories/PriceHistoryRepository.js';
import { normalizeQuery } from '../utils/helpers.js';
import { ScoreEngine } from './ScoreEngine.js';

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

  async startJob(listId: string, itemId?: string): Promise<string> {
    const items = itemId 
      ? await this.listRepository.getItemById(itemId) // We'll need this method
      : await this.listRepository.getItems(listId);
      
    const itemsList = Array.isArray(items) ? items : [items];

    if (!itemsList || itemsList.length === 0) {
      throw new Error('No items to process');
    }

    console.log(`[BatchProcessor] Starting job for list ${listId} (Individual: ${!!itemId}) with ${itemsList.length} items`);
    const jobId = await this.jobRepository.create(listId, itemsList.length);

    // Process in background
    setImmediate(() => {
      this.process(jobId, listId, itemsList).catch((err) => {
        console.error(`[BatchProcessor] Unhandled error in job ${jobId}:`, err);
      });
    });

    return jobId;
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
              // 1. Get or Create Canonical Product
              const normalized = normalizeQuery(query);
              const canonical = await this.canonicalProductRepo.getOrCreate(normalized);
              canonicalProductId = canonical.id;

              // 2. Save Price History for all found offers
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
              // 3. Calculate Score and Auto-Select
              let offerScoreValue: number | undefined;
              let opportunityFlags: string[] | undefined;
              let autoSelected = false;

              if (result.results.length > 0) {
                const bestOffer = result.results[0]!; // Currently assumes first is best (cheapest)
                let stats = null;
                
                if (canonicalProductId) {
                  stats = await this.priceHistoryRepo.getStats(canonicalProductId);
                }
                
                const scoreResult = ScoreEngine.calculateScore(bestOffer, stats);
                offerScoreValue = scoreResult.score;
                opportunityFlags = scoreResult.flags;

                // Auto-select if score is good enough (e.g., >= 100)
                if (offerScoreValue >= 100) {
                  autoSelected = true;
                }
              }

              // Update database for this specific item with ALL results, canonical ID, and score
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

          // Update progress every item
          try {
            await this.jobRepository.updateProgress(jobId, processedCount, items.length);
          } catch (progressErr: any) {
            console.error(`[BatchProcessor] Progress update failed:`, progressErr.message);
          }
        }
      );

      console.log(`[BatchProcessor] Job ${jobId} completed. Success: ${successCount}, Errors: ${errorCount}, Total: ${items.length}`);

      // Refresh materialized stats view after batch completes
      try {
        await this.priceHistoryRepo.refreshStats();
        console.log(`[BatchProcessor] Price stats view refreshed`);
      } catch (err: any) {
        console.error(`[BatchProcessor] Failed to refresh stats view:`, err.message);
      }

      // If ALL items errored, mark the job as failed
      if (errorCount === items.length) {
        await this.jobRepository.fail(jobId, 'Todas as buscas falharam. Verifique a chave da API Serper.');
      }
    } catch (error: any) {
      console.error(`[BatchProcessor] Job ${jobId} FAILED:`, error.message);
      await this.jobRepository.fail(jobId, error.message);
    }
  }
}
