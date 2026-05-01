import { NextRequest, NextResponse } from 'next/server';
import { SupplierRepository } from '@/app/api/repositories/SupplierRepository';
import { ListRepository } from '@/app/api/repositories/ListRepository';
import { N8nScraperProvider } from '@/app/api/services/providers/N8nScraperProvider';
import { z } from 'zod';

const scraper = new N8nScraperProvider();
const supplierRepo = new SupplierRepository();
const listRepo = new ListRepository();

const DirectSearchSchema = z.object({
  itemId: z.string().uuid('itemId inválido'),
  supplierId: z.string().uuid('supplierId inválido'),
  listId: z.string().uuid('listId inválido'),
  query: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, supplierId, listId, query } = DirectSearchSchema.parse(body);

    // 1. Load supplier
    const supplier = await supplierRepo.getById(supplierId);
    if (!supplier) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 });
    }

    console.log(`[DirectSearch] Searching "${query}" on ${supplier.name} (${supplier.url})`);

    // 2. Call n8n webhook synchronously — no queue, wait for response
    const result = await scraper.searchProduct(query, {
      forceRefresh: true, // skip cache so we always get fresh results from this supplier
      listId,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        url: supplier.url,
        category: supplier.category,
      },
    });

    // 3. Persist result in the database item
    if (result.status === 'found' && result.results.length > 0) {
      await listRepo.updateItemResult(listId, query, {
        status: 'found',
        results: result.results,
      });
    } else if (result.status !== 'found') {
      // Only update to not_found if item was pending — don't overwrite an existing found result
      const currentItem = await listRepo.getItems(listId);
      const items = Array.isArray(currentItem) ? currentItem : [currentItem];
      const isStillPending = items.some((q: string) => q === query);
      if (isStillPending) {
        await listRepo.updateItemResult(listId, query, {
          status: 'not_found',
          results: [],
        });
      }
    }

    // 4. Return results to frontend for immediate display
    return NextResponse.json({
      status: result.status,
      results: result.results,
      supplier: {
        name: supplier.name,
        url: supplier.url,
      },
      query,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 });
    }
    console.error('[DirectSearch] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
