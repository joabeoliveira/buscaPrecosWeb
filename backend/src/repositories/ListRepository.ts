import pool from '../db/pool.js';

export interface ShoppingList {
  id: string;
  user_id: string | null;
  name: string;
  status: string;
  total_items: number;
}

export class ListRepository {
  async create(name: string, items: string[], userId: string | null = null): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const listResult = await client.query(
        'INSERT INTO shopping_lists (name, user_id, total_items) VALUES ($1, $2, $3) RETURNING id',
        [name, userId, items.length]
      );
      const listId = listResult.rows[0].id;

      const itemInsertPromises = items.map((item) =>
        client.query(
          'INSERT INTO shopping_list_items (shopping_list_id, original_query) VALUES ($1, $2)',
          [listId, item]
        )
      );

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

  async getById(id: string): Promise<ShoppingList | null> {
    const result = await pool.query(
      'SELECT id, user_id, name, status, total_items FROM shopping_lists WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getItems(listId: string): Promise<string[]> {
    const result = await pool.query(
      'SELECT original_query FROM shopping_list_items WHERE shopping_list_id = $1',
      [listId]
    );
    return result.rows.map((row) => row.original_query);
  }

  async getItemById(itemId: string): Promise<string> {
    const result = await pool.query(
      'SELECT original_query FROM shopping_list_items WHERE id = $1',
      [itemId]
    );
    if (result.rows.length === 0) throw new Error('Item not found');
    return result.rows[0].original_query;
  }

  async updateItemResult(listId: string, query: string, resultData: any): Promise<void> {
    await pool.query(
      `UPDATE shopping_list_items 
       SET status = $3, 
           raw_response = $4,
           searched_at = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE shopping_list_id = $1 AND original_query = $2`,
      [
        listId,
        query,
        resultData.status,
        resultData.results ? JSON.stringify(resultData.results) : null,
      ]
    );
  }
  async getResults(listId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, shopping_list_id, original_query, normalized_query, status, best_price, best_store, 
              best_product_title, best_product_link, thumbnail_url, description, 
              is_approved, raw_response, searched_at 
       FROM shopping_list_items 
       WHERE shopping_list_id = $1
       ORDER BY created_at ASC`,
      [listId]
    );
    return result.rows;
  }

  async selectResult(itemId: string, selection: any): Promise<void> {
    await pool.query(
      `UPDATE shopping_list_items 
       SET best_price = $1, 
           best_store = $2, 
           best_product_title = $3, 
           best_product_link = $4, 
           thumbnail_url = $5, 
           description = $6,
           is_approved = true,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7`,
      [
        selection.price,
        selection.source,
        selection.title,
        selection.link,
        selection.thumbnail,
        selection.description,
        itemId
      ]
    );
  }

  async approveItem(itemId: string, isApproved: boolean): Promise<void> {
    await pool.query(
      'UPDATE shopping_list_items SET is_approved = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [isApproved, itemId]
    );
  }
}
