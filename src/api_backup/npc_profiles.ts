import type { APIRoute } from 'astro';
import { createNpcProfileSchema, listNpcProfilesQuerySchema } from '../../lib/schemas/npc-profile.schema';
import { NpcProfileService } from '../../lib/services/npc-profile.service';
import { ApiResponse } from '../../lib/utils/api-response.util';
import { AuthUtil } from '../../lib/utils/auth.util';
import type { CreateNpcProfileCommand, NpcProfileDTO, PaginatedResponse } from '../../types';
import { ZodError } from 'zod';

export const prerender = false;

/**
 * GET /api/npc_profiles - Get paginated list of NPC profiles with filtering and sorting
 * 
 * Query parameters:
 * - page: number (default: 1, min: 1) - page number for pagination
 * - limit: number (default: 10, min: 1, max: 100) - number of items per page
 * - sort: string (default: "created_at desc") - sorting criteria
 * - is_public: boolean - filter by public/private profiles
 * - user_id: string (UUID) - filter by user ID (only for admins or own profiles)
 * 
 * Response: 200 OK with PaginatedResponse<NpcProfileDTO>
 * 
 * Error responses:
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Invalid session
 * - 500 Internal Server Error: Database or server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
      sort: url.searchParams.get('sort'),
      is_public: url.searchParams.get('is_public'),
      user_id: url.searchParams.get('user_id')
    };

    let validatedQuery;
    try {
      validatedQuery = listNpcProfilesQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        console.warn('Query validation failed:', validationErrors);
        return ApiResponse.validationError(validationErrors);
      }
      throw error;
    }

    // 2. Verify user authentication
    const supabase = locals.supabase;
    const token = AuthUtil.extractTokenFromRequest(request);
    if (!token) {
      console.warn('Missing Authorization header for NPC profiles list');
      return ApiResponse.unauthorized('Authorization header with Bearer token is required');
    }
    
    const authResult = await AuthUtil.verifyUser(supabase, token);
    
    if (!authResult.success) {
      console.warn('Unauthorized access attempt to NPC profiles list');
      return authResult.response!;
    }

    const currentUser = authResult.user!;

    // 3. Initialize service and fetch profiles
    const npcProfileService = new NpcProfileService(supabase);
    
    const result: PaginatedResponse<NpcProfileDTO> = await npcProfileService.listProfiles(
      validatedQuery,
      currentUser.id
    );

    console.log(`NPC profiles API request completed successfully:`, {
      userId: currentUser.id,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sort: validatedQuery.sort,
      totalReturned: result.data.length,
      totalCount: result.pagination.total
    });

    return ApiResponse.success(result);

  } catch (error) {
    console.error("Error in GET /api/npc_profiles:", error);
    
    // Handle specific error types with appropriate messages
    if (error instanceof Error) {
      if (error.message.includes('Failed to list NPC profiles')) {
        return ApiResponse.internalError('Failed to retrieve NPC profiles');
      }
    }
    
    return ApiResponse.internalError('An unexpected error occurred while fetching NPC profiles');
  }
};

/**
 * POST /api/npc_profiles - Create new NPC profile
 * 
 * Request body: CreateNpcProfileCommand (validated with Zod)
 * Response: 201 Created with NpcProfileDTO
 * 
 * Error responses:
 * - 400 Bad Request: Invalid input data
 * - 401 Unauthorized: Missing user session
 * - 500 Internal Server Error: Database or server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Check user authorization
    const supabase = locals.supabase;
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Missing or invalid Authorization header');
      return ApiResponse.unauthorized('Authorization header with Bearer token is required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn('Unauthorized access attempt to create NPC profile:', authError?.message);
      return ApiResponse.unauthorized();
    }

    // 2. Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return ApiResponse.error('Bad Request', 'Invalid JSON in request body', 400);
    }

    // 3. Validate input with Zod schema
    const validationResult = createNpcProfileSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      console.warn('Validation failed for create NPC profile:', validationResult.error.errors);
      
      // Format validation errors for client
      const formattedErrors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return ApiResponse.validationError(formattedErrors);
    }

    // 4. Call business service to create profile
    const profileData: CreateNpcProfileCommand = validationResult.data;
    const npcProfileService = new NpcProfileService(supabase);
    
    const startTime = Date.now();
    const createdProfile: NpcProfileDTO = await npcProfileService.createProfile(
      profileData, 
      user.id
    );
    const endTime = Date.now();
    
    console.log(`NPC profile created successfully in ${endTime - startTime}ms:`, {
      profileId: createdProfile.id,
      userId: user.id,
      name: createdProfile.name
    });

    // 5. Return success response
    return ApiResponse.success(createdProfile, 201);

  } catch (error) {
    // Handle unexpected server errors
    console.error('Internal server error in create NPC profile:', error);
    
    return ApiResponse.internalError('Failed to create NPC profile');
  }
}; 