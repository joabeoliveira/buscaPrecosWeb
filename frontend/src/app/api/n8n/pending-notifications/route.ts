import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { requireInternalAuthOrN8nToken } from '@/app/api/lib/auth';

const listRepository = new ListRepository();

export async function GET(request: NextRequest) {
  try {
    const auth = requireInternalAuthOrN8nToken(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '25', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 25;

    const quotations = await listRepository.listPendingClientNotifications(limit);
    return NextResponse.json({ quotations });
  } catch (error) {
    console.error('Erro ao listar notificações pendentes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar notificações pendentes' },
      { status: 500 }
    );
  }
}
