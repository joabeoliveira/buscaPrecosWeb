import type { Request, Response } from 'express';
import { BatchProcessor } from '../services/BatchProcessor.js';
import { JobRepository } from '../repositories/JobRepository.js';
import { z } from 'zod';

const SearchBatchSchema = z.object({
  listId: z.string().uuid(),
  itemId: z.string().uuid().optional(),
});

export class SearchController {
  private batchProcessor: BatchProcessor;
  private jobRepository: JobRepository;

  constructor() {
    this.batchProcessor = new BatchProcessor();
    this.jobRepository = new JobRepository();
  }

  startBatch = async (req: Request, res: Response) => {
    try {
      const { listId, itemId } = SearchBatchSchema.parse(req.body);
      const jobId = await this.batchProcessor.startJob(listId, itemId);

      res.status(202).json({
        jobId,
        listId,
        status: 'pending',
        message: 'Batch processing started',
      });
    } catch (error: any) {
      const requestId = String(res.getHeader('x-request-id'));
      if (error instanceof z.ZodError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid list ID',
          details: error.issues,
          requestId,
        });
      } else {
        res.status(500).json({
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to start batch search',
          requestId,
        });
      }
    }
  };

  getStatus = async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const job = await this.jobRepository.getById(jobId as string);

      if (!job) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Search job not found',
          requestId: String(res.getHeader('x-request-id')),
        });
      }

      res.json(job);
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch job status',
        requestId: String(res.getHeader('x-request-id')),
      });
    }
  };
}
