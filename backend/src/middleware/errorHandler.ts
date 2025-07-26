import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { logger, logSecurityEvent } from '@/utils/logger';
import { config } from '@/config/config';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { ZodError } from 'zod';

/**
 * Interface for error response
 */
interface ErrorResponse {
  error: string;
  code: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
  details?: any;
  stack?: string;
}

/**
 * Not Found Handler - handles 404 errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = ApiError.notFound(`Route ${req.method} ${req.path} not found`);

  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  next(error);
};

/**
 * Main Error Handler - centralized error handling middleware
 */
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  // Generate request ID for tracking
  const requestId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  let apiError: ApiError;

  // Convert different error types to ApiError
  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof ZodError) {
    // Validation errors from Zod
    apiError = handleZodError(error);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma database errors
    apiError = handlePrismaError(error);
  } else if (error instanceof MulterError) {
    // File upload errors
    apiError = handleMulterError(error);
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    apiError = ApiError.unauthorized('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    // JWT expiration errors
    apiError = ApiError.unauthorized('Token has expired');
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    // JSON parsing errors
    apiError = ApiError.badRequest('Invalid JSON format');
  } else if (error.code === 'ECONNREFUSED') {
    // Database connection errors
    apiError = ApiError.serviceUnavailable('Database connection failed');
  } else if (error.code === 'ENOTFOUND') {
    // DNS/Network errors
    apiError = ApiError.serviceUnavailable('External service unavailable');
  } else if (error.code === 'ETIMEDOUT') {
    // Timeout errors
    apiError = ApiError.serviceUnavailable('Request timeout');
  } else {
    // Unknown errors
    apiError = ApiError.internalServerError(
      config.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Unknown error'
    );
  }

  // Log the error
  logError(error, req, requestId, apiError);

  // Log security events for certain error types
  if (apiError.statusCode === 401 || apiError.statusCode === 403) {
    logSecurityEvent('authentication_authorization_error', 'medium', {
      statusCode: apiError.statusCode,
      code: apiError.code,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      requestId,
    });
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: apiError.message,
    code: apiError.code,
    statusCode: apiError.statusCode,
    timestamp: apiError.timestamp,
    requestId,
  };

  // Add details in development mode or for validation errors
  if (config.NODE_ENV === 'development' || apiError.statusCode === 422) {
    if (apiError.details) {
      errorResponse.details = apiError.details;
    }
  }

  // Add stack trace in development mode for server errors
  if (config.NODE_ENV === 'development' && apiError.statusCode >= 500) {
    errorResponse.stack = error.stack;
  }

  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  });

  // Send error response
  res.status(apiError.statusCode).json(errorResponse);
};

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): ApiError {
  const details = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  logger.error('Detailed validation errors:', { details });
  logger.info('Validation error occurred', {
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
    errorDetails: details,
  });

  return ApiError.validationError('Validation failed', details);
}

/**
 * Handle Prisma database errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): ApiError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target as string[];
      const field = target ? target[0] : 'field';
      return ApiError.conflict(`${field} already exists`);

    case 'P2025':
      // Record not found
      return ApiError.notFound('Record not found');

    case 'P2003':
      // Foreign key constraint violation
      return ApiError.badRequest('Invalid reference to related record');

    case 'P2004':
      // Constraint violation
      return ApiError.badRequest('Data constraint violation');

    case 'P2011':
      // Null constraint violation
      return ApiError.badRequest('Required field is missing');

    case 'P2012':
      // Missing required value
      return ApiError.badRequest('Missing required value');

    case 'P2014':
      // Invalid ID
      return ApiError.badRequest('Invalid ID provided');

    case 'P2015':
      // Related record not found
      return ApiError.notFound('Related record not found');

    case 'P2024':
      // Connection timeout
      return ApiError.serviceUnavailable('Database connection timeout');

    default:
      return ApiError.databaseError('Database operation failed');
  }
}

/**
 * Handle Multer file upload errors
 */
function handleMulterError(error: MulterError): ApiError {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return ApiError.fileTooLarge('File size exceeds the allowed limit');

    case 'LIMIT_FILE_COUNT':
      return ApiError.badRequest('Too many files uploaded');

    case 'LIMIT_FIELD_KEY':
      return ApiError.badRequest('Field name too long');

    case 'LIMIT_FIELD_VALUE':
      return ApiError.badRequest('Field value too long');

    case 'LIMIT_FIELD_COUNT':
      return ApiError.badRequest('Too many fields');

    case 'LIMIT_UNEXPECTED_FILE':
      return ApiError.badRequest('Unexpected file field');

    default:
      return ApiError.badRequest('File upload error');
  }
}

/**
 * Log error with appropriate level and context
 */
function logError(error: any, req: Request, requestId: string, apiError: ApiError): void {
  const errorContext = {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: apiError.statusCode,
    code: apiError.code,
    message: apiError.message,
    originalError: error.message,
    stack: error.stack,
  };

  // Log based on error severity
  if (apiError.statusCode >= 500) {
    // Server errors - critical
    logger.error('Server error occurred', errorContext);
  } else if (apiError.statusCode >= 400) {
    // Client errors - warning
    logger.warn('Client error occurred', errorContext);
  } else {
    // Other errors - info
    logger.info('Error occurred', errorContext);
  }

  // Log specific error types with more detail
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error('Prisma database error', {
      ...errorContext,
      prismaCode: error.code,
      prismaMeta: error.meta,
    });
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    logger.warn('JWT authentication error', {
      ...errorContext,
      jwtError: error.name,
    });
  }

  // Log rate limiting errors
  if (apiError.code === 'RATE_LIMIT_EXCEEDED') {
    logSecurityEvent('rate_limit_exceeded', 'medium', {
      ip: req.ip,
      endpoint: req.path,
      userAgent: req.get('User-Agent'),
      requestId,
    });
  }
}

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler for request validation
 */
export const validationErrorHandler = (
  schema: any,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req[property]);
      req[property] = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(handleZodError(error));
      } else {
        next(ApiError.badRequest('Validation failed'));
      }
    }
  };
};

/**
 * Rate limit error handler
 */
export const rateLimitErrorHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = ApiError.rateLimitExceeded('Too many requests, please try again later');

  logSecurityEvent('rate_limit_exceeded', 'medium', {
    ip: req.ip,
    endpoint: req.path,
    userAgent: req.get('User-Agent'),
  });

  next(error);
};

/**
 * CORS error handler
 */
export const corsErrorHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = ApiError.forbidden('CORS policy violation');

  logSecurityEvent('cors_violation', 'medium', {
    origin: req.get('Origin'),
    ip: req.ip,
    endpoint: req.path,
    userAgent: req.get('User-Agent'),
  });

  next(error);
};

export default {
  notFoundHandler,
  errorHandler,
  asyncHandler,
  validationErrorHandler,
  rateLimitErrorHandler,
  corsErrorHandler,
};
