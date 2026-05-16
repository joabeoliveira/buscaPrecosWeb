import { NextRequest, NextResponse } from 'next/server';
import { JobRepository } from '@/app/api/repositories/JobRepository';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { canAccessClient, forbiddenResponse, requireAuth } from '@/app/api/lib/auth';

const jobRepository = new JobRepository();
const listRepository = new ListRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;

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

    const list = await listRepository.getById(job.shopping_list_id);
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
