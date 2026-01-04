import { z } from 'zod';

const baseTimesheetSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  userId: z.string().uuid('Invalid user ID').optional(),
  customUserName: z.string().optional(),
  date: z.string().datetime(),
  hours: z.number().positive('Hours must be positive'),
  description: z.string().optional(),
  billable: z.boolean().default(true),
});

export const createTimesheetSchema = baseTimesheetSchema.refine((data) => {
  // Either userId or customUserName must be provided (at least one)
  if (!data.userId && (!data.customUserName || data.customUserName.trim() === '')) {
    return false;
  }
  // But not both
  if (data.userId && data.customUserName && data.customUserName.trim() !== '') {
    return false;
  }
  return true;
}, {
  message: 'Please either select a user or enter a custom user name',
});

export const updateTimesheetSchema = baseTimesheetSchema.partial().refine((data) => {
  // If both userId and customUserName are provided, that's invalid
  if (data.userId && data.customUserName) {
    return false;
  }
  return true;
}, {
  message: 'Either select a user or enter a custom user name, not both',
});

export type CreateTimesheetInput = z.infer<typeof createTimesheetSchema>;
export type UpdateTimesheetInput = z.infer<typeof updateTimesheetSchema>;

