import { z } from 'zod';

export const waitlistSchema = z.object({
  email: z.string().email().max(254),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
