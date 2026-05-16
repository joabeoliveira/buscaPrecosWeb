import { NextRequest, NextResponse } from 'next/server';
import { AlertRepository } from '@/app/api/repositories/AlertRepository';
import { forbiddenResponse, isInternalUser, requireAuth } from '@/app/api/lib/auth';

const alertRepo = new AlertRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (!isInternalUser(user)) return forbiddenResponse();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing alert ID' }, { status: 400 });
    }

    await alertRepo.markAsRead(id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[API] Failed to mark alert as read:`, error);
    return NextResponse.json(
      { error: 'Failed to mark alert as read' },
      { status: 500 }
    );
  }
}
