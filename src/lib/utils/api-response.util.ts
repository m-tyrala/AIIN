/**
 * Utility class for standardized API responses
 * Ensures consistent response format across all endpoints
 */
export class ApiResponse {
  /**
   * Creates a success response with data
   * @param data - Response data
   * @param status - HTTP status code (default: 200)
   * @returns Response object
   */
  static success<T>(data: T, status: number = 200): Response {
    return new Response(
      JSON.stringify(data),
      {
        status,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  /**
   * Creates an error response with consistent format
   * @param error - Error message
   * @param message - Additional error details
   * @param status - HTTP status code
   * @param details - Optional validation details
   * @returns Response object
   */
  static error(
    error: string,
    message: string,
    status: number,
    details?: any
  ): Response {
    const errorBody: any = { error, message };
    if (details) {
      errorBody.details = details;
    }

    return new Response(
      JSON.stringify(errorBody),
      {
        status,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  /**
   * Creates a validation error response
   * @param errors - Array of validation errors
   * @returns Response object with 400 status
   */
  static validationError(errors: Array<{ field: string; message: string }>): Response {
    return ApiResponse.error(
      'Validation failed',
      'Request data is invalid',
      400,
      errors
    );
  }

  /**
   * Creates an unauthorized error response
   * @param message - Optional custom message
   * @returns Response object with 401 status
   */
  static unauthorized(message: string = 'User session required'): Response {
    return ApiResponse.error(
      'Unauthorized',
      message,
      401
    );
  }

  /**
   * Creates an internal server error response
   * @param message - Error message
   * @returns Response object with 500 status
   */
  static internalError(message: string = 'Internal server error'): Response {
    return ApiResponse.error(
      'Internal server error',
      message,
      500
    );
  }
} 