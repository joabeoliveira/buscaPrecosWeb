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

    console.log(`[BatchProcessor] Enqueueing job for list ${listId} (Individual: ${!!itemId}) with ${itemsList.length} items to BullMQ`);
    const jobId = await this.jobRepository.create(listId, itemsList.length);

    // Enqueue to BullMQ
    const { enqueueSearchJob } = await import('./queue/SearchQueue');
    await enqueueSearchJob({
      jobId,
      listId,
      items: itemsList
    });

    // Provide a dummy processFunction for backwards compatibility with the route
    const processFunction = async () => {
      console.log(`[BatchProcessor] Job ${jobId} offloaded to BullMQ worker.`);
    };

    return { jobId, processFunction };
  }
}
