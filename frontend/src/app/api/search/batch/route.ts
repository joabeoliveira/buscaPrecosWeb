import { NextRequest, NextResponse, after } from 'next/server';
import { BatchProcessor } from '@/app/api/services/BatchProcessor';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { SearchBatchSchema } from '@/app/api/lib/validation';
import { canAccessClient, forbiddenResponse, requireAuth } from '@/app/api/lib/auth';
import { z } from 'zod';

// For Vercel Hobby, max limit is generally 10s or 60s for background tasks depending on config
export const maxDuration = 60; // Max allowed serverless duration in seconds

const batchProcessor = new BatchProcessor();
const listRepository = new ListRepository();

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { listId, itemId, providers, supplierId } = SearchBatchSchema.parse(body);
    const list = await listRepository.getById(listId);

    if (!list) {
      return NextResponse.json(
        {
          code: 'NOT_FOUND',
          message: 'Quotation not found',
        },
        { status: 404 }
      );
    }

    if (!canAccessClient(user, list.client_id)) {
      return forbiddenResponse('Você não tem acesso a esta cotação');
    }

    const { jobId, processFunction } = await batchProcessor.startJob(listId, itemId, providers, supplierId);

    // Schedule background execution in Vercel so the container doesn't freeze
    after(processFunction);

    return NextResponse.json(
      {
        jobId,
        listId,
        status: 'pending',
        message: 'Batch processing started',
      },
      { status: 202 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid list ID',
          details: error.issues,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to start batch search',
      },
      { status: 500 }
    );
  }
}
