import type { CreateNpcProfileCommand, GenerateNpcProfileCommand } from '../../types';
import { generateNpcProfileSchema } from '../schemas/npc-generation.schema';
import { z } from 'zod';
import {
  npcProfileResponseSchema,
  openRouterResponseSchema,
  AIServiceError,
  AIServiceNetworkError,
  AIServiceRateLimitError,
  AIServiceValidationError,
  AIServiceAuthenticationError,
} from './aiService.types';
import type {
  ModelParameters,
  ChatMessage,
  ChatPayload,
  FormattedRequest,
  ResponseFormat,
  ChatResponse,
  NpcProfileResponse,
  OpenRouterResponse
} from './aiService.types';

// Configuration
const MAX_RETRY_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10;

export class AIService {
  private apiClient: any;
  private config: {
    endpoint: string;
    apiKey: string;
    model: string;
    parameters: ModelParameters;
  };
  private systemPrompt: string;
  private userPrompt: string;
  private responseFormat?: ResponseFormat;

  // Rate limiting
  private requestTimestamps: number[] = [];
  private pendingRequests = 0;

  constructor(
    private apiKey: string = import.meta.env.OPENROUTER_API_KEY,
    endpoint: string = 'https://openrouter.ai/api/v1/chat/completions',
    model: string = 'anthropic/claude-3-opus'
  ) {
    // Validate API key
    if (!apiKey) {
      throw new AIServiceAuthenticationError('AI service API key is not configured');
    }

    // Initialize configuration
    this.config = {
      endpoint,
      apiKey,
      model,
      parameters: {
        temperature: 0.7,
        max_tokens: 4000,
      },
    };

    // Set default prompts
    this.systemPrompt = 'You are an AI assistant for tabletop RPGs, specialized in creating NPC profiles.';
    this.userPrompt = '';

    // Initialize API client (using native fetch API)
    this.apiClient = {
      post: this._makeApiRequest.bind(this),
    };
  }

  /**
   * Sends a chat message to the OpenRouter API
   * @param message The user message
   * @returns Promise with the chat response
   * @throws {AIServiceError} If the API service fails
   */
  async sendChat(message: string): Promise<ChatResponse> {
    try {
      // Check rate limiting
      this._checkRateLimit();

      const sanitizedMessage = this._sanitizeInput(message);
      const payload: ChatPayload = {
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: this.userPrompt + sanitizedMessage },
        ],
      };

      const formattedRequest = this._formatRequest(payload);
      this.pendingRequests++;
      const response = await this.apiClient.post(this.config.endpoint, formattedRequest);
      this.pendingRequests--;
      
      // Record this request for rate limiting
      this.requestTimestamps.push(Date.now());
      
      // Validate the response format
      const validatedResponse = this._validateResponse(response);
      return this._handleResponse(validatedResponse);
    } catch (error) {
      this.pendingRequests--;
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      console.error('OpenRouter API error:', error);
      
      // Try to extract more meaningful error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to communicate with AI service';
        
      throw new AIServiceError(`Chat API error: ${errorMessage}`);
    }
  }

  /**
   * Updates the model parameters
   * @param params The new model parameters
   */
  updateModelParameters(params: ModelParameters): void {
    // Validate parameter ranges
    if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 1)) {
      throw new AIServiceValidationError('Temperature must be between 0 and 1');
    }
    
    if (params.max_tokens !== undefined && (params.max_tokens < 1 || params.max_tokens > 100000)) {
      throw new AIServiceValidationError('max_tokens must be between 1 and 100000');
    }
    
    this.config.parameters = {
      ...this.config.parameters,
      ...params,
    };
  }

  /**
   * Sets the system prompt
   * @param prompt The system prompt
   */
  setSystemPrompt(prompt: string): void {
    const sanitizedPrompt = this._sanitizeInput(prompt);
    this.systemPrompt = sanitizedPrompt;
  }

  /**
   * Sets the user prompt prefix
   * @param prompt The user prompt prefix
   */
  setUserPrompt(prompt: string): void {
    const sanitizedPrompt = this._sanitizeInput(prompt);
    this.userPrompt = sanitizedPrompt;
  }

  /**
   * Sets the response format
   * @param format The response format
   */
  setResponseFormat(format: ResponseFormat): void {
    this.responseFormat = format;
  }

  /**
   * Generates an NPC profile preview using AI based on the provided command
   * @param command The generation command containing initial prompt and settings
   * @returns A preview of the generated NPC profile in CreateNpcProfileCommand format
   * @throws {AIServiceError} If the AI service fails or returns invalid data
   */
  async generateNpcProfile(command: GenerateNpcProfileCommand): Promise<CreateNpcProfileCommand> {
    try {
      // Validate the command
      const validatedCommand = generateNpcProfileSchema.parse(command);

      // Set system prompt for NPC generation
      this.setSystemPrompt(`
Jesteś asystentem AI dla gier fabularnych (RPG), specjalizujesz się w tworzeniu profili NPC. Twoim zadaniem jest wygenerować kompletny profil postaci w języku polskim zgodnie z poziomem złożoności (complexity_level) oraz poniższymi zasadami. Odpowiadaj wyłącznie prawidłowym JSON-em spełniającym dokładnie podaną strukturę. Nie dodawaj żadnego tekstu poza JSON, bez markdown, bez komentarzy.

Struktura odpowiedzi (klucze i typy):
{
  "name": string,                  // imię i nazwisko lub pseudonim (1–4 słowa)
  "appearance": string,            // opis wyglądu
  "profession": string,            // zawód (1–3 słowa)
  "relationship_to_party": string, // relacja do drużyny
  "scene_description": string,     // opis sceny spotkania
  "special_traits": string,        // cechy szczególne
  "complexity_level": "uproszczony" | "zwykły" | "szczegółowy",
  "is_public": boolean
}

Zasady długości i zawartości względem complexity_level:
- Jeśli complexity_level = "uproszczony":
  - "appearance": 1 krótkie zdanie.
  - "relationship_to_party": 1 krótkie zdanie.
  - "scene_description": "-" (pozycja wymagana, ale treść niewprowadzana na tym poziomie).
  - "special_traits": 1 zdanie.
- Jeśli complexity_level = "zwykły":
  - "appearance": 2 zdania.
  - "relationship_to_party": 1–2 zdania.
  - "scene_description": "-" (pozycja wymagana, ale treść niewprowadzana na tym poziomie).
  - "special_traits": 1 zdanie.
- Jeśli complexity_level = "szczegółowy":
  - "appearance": 4 zdania.
  - "relationship_to_party": 2–3 zdania.
  - "scene_description": 2–4 zdania.
  - "special_traits": 1 zdanie.

Dodatkowe restrykcje:
- "profession": dokładnie 1–3 słowa (bez przecinków i nawiasów).
- Cała odpowiedź ma być po polsku, z pełnymi zdaniami, bez wypunktowań i znaczników.
- Unikaj odniesień sprzecznych z realiami świata przedstawionego, nie używaj współczesnych realiów, jeśli nie wynikają z opisu użytkownika.
- Ustaw "complexity_level" dokładnie na wartość przekazaną w żądaniu.
- Ustaw "is_public" na false.
- Nigdy nie dodawaj żadnych dodatkowych pól ani metadanych.
      `);

      // Set response format for structured output
      this.setResponseFormat({
        type: 'json_schema',
        json_schema: {
          name: 'NpcProfile',
          strict: true,
          schema: {
            name: { type: 'string' },
            appearance: { type: 'string' },
            profession: { type: 'string' },
            relationship_to_party: { type: 'string' },
            scene_description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            special_traits: { type: 'string' },
            complexity_level: { type: 'string' },
            is_public: { type: 'boolean' },
          },
        },
      });

      // Create prompt based on command
      const sanitizedPrompt = this._sanitizeInput(validatedCommand.initial_prompt);
      const prompt = `Stwórz ${validatedCommand.complexity_level} profil NPC na podstawie opisu: ${sanitizedPrompt}`;
      console.log(prompt);
      // Send request to AI service
      const response = await this.sendChat(prompt);
      console.log(response);
      try {
        // Validate and extract profile data from response
        const profileData = npcProfileResponseSchema.parse(response);
        
        // Construct the complete profile with the required fields
        const profile: CreateNpcProfileCommand = {
          name: profileData.name,
          appearance: profileData.appearance,
          profession: profileData.profession,
          relationship_to_party: profileData.relationship_to_party,
          scene_description: profileData.scene_description ?? null,
          special_traits: profileData.special_traits,
          complexity_level: validatedCommand.complexity_level,
          is_public: false,
        };

        return profile;
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new AIServiceValidationError(
            'Failed to validate NPC profile response',
            error
          );
        }
        throw new AIServiceError('Invalid profile format received from AI service');
      }
    } catch (error) {
      // Log the error for monitoring
      console.error('AI service error:', error);
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError('Failed to generate NPC profile');
    }
  }

  /**
   * Formats the request for the OpenRouter API
   * @param payload The chat payload
   * @returns The formatted request
   * @private
   */
  private _formatRequest(payload: ChatPayload): FormattedRequest {
    const request: FormattedRequest = {
      messages: payload.messages,
      model: this.config.model,
      ...this.config.parameters,
    };

    // Add response format if specified
    if (this.responseFormat) {
      request.response_format = this.responseFormat;
    }

    return request;
  }

  /**
   * Validates the response from OpenRouter API
   * @param response The API response to validate
   * @returns The validated response
   * @private
   * @throws {AIServiceValidationError} If the response format is invalid
   */
  private _validateResponse(response: any): OpenRouterResponse {
    try {
      return openRouterResponseSchema.parse(response);
    } catch (error) {
      console.error('Response validation error:', error);
      
      if (error instanceof z.ZodError) {
        throw new AIServiceValidationError(
          'Invalid response format from AI service',
          error
        );
      }
      
      throw new AIServiceValidationError('Invalid response format from AI service');
    }
  }

  /**
   * Handles the response from the OpenRouter API
   * @param response The validated API response
   * @returns The formatted chat response
   * @private
   * @throws {AIServiceValidationError} If parsing the response content fails
   */
  private _handleResponse(response: OpenRouterResponse): ChatResponse {
    try {
      // Extract message content from OpenRouter response structure
      const content = response?.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new AIServiceValidationError('No content in AI service response');
      }

      // If response is JSON string, parse it
      if (this.responseFormat?.type === 'json_schema') {
        try {
          // Check if content is already a object or a string
          const jsonResponse = typeof content === 'string' ? JSON.parse(content) : content;
          return jsonResponse;
        } catch (error) {
          throw new AIServiceValidationError('Failed to parse JSON response from AI service');
        }
      }

      // For text responses
      return { message: content };
    } catch (error) {
      console.error('Error handling response:', error);
      
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceValidationError('Failed to process AI service response');
    }
  }

  /**
   * Makes an API request with retry logic
   * @param url The API endpoint
   * @param data The request data
   * @returns Promise with the API response
   * @private
   * @throws {AIServiceNetworkError} If the request fails after all retries
   * @throws {AIServiceAuthenticationError} If authentication fails
   * @throws {AIServiceRateLimitError} If rate limited by the API
   */
  private async _makeApiRequest(url: string, data: any): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'HTTP-Referer': 'https://aiin.app',
            'User-Agent': 'AIIN/1.0',
          },
          body: JSON.stringify(data),
        });

        // Handle specific error codes
        if (!response.ok) {
          const status = response.status;
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorData.error || response.statusText;
          
          // Authentication errors
          if (status === 401 || status === 403) {
            throw new AIServiceAuthenticationError(`Authentication failed: ${errorMessage}`);
          }
          
          // Rate limiting
          if (status === 429) {
            const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
            throw new AIServiceRateLimitError(`Rate limited by API: ${errorMessage}`, retryAfter);
          }
          
          // General API error
          throw new AIServiceNetworkError(`API error (${status}): ${errorMessage}`, status);
        }

        return await response.json();
      } catch (error) {
        // Don't retry authentication or validation errors
        if (
          error instanceof AIServiceAuthenticationError ||
          error instanceof AIServiceValidationError
        ) {
          throw error;
        }
        
        // For rate limit errors, wait the specified time
        if (error instanceof AIServiceRateLimitError && error.retryAfter) {
          if (attempt < MAX_RETRY_ATTEMPTS - 1) {
            await new Promise(resolve => setTimeout(resolve, error.retryAfter! * 1000));
            continue;
          }
        }
        
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Only retry on network errors or 5xx server errors
        if (
          attempt < MAX_RETRY_ATTEMPTS - 1 && 
          (lastError instanceof AIServiceNetworkError && lastError.statusCode && lastError.statusCode >= 500)
        ) {
          // Exponential backoff: 1s, 2s, 4s, ...
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw lastError;
      }
    }
    
    // Should never reach here, but just in case
    throw lastError || new AIServiceError('Unknown error during API request');
  }

  /**
   * Check if we're within rate limits
   * @private
   * @throws {AIServiceRateLimitError} If rate limit is exceeded
   */
  private _checkRateLimit(): void {
    const now = Date.now();
    
    // Clean up old requests outside the window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    );
    
    // Check if we're at the limit
    if (this.requestTimestamps.length + this.pendingRequests >= MAX_REQUESTS_PER_WINDOW) {
      throw new AIServiceRateLimitError(
        `Rate limit exceeded: Maximum ${MAX_REQUESTS_PER_WINDOW} requests per ${RATE_LIMIT_WINDOW / 1000} seconds`
      );
    }
  }

  /**
   * Sanitize user input to prevent prompt injection
   * @param input The input to sanitize
   * @returns Sanitized input
   * @private
   */
  private _sanitizeInput(input: string): string {
    // Basic sanitization - remove control characters
    let sanitized = input.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    // Security measures for prompt injection prevention
    // Replace sequences that could be used to override system instructions
    sanitized = sanitized.replace(/system:/gi, 'user mentions system:');
    sanitized = sanitized.replace(/\bassistant:/gi, 'user mentions assistant:');
    
    return sanitized;
  }
} 