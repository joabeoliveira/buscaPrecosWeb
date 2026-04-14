import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../../repositories/UserRepository';
import { pool } from '@/services/db/pool';

const userRepository = new UserRepository();

export async function GET() {
  try {
    const email = 'joabeantonio@gmail.com';
    const password = 'admin123';
    
    // Verifica se já existe
    const existingUser = await userRepository.findByEmail(email);
    
    const password_hash = await bcrypt.hash(password, 10);
    
    if (existingUser) {
      // Se já existe, usamos o pool importado
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2 WHERE email = $3',
        [password_hash, 'admin', email]
      );
      return NextResponse.json({ message: 'Senha do usuário Joabe atualizada para "admin123"' });
    }

    // Se não existe, cria
    await pool.query(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4)',
      ['Joabe Antonio', email, 'admin', password_hash]
    );

    return NextResponse.json({ 
      message: 'Usuário administrador criado com sucesso!',
      email: email,
      password: 'admin123'
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
