import type { Request, Response } from 'express';
import { z } from 'zod';
import { CatmatService } from '../services/CatmatService.js';

const MatchSchema = z.object({
  description: z.string().min(3).max(500),
});

const BatchMatchSchema = z.object({
  descriptions: z.array(z.string().min(3).max(500)).min(1).max(50),
});

export class CatmatController {
  private service: CatmatService;

  constructor() {
    this.service = new CatmatService();
  }

  match = async (req: Request, res: Response) => {
    try {
      const { description } = MatchSchema.parse(req.body);
      const result = await this.service.matchDescription(description);
      res.json(result);
    } catch (error) {
      const requestId = res.getHeader('x-request-id');
      if (error instanceof z.ZodError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos.',
          details: error.issues,
          requestId: String(requestId),
        });
      } else {
        console.error('[CATMAT] Erro em /catmat/match:', error);
        res.status(500).json({
          code: 'INTERNAL_ERROR',
          message: 'Falha ao identificar CATMAT.',
          requestId: String(requestId),
        });
      }
    }
  };

  batchMatch = async (req: Request, res: Response) => {
    try {
      const { descriptions } = BatchMatchSchema.parse(req.body);
      const results = await this.service.batchMatch(descriptions);
      res.json({ results });
    } catch (error) {
      const requestId = res.getHeader('x-request-id');
      if (error instanceof z.ZodError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos.',
          details: error.issues,
          requestId: String(requestId),
        });
      } else {
        console.error('[CATMAT] Erro em /catmat/batch-match:', error);
        res.status(500).json({
          code: 'INTERNAL_ERROR',
          message: 'Falha ao identificar CATMAT em lote.',
          requestId: String(requestId),
        });
      }
    }
  };
}
