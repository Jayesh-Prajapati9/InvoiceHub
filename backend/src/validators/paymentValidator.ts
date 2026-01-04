import { z } from 'zod';

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  paymentNumber: z.string().optional(), // Will be auto-generated if not provided
  amountReceived: z.number().positive('Amount received must be greater than 0'),
  bankCharges: z.number().nonnegative('Bank charges cannot be negative').optional(),
  pan: z.string().optional(),
  taxDeducted: z.boolean().default(false),
  tdsAmount: z.number().nonnegative('TDS amount cannot be negative').optional(),
  paymentDate: z.string().or(z.date()),
  paymentMode: z.enum(['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Debit Card']),
  paymentReceivedOn: z.string().or(z.date()).optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'PAID']).default('DRAFT'),
});

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  invoiceId: z.string().uuid('Invalid invoice ID').optional(),
  amountReceived: z.number().positive('Amount received must be greater than 0').optional(),
  paymentMode: z.enum(['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Debit Card']).optional(),
  status: z.enum(['DRAFT', 'PAID']).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

