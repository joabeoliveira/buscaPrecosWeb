import { NextRequest, NextResponse } from 'next/server';
import { ClientRepository } from '@/app/api/repositories/ClientRepository';
import { ClientSchema } from '@/app/api/lib/validation';
import { forbiddenResponse, isInternalUser, requireAuth } from '@/app/api/lib/auth';
import { z } from 'zod';

const clientRepo = new ClientRepository();

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (!isInternalUser(user)) return forbiddenResponse('Apenas usuários internos podem listar clientes');

    const clients = await clientRepo.listAll();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error listing clients:', error);
    return NextResponse.json({ error: 'Failed to list clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (!isInternalUser(user)) return forbiddenResponse('Apenas usuários internos podem criar clientes');

    const data = ClientSchema.parse(await request.json());

    const id = await clientRepo.create(data);
    const client = await clientRepo.getById(id);
    
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
