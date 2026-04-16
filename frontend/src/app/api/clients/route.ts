import { NextResponse } from 'next/server';
import { ClientRepository } from '@/app/api/repositories/ClientRepository';

const clientRepo = new ClientRepository();

export async function GET() {
  try {
    const clients = await clientRepo.listAll();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error listing clients:', error);
    return NextResponse.json({ error: 'Failed to list clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const id = await clientRepo.create(data);
    const client = await clientRepo.getById(id);
    
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
