import { NextRequest, NextResponse } from 'next/server';
import { SupplierRepository } from '@/app/api/repositories/SupplierRepository';
import { forbiddenResponse, hasRole, requireAuth } from '@/app/api/lib/auth';
import { z } from 'zod';

const supplierRepo = new SupplierRepository();

const SupplierUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  url: z.string().url('URL inválida').optional(),
  category: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
  free_shipping: z.boolean().optional(),
  min_free_shipping: z.number().nullable().optional(),
  score: z.number().int().min(1).max(10).optional(),
  avg_delivery_days: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (!hasRole(user, ['super_admin', 'admin', 'helper'])) {
      return forbiddenResponse('Apenas equipe interna pode editar parceiros');
    }

    const { id } = await params;
    const body = await request.json();
    const data = SupplierUpdateSchema.parse(body);
    const supplier = await supplierRepo.update(id, data);
    if (!supplier) return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (!hasRole(user, ['super_admin', 'admin'])) {
      return forbiddenResponse('Apenas administradores podem excluir parceiros');
    }

    const { id } = await params;
    await supplierRepo.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
