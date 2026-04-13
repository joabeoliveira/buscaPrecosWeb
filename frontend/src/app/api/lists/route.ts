import { NextRequest, NextResponse } from 'next/server';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { CreateListSchema } from '@/app/api/lib/validation';
import { z } from 'zod';

const listRepository = new ListRepository();

// GET /api/lists - List all quotations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      clientId: searchParams.get('clientId') || undefined,
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
    const body = await request.json();
    const { name, items, clientId, responsibleId, internalCode } = CreateListSchema.parse(body);
    const listId = await listRepository.create(
      name, 
      items, 
      null, 
      clientId || null, 
      responsibleId || null, 
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
