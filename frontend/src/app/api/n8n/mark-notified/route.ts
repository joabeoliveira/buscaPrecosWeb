import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { requireInternalAuthOrN8nToken } from '@/app/api/lib/auth';
import { z } from 'zod';

const listRepository = new ListRepository();

const MarkNotifiedSchema = z.object({
  listId: z.string().uuid(),
  status: z.enum(['queued', 'sent', 'failed']).default('sent'),
});

export async function POST(request: NextRequest) {
  try {
    const auth = requireInternalAuthOrN8nToken(request);
    if (auth instanceof NextResponse) return auth;

    const { listId, status } = MarkNotifiedSchema.parse(await request.json());
    await listRepository.markClientNotification(listId, status);

    return NextResponse.json({
      success: true,
      listId,
      notification_status: status,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error?.message === 'Quotation not found') {
      return NextResponse.json(
        { error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    console.error('Erro ao marcar notificação:', error);
    return NextResponse.json(
      { error: 'Erro ao marcar notificação' },
      { status: 500 }
    );
  }
}
