import { z } from 'zod';
import type { ComplexityLevel } from '../../types';

// Validation schema for complexity level
const complexityLevelSchema = z.enum(['uproszczony', 'zwykły', 'szczegółowy'] as const);

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