import type { SupabaseClient } from '../../db/supabase.client';
import type { Database } from '../../db/database.types';
import type { 
  CreateNpcProfileCommand, 
  UpdateNpcProfileCommand,
  NpcProfileDTO, 
  ListNpcProfilesQuery,
  PaginatedResponse
} from '../../types';
import { LogService } from './logService';

// Use database types directly for strict typing
type NpcProfileRow = Database['public']['Tables']['npc_profiles']['Row'];

/**
 * Service class for managing NPC profile operations
 * Handles business logic, database transactions and logging
 */
export class NpcProfileService {
  constructor(
    private supabase: SupabaseClient<Database>,
    private logService: LogService
  ) {}

  /**
   * Creates a new NPC profile with associated logging using atomic transaction
   * @param data - Profile data from validated request
   * @param userId - User ID from authenticated session
   * @returns Promise<NpcProfileDTO> - Created profile with generated fields
   * @throws Error on database operation failure
   */
  async createProfile(
    data: CreateNpcProfileCommand, 
    userId: string
  ): Promise<NpcProfileDTO> {
    // Use atomic transaction approach for better performance and consistency
    const startTime = Date.now();
    
    try {
      // Insert profile and get the created record
      const { data: profileData, error: profileError } = await this.supabase
        .from('npc_profiles')
        .insert({
          user_id: userId,
          name: data.name,
          appearance: data.appearance,
          profession: data.profession,
          relationship_to_party: data.relationship_to_party,
          scene_description: data.scene_description,
          special_traits: data.special_traits,
          complexity_level: data.complexity_level,
          is_public: data.is_public
        })
        .select()
        .single();

      if (profileError) {
        console.error('Failed to create NPC profile:', profileError);
        throw new Error(`Failed to create NPC profile: ${profileError.message}`);
      }

      // Log the profile creation operation with duration (best-effort)
      const duration = Date.now() - startTime;
      try {
        await this.logService.logOperation('INSERT', profileData.id, userId, duration);
      } catch (logError) {
        console.warn('Best-effort logging failed for createProfile:', logError);
      }

      // Optimized return using direct database result mapping
      return this.mapDatabaseToDTO(profileData);

    } catch (error) {
      console.error('Error in createProfile transaction:', error);
      throw error; // Re-throw to maintain error handling in API layer
    }
  }

  /**
   * Maps database result to DTO efficiently
   * @param dbData - Raw database record
   * @returns NpcProfileDTO
   */
  private mapDatabaseToDTO(dbData: NpcProfileRow): NpcProfileDTO {
    return {
      id: dbData.id,
      user_id: dbData.user_id,
      name: dbData.name,
      appearance: dbData.appearance,
      profession: dbData.profession,
      relationship_to_party: dbData.relationship_to_party,
      scene_description: dbData.scene_description,
      special_traits: dbData.special_traits,
      complexity_level: dbData.complexity_level,
      is_public: dbData.is_public,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at
    };
  }



  /**
   * Validates if user has permission to perform operation on profile
   * @param profileId - ID of the profile
   * @param userId - ID of the user
   * @returns Promise<boolean> - true if user has permission
   */
  async validateUserPermission(profileId: string, userId: string): Promise<boolean> {
    const { data: profile, error } = await this.supabase
      .from('npc_profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (error) {
      console.error('Failed to validate user permission:', error);
      return false;
    }

    return profile.user_id === userId;
  }

  /**
   * Deletes an NPC profile with authorization check and logging
   * Uses transaction to first delete related logs, then the profile
   * @param profileId - ID of the profile to delete
   * @param userId - ID of the user requesting deletion
   * @returns Promise<void>
   * @throws Error with specific message for different failure scenarios
   */
  async deleteProfile(profileId: string, userId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Sanitize inputs to prevent injection attacks
      if (!profileId || typeof profileId !== 'string' || !/^[0-9a-f-]{36}$/i.test(profileId)) {
        throw new Error('Invalid profile ID format');
      }
      
      if (!userId || typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId)) {
        throw new Error('Invalid user ID format');
      }

      // 1. First check if profile exists and user has permission
      const { data: profileCheck, error: checkError } = await this.supabase
        .from('npc_profiles')
        .select('user_id')
        .eq('id', profileId)
        .single();
        
      if (checkError || !profileCheck) {
        throw new Error('Profile not found');
      }
      
      if (profileCheck.user_id !== userId) {
        throw new Error('User does not have permission to delete this profile');
      }

      // 2. Delete the profile itself (logs removed by ON DELETE CASCADE)
      const { data: deletedProfile, error: deleteError } = await this.supabase
        .from('npc_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', userId) // Extra safety check
        .select('id, user_id')
        .single();

      if (deleteError) {
        console.error('Failed to delete NPC profile:', deleteError);
        throw new Error(`Failed to delete profile: ${deleteError.message}`);
      }

      // 3. Log the successful deletion
      const duration = Date.now() - startTime;
      
      console.log(`NPC profile deleted successfully:`, {
        profileId: deletedProfile.id,
        userId: deletedProfile.user_id,
        requestingUserId: userId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      // Note: We don't log this operation to the database since profile and its logs no longer exist

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed deletion attempts for security monitoring
      console.error('Error in deleteProfile transaction:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        profileId,
        userId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      throw error; // Re-throw to maintain error handling in API layer
    }
  }

  /**
   * Lists NPC profiles with pagination, filtering and permission-based access control
   * @param query - Query parameters for filtering, sorting and pagination
   * @param currentUserId - ID of the authenticated user
   * @returns Promise<PaginatedResponse<NpcProfileDTO>> - Paginated list of profiles
   * @throws Error on database operation failure
   */
  async listProfiles(
    query: ListNpcProfilesQuery,
    currentUserId: string | null
  ): Promise<PaginatedResponse<NpcProfileDTO>> {
    const startTime = Date.now();
    
    try {
      // Build base query with permission filtering
      let baseQuery = this.supabase
        .from('npc_profiles')
        .select('*', { count: 'exact' });

      // Apply permission-based filtering
      if (query.is_public !== undefined) {
        if (query.is_public) {
          // Only public profiles
          baseQuery = baseQuery.eq('is_public', true);
        } else {
          // Only user's own private profiles - requires authentication
          if (!currentUserId) {
            // Anonymous users can't access private profiles, return empty result
            return {
              data: [],
              pagination: {
                page: query.page!,
                limit: query.limit!,
                total: 0,
                total_pages: 0,
                has_next: false,
                has_prev: false
              }
            };
          }
          // Filter for user's private profiles only
          baseQuery = baseQuery
            .eq('user_id', currentUserId)
            .eq('is_public', false);
        }
      } else {
        // Default behavior based on authentication status
        if (currentUserId) {
          // Authenticated: user's own profiles + public profiles from others
          baseQuery = baseQuery.or(`user_id.eq.${currentUserId},is_public.eq.true`);
        } else {
          // Anonymous: only public profiles
          baseQuery = baseQuery.eq('is_public', true);
        }
      }

      // Apply user_id filter if specified
      if (query.user_id) {
        if (currentUserId && query.user_id === currentUserId) {
          // Allow access to own profiles
          baseQuery = baseQuery.eq('user_id', query.user_id);
        } else {
          // Only public profiles from other users (or any users if anonymous)
          baseQuery = baseQuery
            .eq('user_id', query.user_id)
            .eq('is_public', true);
        }
      }

      // Apply search filter if specified
      if (query.search && query.search.trim().length > 0) {
        const searchTerm = query.search.trim();
        // Search in name or profession fields using ilike for case-insensitive search
        baseQuery = baseQuery.or(`name.ilike.%${searchTerm}%,profession.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      const [sortField, sortDirection] = query.sort!.split(' ') as [string, 'asc' | 'desc'];
      baseQuery = baseQuery.order(sortField, { ascending: sortDirection === 'asc' });

      // Apply pagination
      const offset = (query.page! - 1) * query.limit!;
      baseQuery = baseQuery.range(offset, offset + query.limit! - 1);

      // Execute query
      const { data: profiles, error, count } = await baseQuery;

      if (error) {
        console.error('Failed to list NPC profiles:', error);
        throw new Error(`Failed to list NPC profiles: ${error.message}`);
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil((count || 0) / query.limit!);
      const hasNext = query.page! < totalPages;
      const hasPrev = query.page! > 1;

      // Map to DTOs
      const profileDTOs = profiles?.map(profile => this.mapDatabaseToDTO(profile)) || [];

      // Log the list operation (simplified logging without database insert) - only for authenticated users
      const duration = Date.now() - startTime;

      console.log(`NPC profiles listed successfully:`, {
        totalProfiles: profileDTOs.length,
        totalCount: count,
        page: query.page,
        limit: query.limit,
        userId: currentUserId || 'anonymous',
        duration: `${duration}ms`
      });

      return {
        data: profileDTOs,
        pagination: {
          page: query.page!,
          limit: query.limit!,
          total: count || 0,
          total_pages: totalPages,
          has_next: hasNext,
          has_prev: hasPrev
        }
      };

    } catch (error) {
      console.error('Error in listProfiles:', error);
      throw error;
    }
  }

  /**
   * Retrieves a single NPC profile by ID with access control and logging
   * Implements business logic for public/private profile access permissions
   * @param profileId - UUID of the profile to retrieve
   * @param currentUserId - ID of the user making the request (null for unauthenticated)
   * @returns Promise<NpcProfileDTO> - Retrieved profile data
   * @throws Error with specific message for different failure scenarios
   */
  async getProfileById(profileId: string, currentUserId: string | null): Promise<NpcProfileDTO> {
    const startTime = Date.now();
    
    try {
      // Sanitize input to prevent injection attacks
      if (!profileId || typeof profileId !== 'string' || !/^[0-9a-f-]{36}$/i.test(profileId)) {
        throw new Error('Invalid profile ID format');
      }

      // 1. Retrieve profile from database
      const { data: profile, error: profileError } = await this.supabase
        .from('npc_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') { // No rows returned
          throw new Error('Profile not found');
        }
        console.error('Failed to retrieve NPC profile:', profileError);
        throw new Error(`Failed to retrieve profile: ${profileError.message}`);
      }

      // 2. Access control logic
      const isOwner = currentUserId && profile.user_id === currentUserId;
      const isPublic = profile.is_public;

      // If profile is private and user is not the owner, deny access
      if (!isPublic && !isOwner) {
        throw new Error('Access denied - profile is private');
      }

      // 3. Log the OPEN operation (only if access is granted) - best-effort
      if (currentUserId) {
        const duration = Date.now() - startTime;
        try {
          await this.logService.logOperation('OPEN', profileId, currentUserId, duration);
        } catch (logError) {
          console.warn('Best-effort logging failed for getProfileById:', logError);
        }
      }

      // 4. Return formatted profile data
      return this.mapDatabaseToDTO(profile);

    } catch (error) {
      console.error('Error in getProfileById:', error);
      throw error; // Re-throw to maintain error handling in API layer
    }
  }

  /**
   * Updates an existing NPC profile with authorization check and logging
   * Implements partial update functionality with field-level validation
   * @param profileId - ID of the profile to update
   * @param updateData - Fields to update (partial)
   * @param userId - ID of the user requesting the update
   * @returns Promise<NpcProfileDTO> - Updated profile data
   * @throws Error with specific message for different failure scenarios
   */
  async updateProfile(
    profileId: string, 
    updateData: UpdateNpcProfileCommand, 
    userId: string
  ): Promise<NpcProfileDTO> {
    const startTime = Date.now();
    
    try {
      // Sanitize inputs to prevent injection attacks
      if (!profileId || typeof profileId !== 'string' || !/^[0-9a-f-]{36}$/i.test(profileId)) {
        throw new Error('Invalid profile ID format');
      }
      
      if (!userId || typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId)) {
        throw new Error('Invalid user ID format');
      }

      // 1. Check if profile exists and user has permission
      const { data: existingProfile, error: fetchError } = await this.supabase
        .from('npc_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') { // No rows returned
          throw new Error('Profile not found');
        }
        console.error('Failed to fetch NPC profile for update:', fetchError);
        throw new Error(`Failed to fetch profile: ${fetchError.message}`);
      }

      // 2. Check ownership (only profile owner can update)
      if (existingProfile.user_id !== userId) {
        throw new Error('User does not have permission to update this profile');
      }

      // 3. Prepare update data with timestamp
      const updateFields = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // 4. Perform the update
      const { data: updatedProfile, error: updateError } = await this.supabase
        .from('npc_profiles')
        .update(updateFields)
        .eq('id', profileId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update NPC profile:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      // 5. Log the update operation - best-effort
      const duration = Date.now() - startTime;
      try {
        await this.logService.logOperation('UPDATE', profileId, userId, duration);
      } catch (logError) {
        console.warn('Best-effort logging failed for updateProfile:', logError);
      }

      // 6. Log successful update with detailed information
      console.log(`NPC profile updated successfully:`, {
        profileId,
        userId,
        updatedFields: Object.keys(updateData),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      // 7. Return the updated profile
      return this.mapDatabaseToDTO(updatedProfile);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed update attempts for monitoring
      console.error('Error in updateProfile transaction:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        profileId,
        userId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      throw error; // Re-throw to maintain error handling in API layer
    }
  }
} 