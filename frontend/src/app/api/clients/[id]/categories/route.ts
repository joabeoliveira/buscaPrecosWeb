import { NextRequest, NextResponse } from 'next/server';
import { ClientRepository } from '@/app/api/repositories/ClientRepository';
import { CategorySchema } from '@/app/api/lib/validation';
import { canAccessClient, forbiddenResponse, hasRole, isClientUser, requireAuth } from '@/app/api/lib/auth';
import { z } from 'zod';

const clientRepository = new ClientRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    if (!canAccessClient(user, id)) {
      return forbiddenResponse('Você não tem acesso às categorias deste cliente');
    }

    const categories = await clientRepository.listCategories(id);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error listing client categories:', error);
    return NextResponse.json({ error: 'Erro ao listar categorias' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    if (!canAccessClient(user, id)) {
      return forbiddenResponse('Você não tem acesso às categorias deste cliente');
    }
    if (isClientUser(user) && user.role !== 'client_admin') {
      return forbiddenResponse('Apenas administradores do cliente podem criar categorias');
    }
    if (!isClientUser(user) && !hasRole(user, ['super_admin', 'admin'])) {
      return forbiddenResponse('Apenas administradores podem criar categorias');
    }

    const { name } = CategorySchema.parse(await request.json());
    const category = await clientRepository.createCategory(id, name);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 });
    }
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Categoria já cadastrada para este cliente' }, { status: 409 });
    }
    console.error('Error creating client category:', error);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}
