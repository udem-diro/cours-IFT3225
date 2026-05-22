import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const sessions = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/sessions' }),
  schema: z.object({
    numero: z.number(),
    title: z.string(),
    date: z.string(),
    tags: z.array(z.enum(['cours', 'labo', 'devoir', 'examen'])),
    summary: z.string().optional(),
  }),
});

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema(),
});

export const collections = { sessions, docs };
