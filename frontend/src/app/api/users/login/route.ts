import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/app/api/repositories/UserRepository';
import { LoginSchema } from '@/app/api/lib/validation';
import { signToken } from '@/app/api/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const userRepository = new UserRepository();

// POST /api/users/login - Authenticate user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = LoginSchema.parse(body);
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Usuário sem senha definida.' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Falha na autenticação interna' },
      { status: 500 }
    );
  }
}
