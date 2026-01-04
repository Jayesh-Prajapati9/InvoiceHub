import { z } from 'zod';

export const invoiceItemSchema = z.object({
  itemId: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
  type: z.enum(['ITEM', 'HEADER', 'TIMESHEET']).default('ITEM'),
  name: z.string().min(1, 'Item/Header name is required'),
  description: z.string().optional().nullable(),
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

