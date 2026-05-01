import { Worker, Job } from 'bullmq';
import { connection } from './connection';
import { SEARCH_QUEUE_NAME, SearchJobData } from './SearchQueue';
import { SerperService } from '../SerperService';
import { ParallelRequestManager } from '../ParallelRequestManager';
import { ListRepository } from '../../repositories/ListRepository';
import { JobRepository } from '../../repositories/JobRepository';
import { CanonicalProductRepository } from '../../repositories/CanonicalProductRepository';
import { PriceHistoryRepository } from '../../repositories/PriceHistoryRepository';
import { ScoreEngine } from '../ScoreEngine';

// Helpers
function normalizeQuery(query: string): string {
  return query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Instantiate singletons for the worker
const serperService = new SerperService();
const listRepository = new ListRepository();
const jobRepository = new JobRepository();
const requestManager = new ParallelRequestManager(3);
const canonicalProductRepo = new CanonicalProductRepository();
const priceHistoryRepo = new PriceHistoryRepository();

export const searchWorker = new Worker<SearchJobData>(
  SEARCH_QUEUE_NAME,
  async (job: Job<SearchJobData>) => {
    const { jobId, listId, items } = job.data;
    
    console.log(`[SearchWorker] 🚀 Started processing job ${jobId} for list ${listId}`);
    
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    try {
      await requestManager.processBatch(
        items,
        (query) => serperService.searchProduct(query),
        async (query, result) => {
          let canonicalProductId: string | undefined;

          if (result.status === 'found') {
            try {
              const normalized = normalizeQuery(query);
              const canonical = await canonicalProductRepo.getOrCreate(normalized);
              canonicalProductId = canonical.id;

              for (const offer of result.results) {
                await priceHistoryRepo.addRecord({
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
              console.error(`[SearchWorker] ⚠️ Error handling canonical/history for "${query}":`, err.message);
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
                stats = await priceHistoryRepo.getStats(canonicalProductId);
              }
              
              const scoreResult = ScoreEngine.calculateScore(bestOffer, stats);
              offerScoreValue = scoreResult.score;
              opportunityFlags = scoreResult.flags;

              if (offerScoreValue >= 100) {
                autoSelected = true;
              }
            }

            await listRepository.updateItemResult(listId, query, {
              status: result.status,
              results: result.results,
              canonical_product_id: canonicalProductId,
              auto_selected: autoSelected,
              offer_score: offerScoreValue,
              opportunity_flags: opportunityFlags
            });
          } catch (dbErr: any) {
            console.error(`[SearchWorker] ⚠️ DB update failed for "${query}":`, dbErr.message);
          }

          processedCount++;
          if (result.status === 'found') successCount++;
          if (result.status === 'error') errorCount++;

          console.log(`[SearchWorker] [${processedCount}/${items.length}] "${query}" → ${result.status}`);

          try {
            await jobRepository.updateProgress(jobId, processedCount, items.length);
          } catch (progressErr: any) {
            console.error(`[SearchWorker] ⚠️ Progress update failed:`, progressErr.message);
          }
        }
      );

      console.log(`[SearchWorker] ✅ Job ${jobId} completed. Success: ${successCount}, Errors: ${errorCount}, Total: ${items.length}`);

      try {
        await priceHistoryRepo.refreshStats();
        console.log(`[SearchWorker] 📊 Price stats view refreshed`);
      } catch (err: any) {
        console.error(`[SearchWorker] ⚠️ Failed to refresh stats view:`, err.message);
      }

      if (errorCount === items.length) {
        await jobRepository.fail(jobId, 'Todas as buscas falharam. Verifique a chave da API Serper.');
      }
    } catch (error: any) {
      console.error(`[SearchWorker] ❌ Job ${jobId} FAILED:`, error.message);
      await jobRepository.fail(jobId, error.message);
      throw error; // Rethrow so BullMQ knows it failed
    }
  },
  { connection, concurrency: 1, autorun: false } // We shouldn't autorun the worker in Next.js API processes normally, but we will make a standalone entry point.
);

searchWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`[SearchWorker] Job ${job.id} failed with error: ${err.message}`);
  }
});
