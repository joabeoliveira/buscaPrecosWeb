import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../../repositories/UserRepository';
import { pool } from '@/services/db/pool';

const userRepository = new UserRepository();

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Inicialização indisponível em produção' }, { status: 404 });
    }

    const configuredToken = process.env.INIT_ADMIN_TOKEN;
    const providedToken = request.headers.get('x-init-token') || new URL(request.url).searchParams.get('token');
    const userCountResult = await pool.query('SELECT COUNT(*)::int as count FROM users');
    const hasUsers = userCountResult.rows[0].count > 0;

    if (configuredToken && providedToken !== configuredToken) {
      return NextResponse.json({ error: 'Token de inicialização inválido' }, { status: 403 });
    }

    if (!configuredToken && hasUsers) {
      return NextResponse.json(
        { error: 'Inicialização já realizada. Configure INIT_ADMIN_TOKEN para redefinir o admin local.' },
        { status: 403 }
      );
    }

    const email = process.env.INIT_ADMIN_EMAIL || 'joabeantonio@gmail.com';
    const password = process.env.INIT_ADMIN_PASSWORD || 'admin123';
    const name = process.env.INIT_ADMIN_NAME || 'Joabe Antonio';

    const existingUser = await userRepository.findByEmail(email);
    const password_hash = await bcrypt.hash(password, 10);
    
    if (existingUser) {
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2 WHERE email = $3',
        [password_hash, 'admin', email]
      );
      return NextResponse.json({ message: 'Usuário administrador atualizado com sucesso', email });
    }

    await pool.query(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4)',
      [name, email, 'admin', password_hash]
    );

    return NextResponse.json({
      message: 'Usuário administrador criado com sucesso!',
      email: email,
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
