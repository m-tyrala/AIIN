import type { APIRoute } from 'astro';
import { NpcProfileService } from '../../../lib/services/npc-profile.service';
import { LogService } from '../../../lib/services/logService';
import { ApiResponse } from '../../../lib/utils/api-response.util';
import { AuthUtil } from '../../../lib/utils/auth.util';
import { uuidSchema, updateNpcProfileSchema } from '../../../lib/schemas/npc-profile.schema';

export const prerender = false;

/**
 * GET /api/npc_profiles/{id} - Retrieve NPC profile details
 * 
 * URL parameter: id (UUID) - Profile ID to retrieve
 * Response: 200 OK with NpcProfileDTO
 * 
 * Access control:
 * - Public profiles: accessible to all users (authenticated and unauthenticated)
 * - Private profiles: accessible only to the owner
 * 
 * Each successful access is logged as 'OPEN' operation
 * 
 * Error responses:
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: Authentication required for private profiles
 * - 403 Forbidden: User doesn't have permission to access private profile
 * - 404 Not Found: Profile doesn't exist
 * - 500 Internal Server Error: Database or server error
 */
export const GET: APIRoute = async ({ params, locals }): Promise<Response> => {
  try {
    // 1. Validate UUID parameter
    if (!params.id) {
      console.warn('Missing ID parameter in GET request');
      return ApiResponse.error('Bad Request', 'Profile ID is required', 400);
    }

    const uuidValidation = uuidSchema.safeParse(params.id);
    if (!uuidValidation.success) {
      console.warn('Invalid UUID format in GET request:', params.id);
      return ApiResponse.error('Bad Request', 'Invalid profile ID format', 400);
    }

    const profileId = uuidValidation.data;

    // 2. Get user authentication (optional for public profiles)
    const supabase = locals.supabase;
    let currentUserId: string | null = null;
    
    // Try to get authenticated user, but don't fail if not authenticated
    // This allows access to public profiles without authentication
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id || null;
    } catch (authError) {
      // Authentication failed, but we continue with null user for public profiles
      console.log('User not authenticated, attempting to access public profile only');
    }

    // 3. Initialize service and retrieve profile
    const logService = new LogService(supabase);
    const npcProfileService = new NpcProfileService(supabase, logService);
    
    const profile = await npcProfileService.getProfileById(profileId, currentUserId);
    
    console.log(`NPC profile retrieved successfully:`, {
      profileId,
      userId: currentUserId,
      isPublic: profile.is_public
    });

    // 4. Return success response with profile data
    return ApiResponse.success(profile, 200);

  } catch (error) {
    // Handle specific errors from service layer
    if (error instanceof Error) {
      if (error.message.includes('Profile not found')) {
        return ApiResponse.error('Not Found', 'Profile not found', 404);
      }
      if (error.message.includes('Access denied')) {
        // For private profiles, require authentication
        if (!locals.supabase) {
          return ApiResponse.unauthorized('Authentication required to access private profiles');
        }
        return ApiResponse.error('Forbidden', 'You do not have permission to access this profile', 403);
      }
      if (error.message.includes('Invalid profile ID format')) {
        return ApiResponse.error('Bad Request', 'Invalid profile ID format', 400);
      }
    }

    // Handle unexpected server errors
    console.error('Internal server error in get NPC profile:', error);
    return ApiResponse.internalError('Failed to retrieve NPC profile');
  }
};

/**
 * PUT /api/npc_profiles/{id} - Update NPC profile
 * 
 * URL parameter: id (UUID) - Profile ID to update
 * Request body: Partial profile data (at least one field required)
 * Response: 200 OK with updated NpcProfileDTO
 * 
 * Access control:
 * - Only profile owner can update their profiles
 * - Authentication required
 * 
 * Each successful update is logged as 'UPDATE' operation
 * 
 * Error responses:
 * - 400 Bad Request: Invalid UUID format or validation errors
 * - 401 Unauthorized: Missing user session
 * - 403 Forbidden: User doesn't own the profile
 * - 404 Not Found: Profile doesn't exist
 * - 500 Internal Server Error: Database or server error
 */
export const PUT: APIRoute = async ({ params, request, locals }): Promise<Response> => {
  try {
    // 1. Validate UUID parameter
    if (!params.id) {
      console.warn('Missing ID parameter in PUT request');
      return ApiResponse.error('Bad Request', 'Profile ID is required', 400);
    }

    const uuidValidation = uuidSchema.safeParse(params.id);
    if (!uuidValidation.success) {
      console.warn('Invalid UUID format in PUT request:', params.id);
      return ApiResponse.error('Bad Request', 'Invalid profile ID format', 400);
    }

    const profileId = uuidValidation.data;

    // 2. Check user authentication
    const supabase = locals.supabase;
    const token = AuthUtil.extractTokenFromRequest(request);
    if (!token) {
      console.warn('Missing Authorization header for update NPC profile:', profileId);
      return ApiResponse.unauthorized('Authorization header with Bearer token is required');
    }
    
    const authResult = await AuthUtil.verifyUser(supabase, token);
    
    if (!authResult.success) {
      console.warn('Unauthorized access attempt to update NPC profile:', profileId);
      return authResult.response!;
    }

    const user = authResult.user!;

    // 3. Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.warn('Invalid JSON in PUT request body:', parseError);
      return ApiResponse.error('Bad Request', 'Invalid JSON in request body', 400);
    }

    // 4. Validate update data against schema
    const validation = updateNpcProfileSchema.safeParse(requestBody);
    if (!validation.success) {
      console.warn('Validation failed for update NPC profile:', validation.error.errors);
      const validationErrors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return ApiResponse.validationError(validationErrors);
    }

    const updateData = validation.data;

    // 5. Initialize service and update profile
    const logService = new LogService(supabase);
    const npcProfileService = new NpcProfileService(supabase, logService);
    
    const startTime = Date.now();
    const updatedProfile = await npcProfileService.updateProfile(profileId, updateData, user.id);
    const endTime = Date.now();
    
    console.log(`NPC profile updated successfully in ${endTime - startTime}ms:`, {
      profileId,
      userId: user.id,
      updatedFields: Object.keys(updateData)
    });

    // 6. Return success response with updated profile
    return ApiResponse.success(updatedProfile, 200);

  } catch (error) {
    // Handle specific errors from service layer
    if (error instanceof Error) {
      if (error.message.includes('Profile not found')) {
        return ApiResponse.error('Not Found', 'Profile not found', 404);
      }
      if (error.message.includes('permission')) {
        return ApiResponse.error('Forbidden', 'You do not have permission to update this profile', 403);
      }
      if (error.message.includes('Invalid profile ID format')) {
        return ApiResponse.error('Bad Request', 'Invalid profile ID format', 400);
      }
    }

    // Handle unexpected server errors
    console.error('Internal server error in update NPC profile:', error);
    return ApiResponse.internalError('Failed to update NPC profile');
  }
};

/**
 * DELETE /api/npc_profiles/{id} - Delete NPC profile
 * 
 * URL parameter: id (UUID) - Profile ID to delete
 * Response: 200 OK with confirmation message
 * 
 * Error responses:
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: Missing user session
 * - 403 Forbidden: User doesn't own the profile
 * - 404 Not Found: Profile doesn't exist
 * - 500 Internal Server Error: Database or server error
 */
export const DELETE: APIRoute = async ({ params, request, locals }): Promise<Response> => {
  try {
    // 1. Validate UUID parameter
    if (!params.id) {
      console.warn('Missing ID parameter in DELETE request');
      return ApiResponse.error('Bad Request', 'Profile ID is required', 400);
    }

    const uuidValidation = uuidSchema.safeParse(params.id);
    if (!uuidValidation.success) {
      console.warn('Invalid UUID format in DELETE request:', params.id);
      return ApiResponse.error('Bad Request', 'Invalid profile ID format', 400);
    }

    const profileId = uuidValidation.data;

    // 2. Check user authentication
    const supabase = locals.supabase;
    const token = AuthUtil.extractTokenFromRequest(request);
    if (!token) {
      console.warn('Missing Authorization header for delete NPC profile:', profileId);
      return ApiResponse.unauthorized('Authorization header with Bearer token is required');
    }
    
    const authResult = await AuthUtil.verifyUser(supabase, token);
    
    if (!authResult.success) {
      console.warn('Unauthorized access attempt to delete NPC profile:', profileId);
      return authResult.response!;
    }

    const user = authResult.user!;

    // 3. Initialize service and delete profile
    const logService = new LogService(supabase);
    const npcProfileService = new NpcProfileService(supabase, logService);
    
    const startTime = Date.now();
    await npcProfileService.deleteProfile(profileId, user.id);
    const endTime = Date.now();
    
    console.log(`NPC profile deleted successfully in ${endTime - startTime}ms:`, {
      profileId,
      userId: user.id
    });

    // 4. Return success response
    return ApiResponse.success({
      message: 'Profil NPC został pomyślnie usunięty',
      deleted_id: profileId
    }, 200);

  } catch (error) {
    // Handle specific errors from service layer
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return ApiResponse.error('Not Found', 'Profile not found', 404);
      }
      if (error.message.includes('permission')) {
        return ApiResponse.error('Forbidden', 'You do not have permission to delete this profile', 403);
      }
    }

    // Handle unexpected server errors
    console.error('Internal server error in delete NPC profile:', error);
    return ApiResponse.internalError('Failed to delete NPC profile');
  }
}; 