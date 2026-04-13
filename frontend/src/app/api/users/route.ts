import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/app/api/repositories/UserRepository';
import { UserSchema } from '@/app/api/lib/validation';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const userRepository = new UserRepository();

// GET /api/users - List all users
export async function GET() {
  try {
    const users = await userRepository.listAll();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao listar responsáveis' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, password } = UserSchema.parse(body);
    
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado' },
        { status: 400 }
      );
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    } else {
      // Default password for new members if not specified: '123456'
      passwordHash = await bcrypt.hash('123456', 10);
    }
    
    const id = await userRepository.create(name, email, role, passwordHash);
    return NextResponse.json(
      { id, name, email, role },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar responsável' },
      { status: 500 }
    );
  }
}

// DELETE /api/users?id=xxx - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    await userRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir responsável' },
      { status: 500 }
    );
  }
}
