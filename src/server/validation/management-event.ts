import { z } from 'zod';

const optionalStr = z.string().transform(v => v.trim() || null).nullable();

export const managementEventSchema = z.object({
  title: z.string().min(1, 'Titolo obbligatorio').transform(v => v.trim()),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug: solo lettere minuscole, numeri e trattini'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida'),
  time_start: optionalStr,
  time_end: optionalStr,
  location: optionalStr,
  description: optionalStr,
  signup_required: z.preprocess(v => v === 'on' || v === true, z.boolean()).default(false),
  status: z.enum(['draft', 'published']),
  publish_at: z.string().transform(v => v.trim() || null).nullable().optional().default(null),
});

export type ManagementEventInput = z.infer<typeof managementEventSchema>;
