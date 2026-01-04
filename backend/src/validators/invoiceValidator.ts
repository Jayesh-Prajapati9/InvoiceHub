import { z } from 'zod';

export const invoiceItemSchema = z.object({
  itemId: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
  type: z.enum(['ITEM', 'HEADER', 'TIMESHEET']).default('ITEM'),
  name: z.string().optional(),
  description: z.string().optional().nullable(),
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

export const createInvoiceSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  templateId: z.union([z.string().uuid(), z.literal('')]).optional(),
  projectId: z.union([z.string().uuid(), z.literal('')]).optional(),
  paymentTerms: z.enum(['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom']).optional(),
  issueDate: z.string().min(1, 'Issue date is required').refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date format' }
  ),
  dueDate: z.string().min(1, 'Due date is required').refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date format' }
  ),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  quoteId: z.union([z.string().uuid(), z.literal('')]).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
  paidAmount: z.number().min(0).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;

