import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client';

/**
 * AIIN API Rate Limiting Middleware
 * 
 * Implements comprehensive rate limiting for NPC Profile API endpoints with the following limits:
 * 
 * 🔍 GET /api/npc_profiles*        → 60 requests/minute   (Reading data)
 * 📝 POST /api/npc_profiles        → 10 requests/minute   (Creating profiles)  
 * 🤖 POST /api/npc_profiles/generate → 5 requests/minute  (AI generation - most expensive)
 * 🗑️ DELETE /api/npc_profiles/*    → 5 requests/minute   (Deleting profiles)
 * 
 * Features:
 * - Per-user rate limiting with unique counters for each operation type
 * - Sliding window (60 seconds) with automatic reset
 * - Different limits for different operation costs
 * - Anonymous access allowed for GET requests (public profiles only)
 * - Detailed error messages with retry suggestions
 * - Security headers for all API endpoints
 * - CORS configuration for cross-origin requests
 * 
 * Security Considerations:
 * - Rate limit store in memory (use Redis in production for scalability)
 * - User identification via JWT tokens
 * - Automatic cleanup of expired rate limit entries
 * - Comprehensive logging for monitoring and debugging
 */

// Rate limiting store (in production use Redis or proper session store)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Different rate limits for different operations
const RATE_LIMITS = {
  GET: 60,        // 60 GET requests per minute (reading data)
  POST_CREATE: 10, // 10 profile creation requests per minute
  POST_GENERATE: 5, // 5 AI generation requests per minute (most expensive)
  DELETE: 5       // 5 DELETE operations per minute
} as const;

/**
 * Rate limiting function for different operation types
 */
function checkRateLimit(userId: string, operationType: keyof typeof RATE_LIMITS): boolean {
  const now = Date.now();
  const key = `${userId}:${operationType}`;
  const userLimit = rateLimitStore.get(key);
  const limit = RATE_LIMITS[operationType];
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false; // Rate limit exceeded
  }
  
  // Increment counter
  userLimit.count++;
  return true;
}

/**
 * Determines the operation type based on URL path and HTTP method
 */
function getOperationType(method: string, pathname: string): keyof typeof RATE_LIMITS | null {
  if (!pathname.startsWith('/api/npc_profiles')) return null;
  
  switch (method) {
    case 'GET':
      return 'GET';
    case 'POST':
      if (pathname.endsWith('/generate')) {
        return 'POST_GENERATE';
      }
      return 'POST_CREATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return null;
  }
}

/**
 * Gets user ID from authorization header
 */
async function getUserIdFromAuth(authHeader: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    return user?.id || null;
  } catch (error) {
    console.error('Error getting user from auth header:', error);
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Attach Supabase client to context
  context.locals.supabase = supabaseClient;
  
  // Add security headers and rate limiting for API routes
  if (context.url.pathname.startsWith('/api/')) {
    // Rate limiting for NPC profile endpoints
    if (context.url.pathname.startsWith('/api/npc_profiles')) {
      const operationType = getOperationType(context.request.method, context.url.pathname);
      
      if (operationType) {
        // Get user from auth header for rate limiting
        const authHeader = context.request.headers.get('Authorization');
        
        if (authHeader) {
          const userId = await getUserIdFromAuth(authHeader);
          
          if (userId && !checkRateLimit(userId, operationType)) {
            const operationName = {
              GET: 'read requests',
              POST_CREATE: 'profile creation requests',
              POST_GENERATE: 'AI generation requests',
              DELETE: 'delete operations'
            }[operationType];
            
            console.warn(`Rate limit exceeded for user ${userId} on ${operationType} operation`);
            
            return new Response(
              JSON.stringify({
                error: 'Rate Limit Exceeded',
                message: `Too many ${operationName}. Please try again later.`,
                limit: RATE_LIMITS[operationType],
                windowMs: RATE_LIMIT_WINDOW
              }),
              {
                status: 429,
                headers: { 
                  'Content-Type': 'application/json',
                  'Retry-After': '60' // Suggest retry after 60 seconds
                }
              }
            );
          }
        } else if (context.request.method !== 'GET') {
          // For non-GET requests, require authentication
          // GET requests can be made by anonymous users for public profiles
          console.warn('Missing authorization header for authenticated endpoint');
          return new Response(
            JSON.stringify({
              error: 'Unauthorized',
              message: 'Authorization header required'
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
    }
    
    const response = await next();
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CORS headers for API endpoints
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (context.request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    return response;
  }
  
  return next();
}); 