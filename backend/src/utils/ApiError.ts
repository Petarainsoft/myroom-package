/**
 * Custom API Error class for standardized error handling
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: any
  ) {
    super(message);
    
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Get default error code based on status code
   */
  private getDefaultCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      case 504:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(this.details && { details: this.details }),
    };
  }

  /**
   * Static factory methods for common errors
   */
  static badRequest(message: string = 'Bad request', details?: any): ApiError {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized', details?: any): ApiError {
    return new ApiError(401, message, 'UNAUTHORIZED', details);
  }

  static forbidden(message: string = 'Forbidden', details?: any): ApiError {
    return new ApiError(403, message, 'FORBIDDEN', details);
  }

  static notFound(message: string = 'Resource not found', details?: any): ApiError {
    return new ApiError(404, message, 'NOT_FOUND', details);
  }

  static conflict(message: string = 'Conflict', details?: any): ApiError {
    return new ApiError(409, message, 'CONFLICT', details);
  }

  static validationError(message: string = 'Validation failed', details?: any): ApiError {
    return new ApiError(422, message, 'VALIDATION_ERROR', details);
  }

  static rateLimitExceeded(message: string = 'Rate limit exceeded', details?: any): ApiError {
    return new ApiError(429, message, 'RATE_LIMIT_EXCEEDED', details);
  }

  static internalServerError(message: string = 'Internal server error', details?: any): ApiError {
    return new ApiError(500, message, 'INTERNAL_SERVER_ERROR', details);
  }

  static serviceUnavailable(message: string = 'Service unavailable', details?: any): ApiError {
    return new ApiError(503, message, 'SERVICE_UNAVAILABLE', details);
  }

  /**
   * Business logic specific errors
   */
  static paymentRequired(message: string = 'Payment required to access this resource', details?: any): ApiError {
    return new ApiError(402, message, 'PAYMENT_REQUIRED', details);
  }

  static quotaExceeded(message: string = 'Quota exceeded', details?: any): ApiError {
    return new ApiError(429, message, 'QUOTA_EXCEEDED', details);
  }

  static resourceNotAccessible(message: string = 'Resource not accessible', details?: any): ApiError {
    return new ApiError(403, message, 'RESOURCE_NOT_ACCESSIBLE', details);
  }

  static invalidApiKey(message: string = 'Invalid API key', details?: any): ApiError {
    return new ApiError(401, message, 'INVALID_API_KEY', details);
  }

  static expiredApiKey(message: string = 'API key has expired', details?: any): ApiError {
    return new ApiError(401, message, 'EXPIRED_API_KEY', details);
  }

  static suspendedAccount(message: string = 'Account is suspended', details?: any): ApiError {
    return new ApiError(403, message, 'ACCOUNT_SUSPENDED', details);
  }

  static insufficientPermissions(message: string = 'Insufficient permissions', details?: any): ApiError {
    return new ApiError(403, message, 'INSUFFICIENT_PERMISSIONS', details);
  }

  static resourceLimitExceeded(message: string = 'Resource limit exceeded', details?: any): ApiError {
    return new ApiError(429, message, 'RESOURCE_LIMIT_EXCEEDED', details);
  }

  static invalidFileFormat(message: string = 'Invalid file format', details?: any): ApiError {
    return new ApiError(400, message, 'INVALID_FILE_FORMAT', details);
  }

  static fileTooLarge(message: string = 'File too large', details?: any): ApiError {
    return new ApiError(413, message, 'FILE_TOO_LARGE', details);
  }

  static storageQuotaExceeded(message: string = 'Storage quota exceeded', details?: any): ApiError {
    return new ApiError(507, message, 'STORAGE_QUOTA_EXCEEDED', details);
  }

  static databaseError(message: string = 'Database operation failed', details?: any): ApiError {
    return new ApiError(500, message, 'DATABASE_ERROR', details);
  }

  static externalServiceError(message: string = 'External service error', details?: any): ApiError {
    return new ApiError(502, message, 'EXTERNAL_SERVICE_ERROR', details);
  }

  static cacheError(message: string = 'Cache operation failed', details?: any): ApiError {
    return new ApiError(500, message, 'CACHE_ERROR', details);
  }

  static s3Error(message: string = 'S3 operation failed', details?: any): ApiError {
    return new ApiError(502, message, 'S3_ERROR', details);
  }

  /**
   * Create ApiError from unknown error
   */
  static fromError(error: unknown, defaultMessage: string = 'An error occurred'): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for specific error types
      if (error.name === 'ValidationError') {
        return ApiError.validationError(error.message);
      }
      
      if (error.name === 'CastError') {
        return ApiError.badRequest('Invalid data format');
      }

      if (error.name === 'MongoError' || error.name === 'PrismaClientKnownRequestError') {
        return ApiError.databaseError('Database operation failed');
      }

      if (error.name === 'JsonWebTokenError') {
        return ApiError.unauthorized('Invalid token');
      }

      if (error.name === 'TokenExpiredError') {
        return ApiError.unauthorized('Token has expired');
      }

      return ApiError.internalServerError(error.message);
    }

    return ApiError.internalServerError(defaultMessage);
  }

  /**
   * Check if error is operational (expected) vs programming error
   */
  get isOperational(): boolean {
    return this.statusCode < 500;
  }
}

export default ApiError;