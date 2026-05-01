import { pool } from '@/services/db/pool';

export interface SystemAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  payload: any;
  is_read: boolean;
  created_at: Date;
}

export class AlertRepository {
  async create(data: Omit<SystemAlert, 'id' | 'is_read' | 'created_at'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO system_alerts (type, title, message, payload) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.type, data.title, data.message, JSON.stringify(data.payload || {})]
    );
    return result.rows[0].id;
  }

  async getUnread(): Promise<SystemAlert[]> {
    const result = await pool.query(
      'SELECT * FROM system_alerts WHERE is_read = false ORDER BY created_at DESC LIMIT 50'
    );
    return result.rows;
  }

  async markAsRead(id: string): Promise<void> {
    await pool.query('UPDATE system_alerts SET is_read = true WHERE id = $1', [id]);
  }
}
