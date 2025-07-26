import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { ApiError } from '@/utils/ApiError';
import { authLogger } from '@/utils/logger';

/**
 * Middleware to validate admin permissions
 */
export const validateAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    // Check if user has admin role
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      authLogger.warn('Non-admin user attempted to access admin endpoint', {
        userId: req.user.id,
        userRole: req.user.role,
        endpoint: req.path,
        ip: req.ip,
      });
      
      throw new ApiError(403, 'Admin privileges required');
    }

    authLogger.info('Admin access granted', {
      userId: req.user.id,
      userRole: req.user.role,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: 'AUTHORIZATION_FAILED',
        timestamp: new Date().toISOString(),
      });
    } else {
      authLogger.error('Admin validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: req.path,
      });
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
};

/**
 * Middleware to validate super admin permissions
 */
export const validateSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    // Check if user has super admin role
    if (req.user.role !== 'SUPER_ADMIN') {
      authLogger.warn('Non-super-admin user attempted to access super admin endpoint', {
        userId: req.user.id,
        userRole: req.user.role,
        endpoint: req.path,
        ip: req.ip,
      });
      
      throw new ApiError(403, 'Super admin privileges required');
    }

    authLogger.info('Super admin access granted', {
      userId: req.user.id,
      userRole: req.user.role,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: 'AUTHORIZATION_FAILED',
        timestamp: new Date().toISOString(),
      });
    } else {
      authLogger.error('Super admin validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: req.path,
      });
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
};

export default {
  validateAdmin,
  validateSuperAdmin,
};