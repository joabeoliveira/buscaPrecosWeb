import { pool } from '@/services/db/pool';
import type { User } from '@/types/database';

export class UserRepository {
  async listAll(): Promise<User[]> {
    const result = await pool.query('SELECT id, name, email, role, active, created_at FROM users ORDER BY name ASC');
    return result.rows;
  }

  async create(name: string, email: string, role: string = 'user', passwordHash?: string): Promise<string> {
    const result = await pool.query(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, role, passwordHash || null]
    );
    return result.rows[0].id;
  }

  async updateRole(id: string, role: string): Promise<void> {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  }

  async updatePassword(id: string, hash: string): Promise<void> {
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }
}
