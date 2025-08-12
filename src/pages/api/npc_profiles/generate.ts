import type { APIRoute } from 'astro';
import { AIService } from '../../../lib/services/aiService';
import { LogService } from '../../../lib/services/logService';
import { generateNpcProfileSchema } from '../../../lib/schemas/npc-generation.schema';
import { ApiResponse } from '../../../lib/utils/api-response.util';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();
  
  try {
    // 1. Check user authorization from middleware (cookie-based authentication)
    const currentUser = locals.user; // This is set by middleware from cookies
    
    if (!currentUser) {
      console.warn('Unauthorized access attempt to generate NPC profile');
      return ApiResponse.unauthorized('Authentication required to generate NPC profiles');
    }
    
    // 2. Parse and validate request body (consistent error handling)
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return ApiResponse.error('Bad Request', 'Invalid JSON in request body', 400);
    }

    // 3. Validate input with Zod schema
    const validationResult = generateNpcProfileSchema.safeParse(requestBody);

    if (!validationResult.success) {
      console.warn('Validation failed for generate NPC profile:', validationResult.error.errors);
      
      // Format validation errors for client (consistent with create endpoint)
      const formattedErrors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return ApiResponse.validationError(formattedErrors);
    }

    const aiService = new AIService();
    const logService = new LogService(locals.supabase);

    const generatedProfile = await aiService.generateNpcProfile(validationResult.data);

    const duration = Date.now() - startTime;
    await logService.logOperation(
      'GENERATE',
      null, // No profile ID yet as this is just a preview
      currentUser.id, // Use actual user ID from cookie auth
      duration
    );

    console.log(`NPC profile generated successfully in ${duration}ms:`, {
      userId: currentUser.id,
      complexity: validationResult.data.complexity_level
    });

    return ApiResponse.success(generatedProfile);

  } catch (error) {
    // Handle unexpected server errors (consistent with create endpoint)
    console.error('Internal server error in generate NPC profile:', error);
    
    return ApiResponse.internalError('Failed to generate NPC profile');
  }
};