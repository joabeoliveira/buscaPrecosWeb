import { SerperService } from './SerperService';
import { ParallelRequestManager } from './ParallelRequestManager';
import { ListRepository } from '../repositories/ListRepository';
import { JobRepository } from '../repositories/JobRepository';

export class BatchProcessor {
  private serperService: SerperService;
  private listRepository: ListRepository;
  private jobRepository: JobRepository;
  private requestManager: ParallelRequestManager;

  constructor() {
    this.serperService = new SerperService();
    this.listRepository = new ListRepository();
    this.jobRepository = new JobRepository();
    this.requestManager = new ParallelRequestManager(3); // 3 concurrent to be safer
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
          try {
            // Update database for this specific item with ALL results
            await this.listRepository.updateItemResult(listId, query, {
              status: result.status,
              results: result.results,
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
