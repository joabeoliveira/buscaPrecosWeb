import { pool } from '@/services/db/pool';
import type { ShoppingList } from '@/types/database';

type ListItemInput = {
  query: string;
  unit?: string | null;
  quantity?: number | null;
  category_id?: string | null;
  sku_grade?: string | null;
  target_price?: number | null;
};

export class ListRepository {
  async create(
    name: string, 
    items: (ListItemInput | string)[], 
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
          `INSERT INTO shopping_list_items
           (shopping_list_id, original_query, unit, quantity, category_id, sku_grade, target_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            listId,
            itemObj.query,
            itemObj.unit || 'un',
            itemObj.quantity || 1.0,
            itemObj.category_id || null,
            itemObj.sku_grade || null,
            itemObj.target_price ?? null,
          ]
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
      `SELECT sli.id, sli.shopping_list_id, sli.original_query, sli.normalized_query, sli.status,
              sli.best_price, sli.best_store, sli.best_product_title, sli.best_product_link,
              sli.thumbnail_url, sli.description, sli.is_approved, sli.raw_response,
              sli.searched_at, sli.unit, sli.quantity, sli.category_id, sli.sku_grade,
              sli.target_price, ic.name as category_name
       FROM shopping_list_items sli
       LEFT JOIN item_categories ic ON sli.category_id = ic.id
       WHERE shopping_list_id = $1
       ORDER BY sli.created_at ASC`,
      [listId]
    );
    return result.rows;
  }

  async listPendingClientNotifications(limit = 25): Promise<any[]> {
    const result = await pool.query(
      `SELECT
          sl.id,
          sl.name,
          sl.status,
          sl.total_items,
          sl.created_at,
          sl.completed_at,
          sl.client_id,
          sl.internal_code,
          sl.notification_status,
          sl.client_notified_at,
          c.name as client_name,
          c.email as client_email,
          c.phone as client_phone,
          COALESCE(
            json_agg(
              json_build_object(
                'id', sli.id,
                'original_query', sli.original_query,
                'unit', sli.unit,
                'quantity', sli.quantity,
                'category_name', ic.name,
                'sku_grade', sli.sku_grade,
                'target_price', sli.target_price,
                'best_price', sli.best_price,
                'best_store', sli.best_store,
                'best_product_title', sli.best_product_title,
                'best_product_link', sli.best_product_link,
                'is_approved', sli.is_approved,
                'status', sli.status
              )
              ORDER BY sli.created_at ASC
            ) FILTER (WHERE sli.id IS NOT NULL),
            '[]'::json
          ) as items
       FROM shopping_lists sl
       LEFT JOIN clients c ON sl.client_id = c.id
       LEFT JOIN shopping_list_items sli ON sli.shopping_list_id = sl.id
       LEFT JOIN item_categories ic ON sli.category_id = ic.id
       WHERE sl.status = 'completed'
         AND sl.client_id IS NOT NULL
         AND COALESCE(sl.notification_status, 'pending') IN ('pending', 'failed')
       GROUP BY sl.id, c.id
       ORDER BY sl.completed_at ASC NULLS LAST, sl.created_at ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async markClientNotification(listId: string, status: 'queued' | 'sent' | 'failed'): Promise<void> {
    const result = await pool.query(
      `UPDATE shopping_lists
       SET notification_status = $2,
           client_notified_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE client_notified_at END
       WHERE id = $1
         AND client_id IS NOT NULL`,
      [listId, status]
    );

    if (result.rowCount === 0) throw new Error('Quotation not found');
  }

  async selectResult(listId: string, itemId: string, selection: any, userId: string | null = null): Promise<void> {
    const result = await pool.query(
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
       WHERE id = $8 AND shopping_list_id = $9`,
      [
        selection.price, 
        selection.source, 
        selection.title, 
        selection.link, 
        selection.thumbnail, 
        selection.description,
        userId,
        itemId,
        listId
      ]
    );
    if (result.rowCount === 0) throw new Error('Item not found');
  }

  async approveItem(listId: string, itemId: string, isApproved: boolean, userId: string | null = null): Promise<void> {
    const result = await pool.query(
      'UPDATE shopping_list_items SET is_approved = $1, analyzed_by_id = $2, updated_at = NOW() WHERE id = $3 AND shopping_list_id = $4',
      [isApproved, userId, itemId, listId]
    );
    if (result.rowCount === 0) throw new Error('Item not found');
  }

  async getItems(listId: string): Promise<string[]> {
    const result = await pool.query(
      'SELECT original_query FROM shopping_list_items WHERE shopping_list_id = $1',
      [listId]
    );
    return result.rows.map(row => row.original_query);
  }

  async getItemById(itemId: string, listId?: string): Promise<string> {
    const params = listId ? [itemId, listId] : [itemId];
    const result = await pool.query(
      `SELECT original_query FROM shopping_list_items WHERE id = $1${listId ? ' AND shopping_list_id = $2' : ''}`,
      params
    );
    if (result.rowCount === 0) throw new Error('Item not found');
    return result.rows[0].original_query;
  }

  async updateItemResult(listId: string, query: string, data: { status: string, results: any[], canonical_product_id?: string | undefined, auto_selected?: boolean | undefined, offer_score?: number | undefined, opportunity_flags?: string[] | undefined }): Promise<void> {
    const bestItem = data.results.length > 0 ? data.results[0] : null;
    
    let updateQuery = `
       UPDATE shopping_list_items 
       SET status = $1, 
           raw_response = $2, 
           searched_at = NOW(),
           canonical_product_id = COALESCE($5, canonical_product_id)
    `;
    const params: any[] = [data.status, JSON.stringify(data.results), listId, query, data.canonical_product_id];

    if (data.auto_selected && bestItem) {
      updateQuery += `,
           auto_selected = true,
           offer_score = $6,
           opportunity_flags = $7,
           best_price = $8,
           best_store = $9,
           best_product_title = $10,
           best_product_link = $11,
           thumbnail_url = $12
      `;
      params.push(data.offer_score, JSON.stringify(data.opportunity_flags || []), bestItem.price, bestItem.source, bestItem.title, bestItem.link, bestItem.thumbnail);
    } else if (data.offer_score !== undefined) {
      updateQuery += `,
           offer_score = $6,
           opportunity_flags = $7
      `;
      params.push(data.offer_score, JSON.stringify(data.opportunity_flags || []));
    }

    updateQuery += ` WHERE shopping_list_id = $3 AND original_query = $4`;

    await pool.query(updateQuery, params);

    // If all items in the list are processed, update list status to 'completed'
    const allItemsStatus = await pool.query(
      'SELECT COUNT(*) as count FROM shopping_list_items WHERE shopping_list_id = $1 AND status = \'pending\'',
      [listId]
    );

    if (parseInt(allItemsStatus.rows[0].count) === 0) {
      await pool.query(
        `UPDATE shopping_lists
         SET status = 'completed',
             completed_at = COALESCE(completed_at, NOW()),
             notification_status = COALESCE(notification_status, 'pending')
         WHERE id = $1`,
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
