import { z } from 'zod';

export const eventSignupSchema = z.object({
  eventSlug: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('').transform(() => undefined)),
  partySize: z.coerce.number().int().min(1).max(20),
  notes: z.string().trim().max(2000).optional().or(z.literal('').transform(() => undefined)),
  sourceLang: z.enum(['it', 'en']),
});

export type EventSignupInput = z.infer<typeof eventSignupSchema>;
