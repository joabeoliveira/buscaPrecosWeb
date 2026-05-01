import { pool } from '@/services/db/pool';

export interface Supplier {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  free_shipping: boolean;
  min_free_shipping: number | null;
  score: number;
  avg_delivery_days: number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export type SupplierCreateData = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;

export class SupplierRepository {
  async listAll(): Promise<Supplier[]> {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
    return result.rows;
  }

  async listActive(): Promise<Supplier[]> {
    const result = await pool.query(
      'SELECT * FROM suppliers WHERE is_active = TRUE ORDER BY score DESC, name ASC'
    );
    return result.rows;
  }

  async getById(id: string): Promise<Supplier | null> {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(data: SupplierCreateData): Promise<Supplier> {
    const result = await pool.query(
      `INSERT INTO suppliers 
        (name, url, category, is_active, free_shipping, min_free_shipping, score, avg_delivery_days, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.name,
        data.url,
        data.category,
        data.is_active ?? true,
        data.free_shipping ?? false,
        data.min_free_shipping ?? null,
        data.score ?? 5,
        data.avg_delivery_days ?? null,
        data.notes ?? null,
      ]
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<SupplierCreateData>): Promise<Supplier | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    const updatable: (keyof SupplierCreateData)[] = [
      'name', 'url', 'category', 'is_active', 'free_shipping',
      'min_free_shipping', 'score', 'avg_delivery_days', 'notes'
    ];

    for (const key of updatable) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return this.getById(id);

    values.push(id);
    const result = await pool.query(
      `UPDATE suppliers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [id]);
  }
}
