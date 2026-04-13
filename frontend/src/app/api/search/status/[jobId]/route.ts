import { NextRequest, NextResponse } from 'next/server';
import { JobRepository } from '@/app/api/repositories/JobRepository';

const jobRepository = new JobRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = await jobRepository.getById(jobId);

    if (!job) {
      return NextResponse.json(
        {
          code: 'NOT_FOUND',
          message: 'Search job not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch job status',
      },
      { status: 500 }
    );
  }
}
