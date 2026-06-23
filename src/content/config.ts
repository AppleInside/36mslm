import { defineCollection, z } from 'astro:content';

const baseFrontmatter = {
  title: z.string(),
  date: z.coerce.date(),
  cover: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
};

const events = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    location: z.string(),
    coords: z.tuple([z.number(), z.number()]).optional(),
    endsAt: z.coerce.date().optional(),
    signupClosesAt: z.coerce.date().optional(),
    signupRequired: z.boolean().default(true),
  }),
});

const recipes = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    category: z.enum(['dolci', 'liquori', 'conserve']).optional(),
    author: z.string().optional(),
    photo: z.string().optional(),
    description: z.string().optional(),
    ingredients: z.array(z.string()).default([]),
    steps: z.array(z.string()).default([]),
    note: z.string().optional(),
    // legacy
    seasons: z.array(z.enum(['primavera', 'estate', 'autunno', 'inverno'])).default([]),
    course: z.enum(['antipasto', 'primo', 'secondo', 'contorno', 'dolce']).optional(),
    dialectName: z.string().optional(),
  }),
});

const itineraries = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    category: z.enum(['naturalistico', 'storico', 'sportivo']).default('naturalistico'),
    description: z.string().optional(),
    terrain: z.string().optional(),
    durationLabel: z.string().optional(),
    distanceKm: z.number(),
    durationMin: z.number(),
    difficulty: z.enum(['facile', 'medio', 'impegnativo']),
    gpx: z.string().optional(),
    pdf: z.string().optional(),
    coords: z.array(z.tuple([z.number(), z.number()])).optional(),
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  }),
});

const stories = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    author: z.string().optional(),
    excerpt: z.string().optional(),
  }),
});

const notices = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    priority: z.boolean().default(false),
    cta: z.string().optional(),
    attachments: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  }),
});

const places = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    kind: z.enum(['ristorante', 'agriturismo', 'b&b', 'azienda', 'altro']),
    address: z.string(),
    coords: z.tuple([z.number(), z.number()]).optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    tripadvisor: z.string().optional(),
  }),
});

const sightings = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['uccello', 'mammifero', 'pesce', 'rettile', 'anfibio', 'pianta', 'altro']),
    coords: z.tuple([z.number(), z.number()]),
    photos: z.array(z.string()).default([]),
    videos: z.array(z.string()).default([]),
    photo: z.string().optional(),
    video: z.string().optional(),
    notes: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { events, recipes, itineraries, stories, notices, places, sightings };
