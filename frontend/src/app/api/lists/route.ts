import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { CreateListSchema } from '@/app/api/lib/validation';
import { forbiddenResponse, isClientUser, requireAuth } from '@/app/api/lib/auth';
import { z } from 'zod';

const listRepository = new ListRepository();

// GET /api/lists - List all quotations
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (isClientUser(user) && !user.client_id) {
      return forbiddenResponse('Usuário B2B sem cliente vinculado');
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      clientId: isClientUser(user) ? user.client_id || undefined : searchParams.get('clientId') || undefined,
    };
    const lists = await listRepository.listAll(filters);
    return NextResponse.json(lists);
  } catch (error) {
    console.error('Erro ao listar cotações:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar cotações' },
      { status: 500 }
    );
  }
}

// POST /api/lists - Create new quotation
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (isClientUser(user) && !user.client_id) {
      return forbiddenResponse('Usuário B2B sem cliente vinculado');
    }

    const body = await request.json();
    const { name, items, clientId, responsibleId, internalCode } = CreateListSchema.parse(body);
    const scopedClientId = isClientUser(user) ? user.client_id! : clientId || null;

    if (isClientUser(user) && clientId && clientId !== user.client_id) {
      return forbiddenResponse('Não é permitido criar cotação para outro cliente');
    }

    const listId = await listRepository.create(
      name, 
      items, 
      user.id, 
      scopedClientId, 
      isClientUser(user) ? null : responsibleId || null, 
      internalCode || null
    );
    
    return NextResponse.json(
      {
        id: listId,
        name,
        itemsCount: items.length,
        status: 'pending',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Erro ao criar lista:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar cotação' },
      { status: 500 }
    );
  }
}
