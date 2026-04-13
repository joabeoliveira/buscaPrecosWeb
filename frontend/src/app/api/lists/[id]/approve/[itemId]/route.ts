import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { z } from 'zod';

const listRepository = new ListRepository();

const ApproveItemSchema = z.object({
  isApproved: z.boolean(),
  userId: z.string().uuid().optional(),
});

// PATCH /api/lists/[id]/approve/[itemId] - Approve/disapprove an item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { isApproved, userId } = ApproveItemSchema.parse(body);
    
    await listRepository.approveItem(itemId, isApproved, userId || null);
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
