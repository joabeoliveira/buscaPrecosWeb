import { pool } from '@/services/db/pool';

export interface Client {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  trade_name?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ItemCategory {
  id: string;
  client_id: string;
  name: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ClientRepository {
  async listAll(): Promise<Client[]> {
    const result = await pool.query('SELECT * FROM clients ORDER BY name ASC');
    return result.rows;
  }

  async create(data: {
    name: string;
    document?: string | null;
    email?: string | null;
    phone?: string | null;
    trade_name?: string | null;
    active?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const result = await pool.query(
      `INSERT INTO clients (name, document, email, phone, trade_name, active, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        data.name,
        data.document || null,
        data.email || null,
        data.phone || null,
        data.trade_name || null,
        data.active ?? true,
        JSON.stringify(data.metadata || {}),
      ]
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
    if (data.trade_name !== undefined) {
      fields.push(`trade_name = $${i++}`);
      values.push(data.trade_name);
    }
    if (data.active !== undefined) {
      fields.push(`active = $${i++}`);
      values.push(data.active);
    }
    if (data.metadata !== undefined) {
      fields.push(`metadata = $${i++}`);
      values.push(JSON.stringify(data.metadata));
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

  async listCategories(clientId: string): Promise<ItemCategory[]> {
    const result = await pool.query(
      'SELECT * FROM item_categories WHERE client_id = $1 AND active = true ORDER BY name ASC',
      [clientId]
    );
    return result.rows;
  }

  async createCategory(clientId: string, name: string): Promise<ItemCategory> {
    const result = await pool.query(
      `INSERT INTO item_categories (client_id, name)
       VALUES ($1, $2)
       RETURNING *`,
      [clientId, name.trim()]
    );
    return result.rows[0];
  }
}
