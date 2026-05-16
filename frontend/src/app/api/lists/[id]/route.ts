import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { canAccessClient, forbiddenResponse, requireAuth } from '@/app/api/lib/auth';

const listRepository = new ListRepository();

// GET /api/lists/[id] - Get quotation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
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
    
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar cotação' },
      { status: 500 }
    );
  }
}
