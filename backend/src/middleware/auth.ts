import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config/config';
import { authLogger, logSecurityEvent } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';
import { RedisService } from '@/services/RedisService';
import { isPublicRoute } from '@/middleware/publicRoutes';

const prisma = new PrismaClient();
const redisService = RedisService.getInstance();

// Extended Request interface to include user and apiKey data
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    developerId?: string;
  };
  apiKey?: {
    id: string;
    key: string;
    projectId: string;
    developerId: string;
    scopes: string[];
  };
}

/**
 * Middleware to validate API Key for developer endpoints
 */
export const validateApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip authentication for public routes
    if (isPublicRoute(req)) {
      return next();
    }
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      logSecurityEvent('missing_api_key', 'medium', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
      });
      throw new ApiError(401, 'API key is required');
    }

    // Check if API key format is valid
    if (!apiKey.startsWith('pk_') || apiKey.length < 35) {
      logSecurityEvent('invalid_api_key_format', 'medium', {
        apiKey: apiKey.substring(0, 10) + '...',
        ip: req.ip,
        endpoint: req.path,
      });
      throw new ApiError(401, 'Invalid API key format');
    }

    // Try to get from cache first - TEMPORARILY DISABLED
    const cacheKey = `apikey:${apiKey}`;
    let apiKeyData: any = null; // await redisService.get(cacheKey);
    
    if (!apiKeyData) {
      // Get from database
      const dbApiKey = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: {
          project: {
            include: {
              developer: true,
            },
          },
        },
      });

      if (!dbApiKey) {
        logSecurityEvent('api_key_not_found', 'high', {
          apiKey: apiKey.substring(0, 10) + '...',
          ip: req.ip,
          endpoint: req.path,
        });
        throw new ApiError(401, 'Invalid API key');
      }

      // Check if API key is active
      if (dbApiKey.status !== 'ACTIVE') {
        logSecurityEvent('inactive_api_key_used', 'high', {
          apiKeyId: dbApiKey.id,
          status: dbApiKey.status,
          ip: req.ip,
          endpoint: req.path,
        });
        throw new ApiError(401, `API key is ${dbApiKey.status.toLowerCase()}`);
      }

      // Check if API key is expired
      if (dbApiKey.expiresAt && dbApiKey.expiresAt < new Date()) {
        logSecurityEvent('expired_api_key_used', 'high', {
          apiKeyId: dbApiKey.id,
          expiredAt: dbApiKey.expiresAt,
          ip: req.ip,
          endpoint: req.path,
        });
        throw new ApiError(401, 'API key has expired');
      }

      // Check developer status
      if (dbApiKey.project.developer.status !== 'ACTIVE') {
        logSecurityEvent('suspended_developer_api_access', 'high', {
          developerId: dbApiKey.project.developer.id,
          developerStatus: dbApiKey.project.developer.status,
          apiKeyId: dbApiKey.id,
          ip: req.ip,
          endpoint: req.path,
        });
        
        const message = dbApiKey.project.developer.status === 'SUSPENDED' 
          ? 'Account is suspended. Contact support for assistance.'
          : 'Account is inactive';
        
        throw new ApiError(403, message);
      }

      // Prepare API key data for caching
      apiKeyData = {
        id: dbApiKey.id,
        key: dbApiKey.key,
        projectId: dbApiKey.project.id,
        developerId: dbApiKey.project.developer.id,
        scopes: dbApiKey.scopes,
        status: dbApiKey.status,
        developerStatus: dbApiKey.project.developer.status,
      };

      // Cache the API key data - TEMPORARILY DISABLED
      // await redisService.setex(cacheKey, config.CACHE_TTL_API_KEY, apiKeyData);

      // Update last used timestamp (async, don't wait)
      prisma.apiKey.update({
        where: { id: dbApiKey.id },
        data: { lastUsedAt: new Date() },
      }).catch(error => {
        authLogger.error('Failed to update API key last used timestamp', {
          apiKeyId: dbApiKey.id,
          error: error.message,
        });
      });
    } else {
      // Validate cached data - TEMPORARILY DISABLED
      if (apiKeyData.status !== 'ACTIVE' || apiKeyData.developerStatus !== 'ACTIVE') {
        // Remove from cache and re-validate
        // await redisService.del(cacheKey);
        return validateApiKey(req, res, next);
      }
    }

    // Attach API key data to request
    req.apiKey = {
      id: apiKeyData.id,
      key: apiKeyData.key,
      projectId: apiKeyData.projectId,
      developerId: apiKeyData.developerId,
      scopes: apiKeyData.scopes,
    };

    authLogger.info('API key validated successfully', {
      apiKeyId: apiKeyData.id,
      developerId: apiKeyData.developerId,
      projectId: apiKeyData.projectId,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: 'AUTHENTICATION_FAILED',
        timestamp: new Date().toISOString(),
      });
    } else {
      authLogger.error('API key validation error', {
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
 * Middleware to validate JWT token for admin endpoints
 */
export const validateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip authentication for public routes
    if (isPublicRoute(req)) {
      return next();
    }
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw new ApiError(401, 'Authorization token is required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    if (!decoded.id || !decoded.email) {
      throw new ApiError(401, 'Invalid token payload');
    }

    // Check if token is in blacklist (for logout functionality)
    const blacklistKey = `blacklist:${token}`;
    const isBlacklisted = await redisService.get(blacklistKey);
    
    if (isBlacklisted) {
      logSecurityEvent('blacklisted_token_used', 'medium', {
        userId: decoded.id,
        ip: req.ip,
        endpoint: req.path,
      });
      throw new ApiError(401, 'Token has been revoked');
    }

    // Get user from cache or database
    const userCacheKey = `admin:${decoded.id}`;
    let userData = await redisService.get(userCacheKey);
    
    if (!userData) {
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      });

      if (!admin) {
        logSecurityEvent('token_user_not_found', 'high', {
          userId: decoded.id,
          ip: req.ip,
          endpoint: req.path,
        });
        throw new ApiError(401, 'User not found');
      }

      if (admin.status !== 'ACTIVE') {
        logSecurityEvent('inactive_admin_access_attempt', 'high', {
          adminId: admin.id,
          status: admin.status,
          ip: req.ip,
          endpoint: req.path,
        });
        throw new ApiError(403, 'Account is not active');
      }

      userData = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
      };

      // Cache user data
      await redisService.setex(userCacheKey, config.CACHE_TTL_DEVELOPER, userData);
    }

    // Attach user data to request
    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    };

    authLogger.info('JWT token validated successfully', {
      userId: userData.id,
      role: userData.role,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent('invalid_jwt_token', 'medium', {
        error: error.message,
        ip: req.ip,
        endpoint: req.path,
      });
      res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString(),
      });
    } else if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: 'AUTHENTICATION_FAILED',
        timestamp: new Date().toISOString(),
      });
    } else {
      authLogger.error('JWT validation error', {
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
 * Developer JWT validation middleware
 */
export const validateDeveloperJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    authLogger.info('🔐 validateDeveloperJWT: Starting validation', {
      method: req.method,
      path: req.path,
      hasAuthHeader: !!req.headers.authorization,
      authHeader: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'null'
    });
    
    // Skip authentication for public routes
    if (isPublicRoute(req)) {
      authLogger.info('🔐 validateDeveloperJWT: Public route, skipping');
      return next();
    }
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw new ApiError(401, 'Authorization token is required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    if (!decoded.id || !decoded.email) {
      throw new ApiError(401, 'Invalid token payload');
    }

    // Check if token is in blacklist (for logout functionality)
    const blacklistKey = `blacklist:${token}`;
    const isBlacklisted = await redisService.get(blacklistKey);
    
    if (isBlacklisted) {
      logSecurityEvent('blacklisted_token_used', 'medium', {
        developerId: decoded.id,
        ip: req.ip,
        endpoint: req.path,
      });
      throw new ApiError(401, 'Token has been revoked');
    }

    // Get developer from cache or database
    const developerCacheKey = `developer:${decoded.id}`;
    let developerData = await redisService.get(developerCacheKey);
    
    if (!developerData) {
      const developer = await prisma.developer.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      });

      if (!developer) {
        logSecurityEvent('developer_token_user_not_found', 'high', {
          developerId: decoded.id,
          ip: req.ip,
          endpoint: req.path,
        });
        throw new ApiError(401, 'Developer not found');
      }

      if (developer.status !== 'ACTIVE') {
        logSecurityEvent('inactive_developer_access_attempt', 'high', {
          developerId: developer.id,
          status: developer.status,
          ip: req.ip,
          endpoint: req.path,
        });
        throw new ApiError(403, 'Account is not active');
      }

      developerData = {
        id: developer.id,
        email: developer.email,
        name: developer.name,
        status: developer.status,
      };

      // Cache developer data
      await redisService.setex(developerCacheKey, config.CACHE_TTL_DEVELOPER, developerData);
    }

    // Attach developer data to request
    req.user = {
      id: developerData.id,
      email: developerData.email,
      role: 'DEVELOPER',
      developerId: developerData.id, // For developer endpoints, developerId is the same as id
    };

    authLogger.info('Developer JWT token validated successfully', {
      developerId: developerData.id,
      email: developerData.email,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    authLogger.error('🔐 validateDeveloperJWT: Validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: req.path,
      hasAuthHeader: !!req.headers.authorization
    });
    
    if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent('invalid_developer_jwt_token', 'medium', {
        error: error.message,
        ip: req.ip,
        endpoint: req.path,
      });
      res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString(),
      });
    } else if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: 'AUTHENTICATION_FAILED',
        timestamp: new Date().toISOString(),
      });
    } else {
      authLogger.error('Developer JWT validation error', {
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
 * Middleware to check if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent('insufficient_permissions', 'medium', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: req.path,
        ip: req.ip,
      });
      
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check API key scopes
 */
export const requireScope = (requiredScopes: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json({
        error: 'API key authentication required',
        code: 'API_KEY_REQUIRED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const hasRequiredScope = requiredScopes.some(scope => 
      req.apiKey!.scopes.includes(scope) || req.apiKey!.scopes.includes('*')
    );

    if (!hasRequiredScope) {
      logSecurityEvent('insufficient_api_key_scopes', 'medium', {
        apiKeyId: req.apiKey.id,
        apiKeyScopes: req.apiKey.scopes,
        requiredScopes,
        endpoint: req.path,
        ip: req.ip,
      });
      
      res.status(403).json({
        error: 'Insufficient API key permissions',
        code: 'INSUFFICIENT_SCOPES',
        requiredScopes,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no auth provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers.authorization;

  try {
    if (apiKey) {
      await validateApiKey(req, res, () => {});
    } else if (authHeader) {
      await validateJWT(req, res, () => {});
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    authLogger.debug('Optional authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
    });
  }

  next();
};

export default {
  validateApiKey,
  validateJWT,
  validateDeveloperJWT,
  requireRole,
  requireScope,
  optionalAuth,
  // Add isPublicRoute for direct access in routes
  isPublicRoute,
};