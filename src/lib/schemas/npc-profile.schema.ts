import { z } from 'zod';
import type { ComplexityLevel } from '../../types';

/**
 * Zod schema for validating UUID format
 * Used for validating profile IDs in API endpoints
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Zod schema for validating create NPC profile request data
 * Based on the CreateNpcProfileCommand type and database constraints
 */
export const createNpcProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters'),
  
  appearance: z.string()
    .min(1, 'Appearance description is required')
    .max(500, 'Appearance description must not exceed 500 characters'),
  
  profession: z.string()
    .min(1, 'Profession is required')
    .max(100, 'Profession must not exceed 100 characters'),
  
  relationship_to_party: z.string()
    .min(1, 'Relationship to party is required')
    .max(500, 'Relationship to party must not exceed 500 characters'),
  
  scene_description: z.string()
    .max(500, 'Scene description must not exceed 500 characters')
    .optional()
    .nullable(),
  
  special_traits: z.string()
    .min(1, 'Special traits are required')
    .max(150, 'Special traits must not exceed 150 characters'),
  
  complexity_level: z.enum(['uproszczony', 'zwykły', 'szczegółowy'], {
    required_error: 'Complexity level is required',
    invalid_type_error: 'Complexity level must be one of: uproszczony, zwykły, szczegółowy'
  }),
  
  is_public: z.boolean({
    required_error: 'Public flag is required',
    invalid_type_error: 'Public flag must be boolean'
  })
});

/**
 * Type inference from the schema for use in TypeScript
 */
export type CreateNpcProfileInput = z.infer<typeof createNpcProfileSchema>;

/**
 * Zod schema for validating list NPC profiles query parameters
 * Used for GET /api/npc_profiles endpoint with pagination and filtering
 */
export const listNpcProfilesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum([
    "created_at asc", "created_at desc",
    "updated_at asc", "updated_at desc", 
    "name asc", "name desc"
  ]).default("created_at desc"),
  is_public: z.union([
    z.boolean(),
    z.string().transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      throw new Error('Invalid boolean value');
    })
  ]).optional(),
  user_id: z.string().uuid().optional(),
  search: z.string().max(200).transform(val => val.trim()).optional()
});

/**
 * Type inference from the list query schema
 */
export type ListNpcProfilesInput = z.infer<typeof listNpcProfilesQuerySchema>;

/**
 * Zod schema for validating update NPC profile request data
 * Based on the UpdateNpcProfileCommand type - all fields are optional
 * At least one field must be provided for update
 */
export const updateNpcProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
  
  appearance: z.string()
    .min(1, 'Appearance description cannot be empty')
    .max(500, 'Appearance description must not exceed 500 characters')
    .optional(),
  
  profession: z.string()
    .min(1, 'Profession cannot be empty')
    .max(100, 'Profession must not exceed 100 characters')
    .optional(),
  
  relationship_to_party: z.string()
    .min(1, 'Relationship to party cannot be empty')
    .max(500, 'Relationship to party must not exceed 500 characters')
    .optional(),
  
  scene_description: z.string()
    .max(500, 'Scene description must not exceed 500 characters')
    .optional()
    .nullable(),
  
  special_traits: z.string()
    .min(1, 'Special traits cannot be empty')
    .max(150, 'Special traits must not exceed 150 characters')
    .optional(),
  
  complexity_level: z.enum(['uproszczony', 'zwykły', 'szczegółowy'], {
    invalid_type_error: 'Complexity level must be one of: uproszczony, zwykły, szczegółowy'
  }).optional(),
  
  is_public: z.boolean({
    invalid_type_error: 'Public flag must be boolean'
  }).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

/**
 * Type inference from the update schema
 */
export type UpdateNpcProfileInput = z.infer<typeof updateNpcProfileSchema>; 