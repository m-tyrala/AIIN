import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import { ApiResponse } from './api-response.util';

/**
 * Utility for user authentication and authorization
 */
export class AuthUtil {
  /**
   * Verifies user authentication and returns user data
   * @param supabase - Supabase client
   * @param token - JWT token from Authorization header
   * @returns Promise with user data or error response
   */
  static async verifyUser(supabase: SupabaseClient<Database>, token?: string) {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        success: false,
        response: ApiResponse.unauthorized(),
        user: null
      };
    }

    return {
      success: true,
      response: null,
      user: user
    };
  }

  /**
   * Extracts JWT token from Authorization header
   * @param request - Request object
   * @returns JWT token or null if not found
   */
  static extractTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.replace('Bearer ', '');
  }

  /**
   * Checks if user has permission to access a resource
   * @param resourceUserId - User ID who owns the resource
   * @param currentUserId - Current user ID
   * @returns boolean indicating permission
   */
  static hasPermission(resourceUserId: string, currentUserId: string): boolean {
    return resourceUserId === currentUserId;
  }
} 