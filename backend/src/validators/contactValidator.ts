import { z } from 'zod';

export const createContactSchema = z.object({
  // Basic Information - ALL REQUIRED
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number is too long'),
  mobile: z.string().min(1, 'Mobile number is required').max(20, 'Mobile number is too long'),
  company: z.string().min(1, 'Company name is required').max(255, 'Company name is too long'),
  type: z.enum(['CUSTOMER', 'VENDOR'], {
    required_error: 'Contact type is required',
    invalid_type_error: 'Type must be CUSTOMER or VENDOR',
  }),
  customerType: z.enum(['BUSINESS', 'INDIVIDUAL'], {
    required_error: 'Customer type is required',
  }),
  
  // Additional Settings - ALL REQUIRED
  defaultCurrency: z.string().min(1, 'Default currency is required').default('INR'),
  portalStatus: z.enum(['ENABLED', 'DISABLED'], {
    required_error: 'Portal status is required',
  }),
  customerLanguage: z.string().min(1, 'Customer language is required'),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  
  // Billing Address - ALL REQUIRED
  billingAddress: z.string().min(1, 'Billing address is required'),
  billingCity: z.string().min(1, 'Billing city is required'),
  billingState: z.string().min(1, 'Billing state is required'),
  billingZipCode: z.string().min(1, 'Billing ZIP code is required'),
  billingCountry: z.string().min(1, 'Billing country is required'),
  
  // Shipping Address - ALL REQUIRED
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  shippingCity: z.string().min(1, 'Shipping city is required'),
  shippingState: z.string().min(1, 'Shipping state is required'),
  shippingZipCode: z.string().min(1, 'Shipping ZIP code is required'),
  shippingCountry: z.string().min(1, 'Shipping country is required'),
  
  // Legacy address fields (optional for backward compatibility)
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateContactSchema = createContactSchema.partial();

export const createContactPersonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  designation: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
});

export const updateContactPersonSchema = createContactPersonSchema.partial();

export const createActivityLogSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  description: z.string().min(1, 'Description is required'),
  metadata: z.record(z.any()).optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateContactPersonInput = z.infer<typeof createContactPersonSchema>;
export type UpdateContactPersonInput = z.infer<typeof updateContactPersonSchema>;
export type CreateActivityLogInput = z.infer<typeof createActivityLogSchema>;
