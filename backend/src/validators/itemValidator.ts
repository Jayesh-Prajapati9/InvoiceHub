import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  rate: z.number().positive('Rate must be positive'),
  unit: z.string().default('unit'),
  taxRate: z.number().min(0).max(100).default(0),
  itemType: z.enum(['SALES', 'PURCHASE', 'SERVICE']).default('SALES'),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

