import { z } from 'zod';

// Interfaces for OpenRouter service
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatPayload {
  messages: ChatMessage[];
}

export interface FormattedRequest {
  messages: ChatMessage[];
  model: string;
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ResponseFormat {
  type: string;
  json_schema?: {
    name: string;
    strict: boolean;
    schema: Record<string, any>;
  };
}

export interface ChatResponse {
  message: string;
  [key: string]: any;
}

// Custom error types
export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class AIServiceNetworkError extends AIServiceError {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AIServiceNetworkError';
  }
}

export class AIServiceRateLimitError extends AIServiceError {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'AIServiceRateLimitError';
  }
}

export class AIServiceValidationError extends AIServiceError {
  constructor(message: string, public validationErrors?: z.ZodError) {
    super(message);
    this.name = 'AIServiceValidationError';
  }
}

export class AIServiceAuthenticationError extends AIServiceError {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AIServiceAuthenticationError';
  }
}

// Schema for NPC Profile JSON response
export const npcProfileResponseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  appearance: z.string().min(1, 'Appearance is required'),
  profession: z.string().min(1, 'Profession is required'),
  relationship_to_party: z.string().min(1, 'Relationship to party is required'),
  scene_description: z.string().max(500, 'Scene description must not exceed 500 characters').nullable().optional(),
  special_traits: z.string().min(1, 'Special traits are required'),
  complexity_level: z.enum(['uproszczony', 'zwykły', 'szczegółowy']).optional(),
  is_public: z.boolean().optional(),
});

// OpenRouter API response schema
export const openRouterResponseSchema = z.object({
  id: z.string(),
  choices: z.array(
    z.object({
      message: z.object({
        role: z.enum(['assistant']),
        content: z.string(),
      }),
      finish_reason: z.enum(['stop', 'length', 'content_filter']),
    })
  ),
  model: z.string(),
  created: z.number(),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }).optional(),
});

export type NpcProfileResponse = z.infer<typeof npcProfileResponseSchema>;
export type OpenRouterResponse = z.infer<typeof openRouterResponseSchema>; 