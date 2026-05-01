import { NextResponse } from 'next/server';
import { AlertRepository } from '@/app/api/repositories/AlertRepository';

const alertRepo = new AlertRepository();

export async function GET() {
  try {
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
