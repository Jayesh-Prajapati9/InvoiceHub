import { z } from 'zod';

export const quoteItemSchema = z.object({
  itemId: z.union([z.string().uuid(), z.literal('')]).optional(),
  type: z.enum(['ITEM', 'HEADER', 'TIMESHEET']).default('ITEM'),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().min(0).default(0),
  rate: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
}).refine((data) => {
  // Headers don't need quantity/rate validation, just need a name
  if (data.type === 'HEADER') {
    return data.name && data.name.trim().length > 0;
  }
  // Timesheet items need positive quantity and rate, and a name
  if (data.type === 'TIMESHEET') {
    return data.quantity > 0 && data.rate > 0 && data.name && data.name.trim().length > 0;
  }
  // Items need positive quantity and rate, and a name
  return data.quantity > 0 && data.rate > 0 && data.name && data.name.trim().length > 0;
}, {
  message: (data) => {
    if (data.type === 'HEADER') {
      return 'Header name is required';
    }
    if (data.type === 'TIMESHEET') {
      if (!data.name || data.name.trim().length === 0) {
        return 'Timesheet item name is required';
      }
      return 'Timesheet hours and rate must be positive';
    }
    if (!data.name || data.name.trim().length === 0) {
      return 'Item name is required';
    }
    return 'Quantity and rate must be positive for items';
  },
  path: ['name'],
});

export const createQuoteSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  templateId: z.union([z.string().uuid(), z.literal('')]).optional(),
  projectId: z.union([z.string().uuid(), z.literal('')]).optional(),
  paymentTerms: z.enum(['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom']).optional(),
  issueDate: z.string().min(1, 'Issue date is required').refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date format' }
  ),
  expiryDate: z.string().min(1, 'Expiry date is required').refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date format' }
  ),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

export const updateQuoteSchema = createQuoteSchema.partial();

export const updateQuoteStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'INVOICED']),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;

