import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { canAccessClient, forbiddenResponse, requireAuth } from '@/app/api/lib/auth';
import { z } from 'zod';

const listRepository = new ListRepository();

const SelectResultSchema = z.object({
  selection: z.object({
    price: z.number(),
    source: z.string(),
    title: z.string(),
    link: z.string(),
    thumbnail: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
});

// POST /api/lists/[id]/select/[itemId] - Select a product result for an item
export async function POST(
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
    const { selection } = SelectResultSchema.parse(body);
    
    await listRepository.selectResult(id, itemId, selection, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Erro ao selecionar resultado:', error);
    return NextResponse.json(
      { error: 'Erro ao selecionar resultado' },
      { status: 500 }
    );
  }
}
