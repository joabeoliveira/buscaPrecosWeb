import { NextRequest, NextResponse, after } from 'next/server';
import { BatchProcessor } from '@/app/api/services/BatchProcessor';
import { SearchBatchSchema } from '@/app/api/lib/validation';
import { z } from 'zod';

// For Vercel Hobby, max limit is generally 10s or 60s for background tasks depending on config
export const maxDuration = 60; // Max allowed serverless duration in seconds

const batchProcessor = new BatchProcessor();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listId, itemId } = SearchBatchSchema.parse(body);
    const { jobId, processFunction } = await batchProcessor.startJob(listId, itemId);

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
