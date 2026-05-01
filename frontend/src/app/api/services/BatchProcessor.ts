import { ListRepository } from '../repositories/ListRepository';
import { JobRepository } from '../repositories/JobRepository';

// Local helper to replace helpers.js until moved
function normalizeQuery(query: string): string {
  return query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export class BatchProcessor {
  private listRepository: ListRepository;
  private jobRepository: JobRepository;

  constructor() {
    this.listRepository = new ListRepository();
    this.jobRepository = new JobRepository();
  }

  async startJob(listId: string, itemId?: string, providers?: string[], supplierId?: string): Promise<{ jobId: string, processFunction: () => Promise<void> }> {
    const items = itemId 
      ? await this.listRepository.getItemById(itemId)
      : await this.listRepository.getItems(listId);
      
    const itemsList = Array.isArray(items) ? items : [items];

    if (!itemsList || itemsList.length === 0) {
      throw new Error('No items to process');
    }

    console.log(`[BatchProcessor] Enqueueing job for list ${listId} (Individual: ${!!itemId}) with ${itemsList.length} items to BullMQ. Providers: ${providers?.join(', ') || 'default'}${supplierId ? ` | Supplier: ${supplierId}` : ''}`);
    const jobId = await this.jobRepository.create(listId, itemsList.length);

    // Enqueue to BullMQ
    const { enqueueSearchJob } = await import('./queue/SearchQueue');
    await enqueueSearchJob({
      jobId,
      listId,
      items: itemsList,
      activeProviders: providers,
      supplierId: supplierId
    });

    // Provide a dummy processFunction for backwards compatibility with the route
    const processFunction = async () => {
      console.log(`[BatchProcessor] Job ${jobId} offloaded to BullMQ worker.`);
    };

    return { jobId, processFunction };
  }
}
