import { NextRequest, NextResponse } from 'next/server';
import { BatchProcessor } from '@/app/api/services/BatchProcessor';
import { SearchBatchSchema } from '@/app/api/lib/validation';
import { z } from 'zod';

const batchProcessor = new BatchProcessor();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listId, itemId } = SearchBatchSchema.parse(body);
    const jobId = await batchProcessor.startJob(listId, itemId);

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
