import { pool } from '@/services/db/pool';

export interface CanonicalProduct {
  id: string;
  normalized_name: string;
  brand?: string;
  category?: string;
  attributes?: any;
  gtin?: string;
}

export class CanonicalProductRepository {
  async findByNormalizedName(normalizedName: string): Promise<CanonicalProduct | null> {
    const result = await pool.query(
      'SELECT * FROM canonical_products WHERE normalized_name = $1',
      [normalizedName]
    );
    return result.rows[0] || null;
  }

  async create(data: Omit<CanonicalProduct, 'id'>): Promise<CanonicalProduct> {
    const result = await pool.query(
      `INSERT INTO canonical_products (normalized_name, brand, category, attributes, gtin) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [data.normalized_name, data.brand, data.category, data.attributes || '{}', data.gtin]
    );
    return result.rows[0];
  }

  async getOrCreate(normalizedName: string): Promise<CanonicalProduct> {
    let product = await this.findByNormalizedName(normalizedName);
    if (!product) {
      try {
        product = await this.create({ normalized_name: normalizedName });
      } catch (err: any) {
        if (err.code === '23505') {
          product = await this.findByNormalizedName(normalizedName);
          if (!product) throw err;
        } else {
          throw err;
        }
      }
    }
    return product;
  }
}
