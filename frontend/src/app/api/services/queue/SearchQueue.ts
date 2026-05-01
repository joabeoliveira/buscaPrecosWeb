import { Queue } from 'bullmq';
import { connection } from './connection';

export const SEARCH_QUEUE_NAME = 'product-search-queue';

export const searchQueue = new Queue(SEARCH_QUEUE_NAME, { connection });

export interface SearchJobData {
  jobId: string;
  listId: string;
  items: string[];
  activeProviders?: string[];
  supplierId?: string;
}

export async function enqueueSearchJob(data: SearchJobData) {
  return searchQueue.add('search-batch', data, {
    removeOnComplete: true,
    removeOnFail: false,
  });
}
