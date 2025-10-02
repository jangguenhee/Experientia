import { z } from 'zod';

export const SubmitReviewSchema = z.object({
  applicationId: z.string().uuid(),
  reviewUrl: z.string().url(),
});

export type SubmitReviewInput = z.infer<typeof SubmitReviewSchema>;

export const SubmittedReviewSchema = z.object({ id: z.string().uuid() });
export type SubmittedReview = z.infer<typeof SubmittedReviewSchema>;


