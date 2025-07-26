import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './auth';
import { authLogger } from '@/utils/logger';

const prisma = new PrismaClient();

/**
 * Check if a project has permission to access a specific resource
 */
export const checkProjectPermission = async (
  projectId: string,
  resourceType: 'item' | 'avatar' | 'room',
  resourceId: string
): Promise<boolean> => {
  try {
    switch (resourceType) {
      case 'item':
        const itemPermission = await prisma.projectItemPermission.findUnique({
          where: {
            projectId_itemId: {
              projectId,
              itemId: resourceId,
            },
          },
        });
        
        // If no explicit permission exists, check if item is owned by project
        if (!itemPermission) {
          const item = await prisma.item.findUnique({
            where: { id: resourceId },
            select: { ownerProjectId: true, accessPolicy: true },
          });
          
          if (!item) return false;
          
          // If item is owned by the project, allow access
          if (item.ownerProjectId === projectId) return true;
          
          // If item is public, allow access
          if (item.accessPolicy === 'PUBLIC') return true;
          
          return false;
        }
        
        // Check if permission is still valid
        if (itemPermission.expiresAt && itemPermission.expiresAt < new Date()) {
          return false;
        }
        
        return itemPermission.canAccess;
        
      case 'avatar':
        const avatarPermission = await prisma.projectAvatarPermission.findUnique({
          where: {
            projectId_avatarId: {
              projectId,
              avatarId: resourceId,
            },
          },
        });
        
        // If no explicit permission exists, check if avatar is free
        if (!avatarPermission) {
          const avatar = await prisma.avatar.findUnique({
            where: { id: resourceId },
            select: { isFree: true },
          });
          
          if (!avatar) return false;
          
          // If avatar is free, allow access
          return avatar.isFree;
        }
        
        // Check if permission is still valid
        if (avatarPermission.expiresAt && avatarPermission.expiresAt < new Date()) {
          return false;
        }
        
        return avatarPermission.canAccess;
        
      case 'room':
        const roomPermission = await prisma.projectRoomPermission.findUnique({
          where: {
            projectId_roomId: {
              projectId,
              roomId: resourceId,
            },
          },
        });
        
        // If no explicit permission exists, check if room is free
        if (!roomPermission) {
          const room = await prisma.room.findUnique({
            where: { id: resourceId },
            select: { isFree: true },
          });
          
          if (!room) return false;
          
          // If room is free, allow access
          return room.isFree;
        }
        
        // Check if permission is still valid
        if (roomPermission.expiresAt && roomPermission.expiresAt < new Date()) {
          return false;
        }
        
        return roomPermission.canAccess;
        
      default:
        return false;
    }
  } catch (error) {
    authLogger.error('Error checking project permission', {
      projectId,
      resourceType,
      resourceId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
};

/**
 * Check if project has download permission for a specific resource
 */
const checkDownloadPermission = async (
  projectId: string,
  resourceType: 'item' | 'avatar' | 'room',
  resourceId: string
): Promise<boolean> => {
  try {
    let canDownload = false;
    
    switch (resourceType) {
      case 'item':
        const itemPermission = await prisma.projectItemPermission.findUnique({
          where: {
            projectId_itemId: {
              projectId,
              itemId: resourceId,
            },
          },
        });
        
        if (itemPermission) {
          canDownload = itemPermission.canDownload;
        } else {
          // If no explicit permission, check if item is owned by project or is public
          const item = await prisma.item.findUnique({
            where: { id: resourceId },
            select: { ownerProjectId: true, accessPolicy: true },
          });
          canDownload = item?.ownerProjectId === projectId || item?.accessPolicy === 'PUBLIC' || false;
        }
        break;
        
      case 'avatar':
        const avatarPermission = await prisma.projectAvatarPermission.findUnique({
          where: {
            projectId_avatarId: {
              projectId,
              avatarId: resourceId,
            },
          },
        });
        
        if (avatarPermission) {
          canDownload = avatarPermission.canDownload;
        } else {
          // If no explicit permission, check if avatar is free
          const avatar = await prisma.avatar.findUnique({
            where: { id: resourceId },
            select: { isFree: true },
          });
          canDownload = avatar?.isFree || false;
        }
        break;
        
      case 'room':
        const roomPermission = await prisma.projectRoomPermission.findUnique({
          where: {
            projectId_roomId: {
              projectId,
              roomId: resourceId,
            },
          },
        });
        
        if (roomPermission) {
          canDownload = roomPermission.canDownload;
        } else {
          // If no explicit permission, check if room is free
          const room = await prisma.room.findUnique({
            where: { id: resourceId },
            select: { isFree: true },
          });
          canDownload = room?.isFree || false;
        }
        break;
    }
    
    return canDownload;
  } catch (error) {
    authLogger.error('Error checking download permission', {
      projectId,
      resourceType,
      resourceId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
};

/**
 * Middleware to require project permission for a specific resource type
 */
export const requireProjectPermission = (resourceType: 'item' | 'avatar' | 'room', action: 'access' | 'download' = 'access'): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const projectId = req.apiKey?.projectId;
      
      if (!projectId) {
        res.status(401).json({ 
          error: 'Project authentication required',
          code: 'PROJECT_AUTH_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      if (!id) {
        res.status(400).json({ 
          error: 'Resource ID is required',
          code: 'RESOURCE_ID_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      let hasPermission = false;
      
      if (action === 'download') {
        // For download action, use the download permission logic
        hasPermission = await checkDownloadPermission(projectId, resourceType, id);
      } else {
        // For access action, use the basic permission logic
        hasPermission = await checkProjectPermission(projectId, resourceType, id);
      }
      
      if (!hasPermission) {
        authLogger.warn('Project permission denied', {
          projectId,
          resourceType,
          resourceId: id,
          action,
          endpoint: req.path,
        });
        
        res.status(403).json({ 
          error: 'Permission denied', 
          message: `Project does not have ${action} permission for this ${resourceType}`,
          code: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      authLogger.info('Project permission granted', {
        projectId,
        resourceType,
        resourceId: id,
        action,
        endpoint: req.path,
      });
      
      next();
    } catch (error) {
      authLogger.error('Project permission middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: req.path,
      });
      
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * Middleware to require project permission for a specific resource type using resourceId
 */
export const requireProjectPermissionByResourceId = (resourceType: 'item' | 'avatar' | 'room', action: 'access' | 'download' = 'access'): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { resourceId } = req.params;
      const projectId = req.apiKey?.projectId;
      
      if (!projectId) {
        res.status(401).json({ 
          error: 'Project authentication required',
          code: 'PROJECT_AUTH_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      if (!resourceId) {
        res.status(400).json({ 
          error: 'Resource ID is required',
          code: 'RESOURCE_ID_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      // First, get the actual ID from resourceId
      let actualId: string | null = null;
      
      switch (resourceType) {
        case 'room':
          const room = await prisma.room.findUnique({
            where: { resourceId },
            select: { id: true },
          });
          actualId = room?.id || null;
          break;
        case 'item':
          const item = await prisma.item.findUnique({
            where: { resourceId },
            select: { id: true },
          });
          actualId = item?.id || null;
          break;
        case 'avatar':
          const avatar = await prisma.avatar.findUnique({
            where: { resourceId },
            select: { id: true },
          });
          actualId = avatar?.id || null;
          break;
      }
      
      if (!actualId) {
        res.status(404).json({ 
          error: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      let hasPermission = false;
      
      if (action === 'download') {
        // For download action, use the download permission logic
        hasPermission = await checkDownloadPermission(projectId, resourceType, actualId);
      } else {
        // For access action, use the basic permission logic
        hasPermission = await checkProjectPermission(projectId, resourceType, actualId);
      }
      
      if (!hasPermission) {
        authLogger.warn('Project permission denied', {
          projectId,
          resourceType,
          resourceId,
          actualId,
          action,
          endpoint: req.path,
        });
        
        res.status(403).json({ 
          error: 'Permission denied', 
          message: `Project does not have ${action} permission for this ${resourceType}`,
          code: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      authLogger.info('Project permission granted', {
        projectId,
        resourceType,
        resourceId,
        actualId,
        action,
        endpoint: req.path,
      });
      
      next();
    } catch (error) {
      authLogger.error('Project permission middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: req.path,
      });
      
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * Middleware to require download permission for a specific resource type
 */
export const requireDownloadPermission = (resourceType: 'item' | 'avatar' | 'room'): ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const projectId = req.apiKey?.projectId;
      
      if (!projectId) {
        res.status(401).json({ 
          error: 'Project authentication required',
          code: 'PROJECT_AUTH_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      if (!id) {
        res.status(400).json({ 
          error: 'Resource ID is required',
          code: 'RESOURCE_ID_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      // First check if project has access permission
      const hasAccess = await checkProjectPermission(projectId, resourceType, id);
      
      if (!hasAccess) {
        res.status(403).json({ 
          error: 'Permission denied', 
          message: `Project does not have access to this ${resourceType}`,
          code: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      // Check download permission specifically
      let canDownload = false;
      
      switch (resourceType) {
        case 'item':
          const itemPermission = await prisma.projectItemPermission.findUnique({
            where: {
              projectId_itemId: {
                projectId,
                itemId: id,
              },
            },
          });
          
          if (itemPermission) {
            canDownload = itemPermission.canDownload;
          } else {
            // If no explicit permission, check if item is owned by project or is public
            const item = await prisma.item.findUnique({
              where: { id },
              select: { ownerProjectId: true, accessPolicy: true },
            });
            canDownload = item?.ownerProjectId === projectId || item?.accessPolicy === 'PUBLIC' || false;
          }
          break;
          
        case 'avatar':
          const avatarPermission = await prisma.projectAvatarPermission.findUnique({
            where: {
              projectId_avatarId: {
                projectId,
                avatarId: id,
              },
            },
          });
          
          if (avatarPermission) {
            canDownload = avatarPermission.canDownload;
          } else {
            // If no explicit permission, check if avatar is free
            const avatar = await prisma.avatar.findUnique({
              where: { id },
              select: { isFree: true },
            });
            canDownload = avatar?.isFree || false;
          }
          break;
          
        case 'room':
          const roomPermission = await prisma.projectRoomPermission.findUnique({
            where: {
              projectId_roomId: {
                projectId,
                roomId: id,
              },
            },
          });
          
          if (roomPermission) {
            canDownload = roomPermission.canDownload;
          } else {
            // If no explicit permission, check if room is free
            const room = await prisma.room.findUnique({
              where: { id },
              select: { isFree: true },
            });
            canDownload = room?.isFree || false;
          }
          break;
      }
      
      if (!canDownload) {
        authLogger.warn('Download permission denied', {
          projectId,
          resourceType,
          resourceId: id,
          endpoint: req.path,
        });
        
        res.status(403).json({ 
          error: 'Download permission denied', 
          message: `Project does not have download permission for this ${resourceType}`,
          code: 'DOWNLOAD_PERMISSION_DENIED',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      authLogger.info('Download permission granted', {
        projectId,
        resourceType,
        resourceId: id,
        endpoint: req.path,
      });
      
      next();
    } catch (error) {
      authLogger.error('Download permission middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: req.path,
      });
      
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
};