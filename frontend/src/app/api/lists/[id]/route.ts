import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';

const listRepository = new ListRepository();

// GET /api/lists/[id] - Get quotation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const list = await listRepository.getById(id);
    
    if (!list) {
      return NextResponse.json(
        { error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar cotação' },
      { status: 500 }
    );
  }
}
