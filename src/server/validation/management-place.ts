import { z } from 'zod';

const optStr = z.string().transform(v => v.trim() || null).nullable().optional();

export const managementPlaceSchema = z.object({
  title:   z.string().min(1, 'Titolo obbligatorio').transform(v => v.trim()),
  slug:    z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug non valido'),
  kind:    z.enum(['ristorante', 'agriturismo', 'b&b', 'azienda', 'altro']),
  address: z.string().transform(v => v.trim()).default(''),
  phone:   optStr,
  website: optStr,
  tags:    z.string().transform(v => v.trim()).default(''),
  body:    optStr,
  status:  z.enum(['draft', 'published']),
});

export type ManagementPlaceInput = z.infer<typeof managementPlaceSchema>;
