import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(), // For backward compatibility
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20, 'Phone number is too long').regex(/^[\d\s\-\+\(\)]+$/, 'Phone number can only contain numbers, spaces, hyphens, parentheses, and plus sign'),
  country: z.string().min(1, 'Country is required'),
  zipCode: z.string().min(1, 'ZIP code is required').max(10, 'ZIP code is too long').regex(/^[A-Za-z0-9\s\-]+$/, 'ZIP code can only contain letters, numbers, spaces, and hyphens'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20, 'Phone number is too long').regex(/^[\d\s\-\+\(\)]+$/, 'Phone number can only contain numbers, spaces, hyphens, parentheses, and plus sign'),
  country: z.string().min(1, 'Country is required'),
  zipCode: z.string().min(1, 'ZIP code is required').max(10, 'ZIP code is too long').regex(/^[A-Za-z0-9\s\-]+$/, 'ZIP code can only contain letters, numbers, spaces, and hyphens'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

