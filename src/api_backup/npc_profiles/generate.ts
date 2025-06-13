import type { APIRoute } from 'astro';
import { MockAIService } from '../../../lib/services/aiService.mock';
import { LogService } from '../../../lib/services/logService';
import { generateNpcProfileSchema } from '../../../lib/schemas/npc-generation.schema';
import { ApiResponse } from '../../../lib/utils/api-response.util';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();
  
  try {
    // 1. Check user authorization (consistent with create endpoint)
    const supabase = locals.supabase;
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Missing or invalid Authorization header for generate NPC profile');
      return ApiResponse.unauthorized('Authorization header with Bearer token is required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn('Unauthorized access attempt to generate NPC profile:', authError?.message);
      return ApiResponse.unauthorized();
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

    const aiService = new MockAIService();
    const logService = new LogService(supabase);

    const generatedProfile = await aiService.generateNpcProfile(validationResult.data);

    const duration = Date.now() - startTime;
    await logService.logOperation(
      'GENERATE',
      null, // No profile ID yet as this is just a preview
      user.id, // Use actual user ID instead of dummy
      duration
    );

    console.log(`NPC profile generated successfully in ${duration}ms:`, {
      userId: user.id,
      complexity: validationResult.data.complexity_level
    });

    return ApiResponse.success(generatedProfile);

  } catch (error) {
    // Handle unexpected server errors (consistent with create endpoint)
    console.error('Internal server error in generate NPC profile:', error);
    
    return ApiResponse.internalError('Failed to generate NPC profile');
  }
};