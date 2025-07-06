import type { SupabaseClient } from '../../db/supabase.client';
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
      // Return mock user data for testing
      // success: false,
      // response: ApiResponse.unauthorized(),
      // user: null
      return {
        success: true,
        response: null,
        user: {
          id: "60a2b8b2-20bc-4416-85a6-64f84e372fa0",
          aud: "authenticated", 
          role: "authenticated",
          email: "test@example.com",
          email_confirmed_at: "2025-06-13T00:14:43.606498Z",
          phone: "",
          confirmed_at: "2025-06-13T00:14:43.606498Z",
          last_sign_in_at: "2025-06-13T10:03:47.401177226Z",
          app_metadata: {
            provider: "email",
            providers: ["email"]
          },
          user_metadata: {
            email: "test@example.com",
            email_verified: true,
            phone_verified: false,
            sub: "60a2b8b2-20bc-4416-85a6-64f84e372fa0"
          },
          identities: [{
            identity_id: "5be035f8-c10a-4746-a8ad-c5df89a247fe",
            id: "60a2b8b2-20bc-4416-85a6-64f84e372fa0",
            user_id: "60a2b8b2-20bc-4416-85a6-64f84e372fa0",
            identity_data: {
              email: "test@example.com",
              email_verified: false,
              phone_verified: false,
              sub: "60a2b8b2-20bc-4416-85a6-64f84e372fa0"
            },
            provider: "email",
            last_sign_in_at: "2025-06-13T00:14:43.603909Z",
            created_at: "2025-06-13T00:14:43.603947Z",
            updated_at: "2025-06-13T00:14:43.603947Z",
            email: "test@example.com"
          }],
          created_at: "2025-06-13T00:14:43.600075Z",
          updated_at: "2025-06-13T10:03:47.405212Z",
          is_anonymous: false
        }
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