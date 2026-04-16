import { pool } from '@/services/db/pool';
import type { ShoppingList } from '@/types/database';

export class ListRepository {
  async create(
    name: string, 
    items: ({ query: string, unit?: string | null | undefined, quantity?: number | null | undefined } | string)[], 
    userId: string | null = null,
    clientId: string | null = null,
    responsibleId: string | null = null,
    internalCode: string | null = null
  ): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const listResult = await client.query(
        'INSERT INTO shopping_lists (name, user_id, total_items, client_id, responsible_id, internal_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [name, userId, items.length, clientId, responsibleId, internalCode]
      );
      const listId = listResult.rows[0].id;

      const itemInsertPromises = items.map((item) => {
        const itemObj = typeof item === 'string' ? { query: item } : item;
        return client.query(
          'INSERT INTO shopping_list_items (shopping_list_id, original_query, unit, quantity) VALUES ($1, $2, $3, $4)',
          [listId, itemObj.query, itemObj.unit || 'un', itemObj.quantity || 1.0]
        );
      });

      await Promise.all(itemInsertPromises);
      await client.query('COMMIT');

      return listId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listAll(filters: { status?: string, clientId?: string } = {}): Promise<ShoppingList[]> {
    let query = `
      SELECT sl.*, c.name as client_name, u.name as responsible_name
      FROM shopping_lists sl
      LEFT JOIN clients c ON sl.client_id = c.id
      LEFT JOIN users u ON sl.responsible_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND sl.status = $${params.length}`;
    }

    if (filters.clientId) {
      params.push(filters.clientId);
      query += ` AND sl.client_id = $${params.length}`;
    }

    query += ' ORDER BY sl.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getById(id: string): Promise<ShoppingList | null> {
    const result = await pool.query(
      `SELECT sl.*, c.name as client_name, c.email as client_email, u.name as responsible_name
       FROM shopping_lists sl
       LEFT JOIN clients c ON sl.client_id = c.id
       LEFT JOIN users u ON sl.responsible_id = u.id
       WHERE sl.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getResults(listId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, shopping_list_id, original_query, normalized_query, status, best_price, best_store, 
              best_product_title, best_product_link, thumbnail_url, description, 
              is_approved, raw_response, searched_at, unit, quantity
       FROM shopping_list_items 
       WHERE shopping_list_id = $1
       ORDER BY created_at ASC`,
      [listId]
    );
    return result.rows;
  }

  async selectResult(itemId: string, selection: any, userId: string | null = null): Promise<void> {
    await pool.query(
      `UPDATE shopping_list_items 
       SET best_price = $1, 
           best_store = $2, 
           best_product_title = $3, 
           best_product_link = $4, 
           thumbnail_url = $5, 
           description = $6,
           is_approved = true,
           updated_by_id = $7,
           updated_at = NOW()
       WHERE id = $8`,
      [
        selection.price, 
        selection.source, 
        selection.title, 
        selection.link, 
        selection.thumbnail, 
        selection.description,
        userId,
        itemId
      ]
    );
  }

  async approveItem(itemId: string, isApproved: boolean, userId: string | null = null): Promise<void> {
    await pool.query(
      'UPDATE shopping_list_items SET is_approved = $1, analyzed_by_id = $2, updated_at = NOW() WHERE id = $3',
      [isApproved, userId, itemId]
    );
  }

  async getItems(listId: string): Promise<string[]> {
    const result = await pool.query(
      'SELECT original_query FROM shopping_list_items WHERE shopping_list_id = $1',
      [listId]
    );
    return result.rows.map(row => row.original_query);
  }

  async getItemById(itemId: string): Promise<string> {
    const result = await pool.query(
      'SELECT original_query FROM shopping_list_items WHERE id = $1',
      [itemId]
    );
    if (result.rowCount === 0) throw new Error('Item not found');
    return result.rows[0].original_query;
  }

  async updateItemResult(listId: string, query: string, data: { status: string, results: any[] }): Promise<void> {
    await pool.query(
      `UPDATE shopping_list_items 
       SET status = $1, 
           raw_response = $2, 
           searched_at = NOW()
       WHERE shopping_list_id = $3 AND original_query = $4`,
      [data.status, JSON.stringify(data.results), listId, query]
    );

    // If all items in the list are processed, update list status to 'completed'
    const allItemsStatus = await pool.query(
      'SELECT COUNT(*) as count FROM shopping_list_items WHERE shopping_list_id = $1 AND status = \'pending\'',
      [listId]
    );

    if (parseInt(allItemsStatus.rows[0].count) === 0) {
      await pool.query(
        'UPDATE shopping_lists SET status = \'completed\' WHERE id = $1',
        [listId]
      );
    } else {
      await pool.query(
        'UPDATE shopping_lists SET status = \'processing\' WHERE id = $1',
        [listId]
      );
    }
  }
}
