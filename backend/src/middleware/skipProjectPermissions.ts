import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Middleware để bỏ qua việc kiểm tra project permission
 */
export const skipProjectPermission = (resourceType: 'item' | 'avatar' | 'room', action: 'access' | 'download' = 'access'): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Bỏ qua việc kiểm tra permission và cho phép truy cập
    next();
  };
};

/**
 * Middleware để bỏ qua việc kiểm tra project permission bằng resourceId
 */
export const skipProjectPermissionByResourceId = (resourceType: 'item' | 'avatar' | 'room', action: 'access' | 'download' = 'access'): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Bỏ qua việc kiểm tra permission và cho phép truy cập
    next();
  };
};

/**
 * Middleware để bỏ qua việc kiểm tra quyền download
 */
export const skipDownloadPermission = (resourceType: 'item' | 'avatar' | 'room'): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Bỏ qua việc kiểm tra permission và cho phép download
    next();
  };
};