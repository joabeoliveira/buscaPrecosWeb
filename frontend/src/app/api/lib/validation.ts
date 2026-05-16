import { z } from 'zod';

// ============================================================================
// Validation Schemas - Used across API routes
// ============================================================================

export const SearchBatchSchema = z.object({
  listId: z.string().uuid(),
  itemId: z.string().uuid().optional(),
  providers: z.array(z.string()).optional(),
  supplierId: z.string().uuid().optional(),
});

export const CreateListSchema = z.object({
  name: z.string().min(3),
  clientId: z.string().uuid().nullable().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  internalCode: z.string().nullable().optional(),
  items: z.array(z.union([
    z.string(),
    z.object({
      query: z.string(),
      unit: z.string().optional(),
      quantity: z.number().optional(),
      category_id: z.string().uuid().nullable().optional(),
      sku_grade: z.string().nullable().optional(),
      target_price: z.number().nullable().optional(),
    })
  ])),
});

export const UserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  role: z.enum(['super_admin', 'admin', 'helper', 'auditor', 'user', 'client_admin', 'client_buyer']),
  client_id: z.string().uuid().nullable().optional(),
  password: z.string().min(4).optional(),
});

export const ClientSchema = z.object({
  name: z.string().min(2),
  document: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional(),
  trade_name: z.string().nullable().optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CategorySchema = z.object({
  name: z.string().min(2).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export const ApproveItemSchema = z.object({
  isApproved: z.boolean(),
});

export const SelectResultSchema = z.object({
  selection: z.object({
    price: z.number(),
    source: z.string(),
    title: z.string(),
    link: z.string(),
    thumbnail: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
});
