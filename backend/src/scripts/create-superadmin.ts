import { UserRepository } from '../repositories/UserRepository.js';
import { pool } from '../db/pool.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function createSuperAdmin() {
  const repo = new UserRepository();
  
  const name = 'Administrador Root';
  const email = 'admin@buscaprecos.com';
  const password = 'admin'; 
  const role = 'admin';
  
  console.log(`Buscando ${email}...`);
  
  try {
    const hash = await bcrypt.hash(password, 10);
    const existing = await repo.findByEmail(email);

    if (existing) {
      console.log('Usuário já existe. Resetando senha para "admin" e promovendo para admin...');
      await repo.updateRole(existing.id, 'admin');
      await repo.updatePassword(existing.id, hash);
    } else {
      console.log('Criando novo Super Admin...');
      await repo.create(name, email, role, hash);
    }
    
    console.log('--- SUCESSO ---');
    console.log('Login:', email);
    console.log('Senha:', password);
    console.log('Nível: Super Administrador (TUDO)');
  } catch (error: any) {
    if (error.code === '42703') {
       console.error('ERRO: A tabela de usuários não tem o campo password_hash. Use a migração primeiro.');
    } else {
       console.error('Erro ao processar:', error);
    }
  } finally {
    process.exit();
  }
}

createSuperAdmin();
