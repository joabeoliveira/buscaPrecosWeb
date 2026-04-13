import { z } from 'zod';

// ============================================================================
// Validation Schemas - Used across API routes
// ============================================================================

export const SearchBatchSchema = z.object({
  listId: z.string().uuid(),
  itemId: z.string().uuid().optional(),
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
    })
  ])),
});

export const UserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  role: z.enum(['admin', 'helper', 'auditor', 'user']),
  password: z.string().min(4).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export const ApproveItemSchema = z.object({
  isApproved: z.boolean(),
  userId: z.string().uuid().optional(),
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
  userId: z.string().uuid().optional(),
});
