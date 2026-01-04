import { z } from 'zod';

export const quoteItemSchema = z.object({
  itemId: z.union([z.string().uuid(), z.literal('')]).optional(),
  type: z.enum(['ITEM', 'HEADER', 'TIMESHEET']).default('ITEM'),
  name: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().min(0).default(0),
  rate: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
}).superRefine((data, ctx) => {
  // HEADER
  if (data.type === 'HEADER') {
    if (!data.name || data.name.trim().length === 0) {
      ctx.addIssue({
        path: ['name'],
        message: 'Header name is required',
        code: z.ZodIssueCode.custom,
      });
    }
    return;
  }

  // TIMESHEET
  if (data.type === 'TIMESHEET') {
    if (!data.name || data.name.trim().length === 0) {
      ctx.addIssue({
        path: ['name'],
        message: 'Timesheet item name is required',
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.quantity <= 0 || data.rate <= 0) {
      ctx.addIssue({
        path: ['quantity'],
        message: 'Timesheet hours and rate must be positive',
        code: z.ZodIssueCode.custom,
      });
    }
    return;
  }

  // ITEM
  if (!data.name || data.name.trim().length === 0) {
    ctx.addIssue({
      path: ['name'],
      message: 'Item name is required',
      code: z.ZodIssueCode.custom,
    });
  }

  if (data.quantity <= 0 || data.rate <= 0) {
    ctx.addIssue({
      path: ['quantity'],
      message: 'Quantity and rate must be positive for items',
      code: z.ZodIssueCode.custom,
    });
  }
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

