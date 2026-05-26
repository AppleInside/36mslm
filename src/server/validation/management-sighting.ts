import { z } from 'zod';

const optStr = z.string().transform(v => v.trim() || null).nullable().optional();

export const managementSightingSchema = z.object({
  title:      z.string().min(1, 'Titolo obbligatorio').transform(v => v.trim()),
  slug:       z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug non valido'),
  category:   z.enum(['uccello', 'mammifero', 'pesce', 'rettile', 'anfibio', 'pianta', 'altro']),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida').optional().default(''),
  coords_lat: optStr,
  coords_lng: optStr,
  notes:      optStr,
  body:       optStr,
  status:     z.enum(['draft', 'published']),
});

export type ManagementSightingInput = z.infer<typeof managementSightingSchema>;
