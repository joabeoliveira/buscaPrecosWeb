import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/app/api/repositories/UserRepository';
import { UserSchema } from '@/app/api/lib/validation';
import { forbiddenResponse, hasRole, isClientUser, isInternalUser, requireAuth } from '@/app/api/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const userRepository = new UserRepository();

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (isClientUser(user)) {
      if (user.role !== 'client_admin' || !user.client_id) {
        return forbiddenResponse('Acesso negado para listar usuários');
      }
      const users = await userRepository.listByClient(user.client_id);
      return NextResponse.json(users);
    }

    if (!isInternalUser(user)) return forbiddenResponse();

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
    const authUser = requireAuth(request);
    if (authUser instanceof NextResponse) return authUser;

    const { name, email, role, client_id, password } = UserSchema.parse(body);

    if (isClientUser(authUser)) {
      if (authUser.role !== 'client_admin' || !authUser.client_id) {
        return forbiddenResponse('Apenas administradores do cliente podem criar usuários');
      }
      if (role !== 'client_buyer' && role !== 'client_admin') {
        return forbiddenResponse('Cliente só pode criar usuários B2B');
      }
      if (client_id && client_id !== authUser.client_id) {
        return forbiddenResponse('Não é permitido criar usuário para outro cliente');
      }
    } else if (!hasRole(authUser, ['super_admin', 'admin'])) {
      return forbiddenResponse('Apenas administradores podem criar usuários');
    }
    
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
    
    const scopedClientId = isClientUser(authUser) ? authUser.client_id! : client_id || null;
    const id = await userRepository.create(name, email, role, passwordHash, scopedClientId);
    return NextResponse.json(
      { id, name, email, role, client_id: scopedClientId },
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
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (!hasRole(user, ['super_admin', 'admin'])) {
      return forbiddenResponse('Apenas administradores podem excluir usuários');
    }

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
