import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    emoji: z.string(),
    group: z.enum(['research', 'side', 'hackathon']),
    order: z.number().default(99),
    home: z.boolean().default(false),
    tagline: z.string().optional(),   // short, one line, used on the home page
    links: z.record(z.string(), z.string().url()).default({}),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    date: z.coerce.date(),
    position: z.string(),
    track: z.string().default(''),
    venue: z.string(),
    link: z.string().url().optional(),
  }),
});

export const collections = { blog, projects, events };
