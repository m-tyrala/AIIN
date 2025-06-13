import { z } from 'zod';

// Validation schema for complexity level - using database enum values
const complexityLevelSchema = z.enum(['uproszczony', 'zwykły', 'szczegółowy']);

// Schema for generating NPC profile
export const generateNpcProfileSchema = z.object({
  initial_prompt: z.string()
    .min(1, 'Initial prompt is required')
    .max(1000, 'Initial prompt must be less than 1000 characters'),
  complexity_level: complexityLevelSchema,
  existing_profile_ids: z.array(z.string().uuid())
    .optional()
    .default([])
});

// Type inference from schema
export type GenerateNpcProfileSchema = z.infer<typeof generateNpcProfileSchema>; 