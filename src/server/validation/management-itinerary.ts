import { z } from 'zod';

const optStr = z.string().transform(v => v.trim() || null).nullable().optional();
const optNum = (fn: (s: string) => number) =>
  z.string().transform(v => { const n = fn(v.trim()); return isNaN(n) ? null : n; }).nullable().optional();

export const managementItinerarySchema = z.object({
  title:          z.string().min(1, 'Titolo obbligatorio').transform(v => v.trim()),
  slug:           z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug non valido'),
  category:       z.enum(['naturalistico', 'storico', 'sportivo']),
  difficulty:     z.enum(['facile', 'medio', 'impegnativo']),
  description:    optStr,
  distance_km:    optNum(parseFloat),
  duration_min:   optNum(parseInt),
  terrain:        optStr,
  duration_label: optStr,
  body:           optStr,
  status:         z.enum(['draft', 'published']),
  mode_piedi:     z.string().optional(),
  mode_bici:      z.string().optional(),
  coords_json:    z.string().transform(v => v.trim() || null).nullable().optional(),
});

export type ManagementItineraryInput = z.infer<typeof managementItinerarySchema>;
