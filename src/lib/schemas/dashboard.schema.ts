import { z } from 'zod';

// Schema for User
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.string().optional(),
});

// Schema for DashboardFilters
export const DashboardFiltersSchema = z.object({
  search: z.string().max(200).transform(val => val.trim()),
  isPublic: z.boolean().optional(),
  sort: z.enum([
    "created_at asc", 
    "created_at desc", 
    "updated_at asc", 
    "updated_at desc", 
    "name asc", 
    "name desc"
  ]),
});

// Schema for PaginationState
export const PaginationStateSchema = z.object({
  currentPage: z.number().int().min(1),
  totalPages: z.number().int().min(0),
  totalCount: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
  limit: z.number().int().min(1).max(100),
});

// Schema for pagination query parameters
export const PaginationQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(12),
});

// Schema for search input validation
export const SearchInputSchema = z.string()
  .max(200, "Wyszukiwana fraza nie może być dłuższa niż 200 znaków")
  .transform(val => val.trim());

// Schema for sort validation
export const SortValidationSchema = z.enum([
  "created_at asc", 
  "created_at desc", 
  "updated_at asc", 
  "updated_at desc", 
  "name asc", 
  "name desc"
]).default("created_at desc");

// Types derived from schemas
export type UserType = z.infer<typeof UserSchema>;
export type DashboardFiltersType = z.infer<typeof DashboardFiltersSchema>;
export type PaginationStateType = z.infer<typeof PaginationStateSchema>;
export type PaginationQueryType = z.infer<typeof PaginationQuerySchema>;
export type SearchInputType = z.infer<typeof SearchInputSchema>;
export type SortValidationType = z.infer<typeof SortValidationSchema>; 