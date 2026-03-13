import pool from '../db/pool.js';

export interface SearchJob {
  id: string;
  shopping_list_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  processed_items: number;
  total_items: number;
  error_message?: string;
}

export class JobRepository {
  async create(listId: string, totalItems: number): Promise<string> {
    const result = await pool.query(
      `INSERT INTO search_jobs (shopping_list_id, total_items, status, progress) 
       VALUES ($1, $2, 'pending', 0) 
       RETURNING id`,
      [listId, totalItems]
    );
    return result.rows[0].id;
  }

  async updateProgress(jobId: string, processed: number, total: number): Promise<void> {
    const progress = Math.round((processed / total) * 100);
    await pool.query(
      `UPDATE search_jobs 
       SET processed_items = $2, progress = $3, status = $4, 
           updated_at = CURRENT_TIMESTAMP,
           started_at = CASE WHEN started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
           completed_at = CASE WHEN $3 = 100 THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = $1`,
      [jobId, processed, progress, progress === 100 ? 'completed' : 'processing']
    );
  }

  async getById(jobId: string): Promise<SearchJob | null> {
    const result = await pool.query(
      'SELECT id, shopping_list_id, status, progress, processed_items, total_items, error_message FROM search_jobs WHERE id = $1',
      [jobId]
    );
    return result.rows[0] || null;
  }

  async fail(jobId: string, errorMessage: string): Promise<void> {
    await pool.query(
      'UPDATE search_jobs SET status = \'failed\', error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [jobId, errorMessage]
    );
  }
}
