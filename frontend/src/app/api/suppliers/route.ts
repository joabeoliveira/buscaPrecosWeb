import { NextRequest, NextResponse } from 'next/server';
import { SupplierRepository } from '@/app/api/repositories/SupplierRepository';
import { forbiddenResponse, hasRole, isInternalUser, requireAuth } from '@/app/api/lib/auth';
import { z } from 'zod';

const supplierRepo = new SupplierRepository();

const SupplierSchema = z.object({
  name: z.string().min(2),
  url: z.string().url('URL inválida'),
  category: z.string().min(1),
  is_active: z.boolean().default(true),
  free_shipping: z.boolean().default(false),
  min_free_shipping: z.number().nullable().default(null),
  score: z.number().int().min(1).max(10).default(5),
  avg_delivery_days: z.number().int().nullable().default(null),
  notes: z.string().nullable().default(null),
});

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (!isInternalUser(user)) return forbiddenResponse();

    const suppliers = await supplierRepo.listAll();
    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (!hasRole(user, ['super_admin', 'admin', 'helper'])) {
      return forbiddenResponse('Apenas equipe interna pode criar parceiros');
    }

    const body = await request.json();
    const data = SupplierSchema.parse(body);
    const supplier = await supplierRepo.create(data);
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
