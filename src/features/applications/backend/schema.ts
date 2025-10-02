import { z } from 'zod';

export const CreateApplicationSchema = z.object({
  campaignId: z.string().uuid(),
  note: z.string().max(500).optional(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;

export const CreatedApplicationSchema = z.object({ id: z.string().uuid() });
export type CreatedApplication = z.infer<typeof CreatedApplicationSchema>;


