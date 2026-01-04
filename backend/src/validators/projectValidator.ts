import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  contactId: z.string().uuid('Invalid contact ID'),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).default('ACTIVE'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  addToDashboard: z.boolean().optional().default(false),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

