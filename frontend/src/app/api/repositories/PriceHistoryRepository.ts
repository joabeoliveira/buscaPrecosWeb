import { pool } from '@/services/db/pool';

export interface PriceHistoryRecord {
  id: string;
  canonical_product_id: string;
  price: number;
  store: string;
  product_title: string;
  product_link: string;
  source: string;
  shopping_list_id?: string;
  captured_at: Date;
}

export interface PriceStats {
  canonical_product_id: string;
  sample_count: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  std_dev: number;
  median_price: number;
  last_seen: Date;
}

export class PriceHistoryRepository {
  async addRecord(data: Omit<PriceHistoryRecord, 'id' | 'captured_at'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO price_history (canonical_product_id, price, store, product_title, product_link, source, shopping_list_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [
        data.canonical_product_id, 
        data.price, 
        data.store, 
        data.product_title, 
        data.product_link, 
        data.source, 
        data.shopping_list_id
      ]
    );
    return result.rows[0].id;
  }

  async getStats(canonicalProductId: string): Promise<PriceStats | null> {
    const result = await pool.query(
      'SELECT * FROM price_stats WHERE canonical_product_id = $1',
      [canonicalProductId]
    );
    return result.rows[0] || null;
  }

  async refreshStats(): Promise<void> {
    await pool.query('REFRESH MATERIALIZED VIEW price_stats');
  }
}
