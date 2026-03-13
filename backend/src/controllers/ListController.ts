import type { Request, Response } from 'express';
import { ListRepository } from '../repositories/ListRepository.js';
import { z } from 'zod';

const CreateListSchema = z.object({
  name: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
});

export class ListController {
  private repository: ListRepository;

  constructor() {
    this.repository = new ListRepository();
  }

  create = async (req: Request, res: Response) => {
    try {
      const { name, items } = CreateListSchema.parse(req.body);
      const listId = await this.repository.create(name, items);
      
      res.status(201).json({
        id: listId,
        name,
        itemsCount: items.length,
        status: 'pending',
      });
    } catch (error) {
      const requestId = res.getHeader('x-request-id');
      if (error instanceof z.ZodError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.issues,
          requestId: String(requestId),
        });
      } else {
        res.status(500).json({
          code: 'INTERNAL_ERROR',
          message: 'Failed to create list',
          requestId: String(requestId),
        });
      }
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const list = await this.repository.getById(id as string);

      if (!list) {
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Shopping list not found',
          requestId: String(res.getHeader('x-request-id')),
        });
      }

      res.json(list);
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch list',
        requestId: String(res.getHeader('x-request-id')),
      });
    }
  };

  getResults = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const results = await this.repository.getResults(id as string);

      res.json(results);
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch results',
        requestId: String(res.getHeader('x-request-id')),
      });
    }
  };

  approveItem = async (req: Request, res: Response) => {
    try {
      const itemId = req.params.itemId as string;
      const { approved } = req.body;
      await this.repository.approveItem(itemId, approved);

      res.json({ success: true, itemId, approved });
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to approve item',
        requestId: String(res.getHeader('x-request-id')),
      });
    }
  };
  selectResult = async (req: Request, res: Response) => {
    try {
      const itemId = req.params.itemId as string;
      const selection = req.body; // Expect product object {title, price, source, link, thumbnail, description}
      await this.repository.selectResult(itemId, selection);

      res.json({ success: true, itemId });
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to select result',
        requestId: String(res.getHeader('x-request-id')),
      });
    }
  };
}
