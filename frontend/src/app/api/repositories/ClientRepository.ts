import { pool } from '@/services/db/pool';

export interface Client {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  created_at?: string;
  updated_at?: string;
}

export class ClientRepository {
  async listAll(): Promise<Client[]> {
    const result = await pool.query('SELECT * FROM clients ORDER BY name ASC');
    return result.rows;
  }

  async create(data: { name: string; document?: string; email?: string; phone?: string }): Promise<string> {
    const result = await pool.query(
      'INSERT INTO clients (name, document, email, phone) VALUES ($1, $2, $3, $4) RETURNING id',
      [data.name, data.document || null, data.email || null, data.phone || null]
    );
    return result.rows[0].id;
  }

  async getById(id: string): Promise<Client | null> {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async update(id: string, data: Partial<Client>): Promise<void> {
    const fields = [];
    const values = [];
    let i = 1;

    if (data.name) {
      fields.push(`name = $${i++}`);
      values.push(data.name);
    }
    if (data.document !== undefined) {
      fields.push(`document = $${i++}`);
      values.push(data.document);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${i++}`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${i++}`);
      values.push(data.phone);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.query(
      `UPDATE clients SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${i}`,
      values
    );
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM clients WHERE id = $1', [id]);
  }
}
