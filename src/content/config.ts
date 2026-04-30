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
    seasons: z.array(z.enum(['primavera', 'estate', 'autunno', 'inverno'])).default([]),
    course: z.enum(['antipasto', 'primo', 'secondo', 'contorno', 'dolce']),
    dialectName: z.string().optional(),
  }),
});

const itineraries = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    distanceKm: z.number(),
    durationMin: z.number(),
    difficulty: z.enum(['facile', 'medio', 'impegnativo']),
    gpx: z.string().optional(),
    pdf: z.string().optional(),
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
  }),
});

export const collections = { events, recipes, itineraries, stories, notices, places };
