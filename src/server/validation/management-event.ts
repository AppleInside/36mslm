import { z } from 'zod';

const optionalStr = z.string().transform(v => v.trim() || null).nullable();

export const managementEventSchema = z.object({
  title: z.string().min(1, 'Titolo obbligatorio').transform(v => v.trim()),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug: solo lettere minuscole, numeri e trattini'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida'),
  date_end: z.preprocess(
    v => (typeof v === 'string' && v.trim()) ? v.trim() : null,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
  ),
  time_start: optionalStr,
  time_end: optionalStr,
  location: optionalStr,
  description: optionalStr,
  cover_type: z.enum(['cover', 'locandina']).default('cover'),
  signup_required: z.preprocess(v => v === 'on' || v === true, z.boolean()).default(false),
  status: z.enum(['draft', 'published']),
  publish_at: z.string().transform(v => v.trim() || null).nullable().optional().default(null),
});

export type ManagementEventInput = z.infer<typeof managementEventSchema>;
