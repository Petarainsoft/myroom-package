import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/config';

/**
 * List of routes that should be public (no authentication required)
 * Format: { method: string, path: string }
 */
const publicRoutes = [
  // Health check endpoints
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/health/detailed' },
  { method: 'GET', path: '/api/health/database' },
  { method: 'GET', path: '/api/health/redis' },
  { method: 'GET', path: '/api/health/s3' },
  { method: 'GET', path: '/api/health/system' },
  { method: 'GET', path: '/health' }, // Root health check for load balancers
  
  // Documentation endpoints
  { method: 'GET', path: '/api/docs' },
  { method: 'GET', path: '/api/docs.json' },
  { method: 'GET', path: '/api/postman' },
  { method: 'GET', path: '/api' },
  { method: 'GET', path: '/' },
  
  // Authentication endpoints
  { method: 'POST', path: '/api/admin/auth/login' },
  
  // Test endpoints
  { method: 'GET', path: '/api/admin/test-filter' },
  { method: 'GET', path: '/api/admin/debug-filter' },
  
  // Developer endpoints
  { method: 'POST', path: '/api/developer/register' },
  { method: 'POST', path: '/api/developer/auth/login' },
  { method: 'POST', path: '/api/developer/verify' },
];

/**
 * Middleware to check if a route is public
 * If the route is public, it will skip authentication middleware
 */
export const isPublicRoute = (req: Request): boolean => {
  const { method, path } = req;
  
  // Check if the route is in the public routes list
  return publicRoutes.some(route => {
    // Exact match
    if (route.method === method && route.path === path) {
      return true;
    }
    
    // Path pattern match (for paths with parameters)
    if (route.method === method && route.path.includes(':')) {
      const routeParts = route.path.split('/');
      const pathParts = path.split('/');
      
      if (routeParts.length !== pathParts.length) {
        return false;
      }
      
      return routeParts.every((part, index) => {
        if (part.startsWith(':')) {
          return true; // This is a parameter, so it matches anything
        }
        return part === pathParts[index];
      });
    }
    
    return false;
  });
};

/**
 * Middleware to bypass authentication for public routes
 */
export const publicRouteMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (isPublicRoute(req)) {
    // This is a public route, skip authentication
    return next();
  }
  
  // Not a public route, continue with authentication
  next();
};

export default publicRouteMiddleware;