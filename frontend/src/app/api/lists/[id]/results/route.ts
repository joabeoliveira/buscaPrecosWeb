import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';

const listRepository = new ListRepository();

// GET /api/lists/[id]/results - Get quotation results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const results = await listRepository.getResults(id);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar resultados' },
      { status: 500 }
    );
  }
}
