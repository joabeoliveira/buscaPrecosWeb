import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { canAccessClient, forbiddenResponse, requireAuth } from '@/app/api/lib/auth';
import { z } from 'zod';

const listRepository = new ListRepository();

const ApproveItemSchema = z.object({
  isApproved: z.boolean(),
});

// PATCH /api/lists/[id]/approve/[itemId] - Approve/disapprove an item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { id, itemId } = await params;
    const list = await listRepository.getById(id);

    if (!list) {
      return NextResponse.json(
        { error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    if (!canAccessClient(user, list.client_id)) {
      return forbiddenResponse('Você não tem acesso a esta cotação');
    }

    const body = await request.json();
    const { isApproved } = ApproveItemSchema.parse(body);
    
    await listRepository.approveItem(id, itemId, isApproved, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Erro ao aprovar item:', error);
    return NextResponse.json(
      { error: 'Erro ao aprovar item' },
      { status: 500 }
    );
  }
}
