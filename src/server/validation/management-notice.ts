import { z } from 'zod';

const optionalStr = z.string().transform(v => v.trim() || null).nullable();
const optionalDate = z.string().transform(v => v.trim() || null).nullable();

export const managementNoticeSchema = z.object({
  title:      z.string().min(1, 'Titolo obbligatorio').transform(v => v.trim()),
  slug:       z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug: solo minuscole, numeri e trattini'),
  body:       z.string().min(1, 'Testo obbligatorio').transform(v => v.trim()),
  date:       optionalDate,
  priority:   z.preprocess(v => v === 'on' || v === true, z.boolean()).default(false),
  cta:        optionalStr,
  tags:       optionalStr,
  expires_at: optionalDate,
  status:     z.enum(['draft', 'published']),
});

export type ManagementNoticeInput = z.infer<typeof managementNoticeSchema>;
