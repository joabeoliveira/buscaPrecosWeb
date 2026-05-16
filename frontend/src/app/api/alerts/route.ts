import { NextRequest, NextResponse } from 'next/server';
import { AlertRepository } from '@/app/api/repositories/AlertRepository';
import { forbiddenResponse, isInternalUser, requireAuth } from '@/app/api/lib/auth';

const alertRepo = new AlertRepository();

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (!isInternalUser(user)) return forbiddenResponse();

    const alerts = await alertRepo.getUnread();
    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error('[API] Failed to fetch alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
