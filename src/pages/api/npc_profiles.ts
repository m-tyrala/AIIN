import type { APIRoute } from 'astro';
import { createNpcProfileSchema, listNpcProfilesQuerySchema } from '../../lib/schemas/npc-profile.schema';
import { NpcProfileService } from '../../lib/services/npc-profile.service';
import { LogService } from '../../lib/services/logService';
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
 * - search: string (max: 200) - search by name or profession
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
      is_public: url.searchParams.get('is_public') || undefined,
      user_id: url.searchParams.get('user_id') || undefined,
      search: url.searchParams.get('search') || undefined
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

    // 2. Get user from middleware (cookie-based authentication)
    const currentUser = locals.user; // This is set by middleware from cookies

    // 3. Handle special case: if anonymous user requests private profiles, force is_public to true
    if (!currentUser && validatedQuery.is_public === false) {
      validatedQuery.is_public = true;
      console.log('Anonymous user requested private profiles, forced is_public to true');
    }

    // 4. Initialize service and fetch profiles
    const logService = new LogService(locals.supabase);
    const npcProfileService = new NpcProfileService(locals.supabase, logService);
    
    const result: PaginatedResponse<NpcProfileDTO> = await npcProfileService.listProfiles(
      validatedQuery,
      currentUser?.id || null
    );

    console.log(`NPC profiles API request completed successfully:`, {
      userId: currentUser?.id || 'anonymous',
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sort: validatedQuery.sort,
      is_public: validatedQuery.is_public,
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
    // 1. Check user authorization from middleware (cookie-based authentication)
    const currentUser = locals.user; // This is set by middleware from cookies
    
    if (!currentUser) {
      console.warn('Unauthorized access attempt to create NPC profile');
      return ApiResponse.unauthorized('Authentication required to create NPC profiles');
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
    const logService = new LogService(locals.supabase);
    const npcProfileService = new NpcProfileService(locals.supabase, logService);
    
    const startTime = Date.now();
    const createdProfile: NpcProfileDTO = await npcProfileService.createProfile(
      profileData, 
      currentUser.id
    );
    const endTime = Date.now();
    
    console.log(`NPC profile created successfully in ${endTime - startTime}ms:`, {
      profileId: createdProfile.id,
      userId: currentUser.id,
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