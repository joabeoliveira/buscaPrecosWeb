import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';
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
  userId: z.string().uuid().optional(),
});

// POST /api/lists/[id]/select/[itemId] - Select a product result for an item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { selection, userId } = SelectResultSchema.parse(body);
    
    await listRepository.selectResult(itemId, selection, userId || null);
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
