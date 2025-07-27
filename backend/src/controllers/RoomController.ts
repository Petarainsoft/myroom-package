import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RoomManagementService } from '../services/RoomManagementService';
import { S3Service } from '../services/S3Service';
import {
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomQuery,
  RoomLoadOptions,
  CreateRoomUsageRequest,
  RoomUsageQuery,
  GrantRoomPermissionRequest,
  RoomPermissionQuery,
  RoomStatus,
  RoomUsageAction,
} from '../types/room';
import multer from 'multer';
import { z } from 'zod';

// Validation schemas
const createRoomResourceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  roomTypeId: z.string(),
  version: z.string().optional(),
  // uniquePath removed as it's no longer in schema
  resourceId: z.string().optional(),
  isPremium: z.coerce.boolean().optional(),
  isFree: z.coerce.boolean().optional(),
  price: z.number().positive().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.string().optional(),
  keywords: z.string().optional(),
});

const updateRoomResourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  roomTypeId: z.string().optional(),
  version: z.string().optional(),
  // uniquePath removed as it's no longer in schema
  resourceId: z.string().optional(),
  isPremium: z.coerce.boolean().optional(),
  isFree: z.coerce.boolean().optional(),
  price: z.number().positive().optional(),
  status: z.nativeEnum(RoomStatus).optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.string().optional(),
  keywords: z.string().optional(),
});

const roomResourceQuerySchema = z.object({
  roomTypeId: z.string().optional(),
  status: z.nativeEnum(RoomStatus).optional(),
  isPremium: z.coerce.boolean().optional(),
  isFree: z.coerce.boolean().optional(),
  search: z.string().optional(),
  tags: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'roomTypeId']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeUsage: z.boolean().optional(),
  includePermissions: z.boolean().optional(),
  includeUploadedBy: z.boolean().optional(),
});

// Room Type Schemas
const createRoomTypeSchema = z.object({
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(100),
  description: z.string().optional(),
  resource_path: z.string().min(1).max(255),
});

const updateRoomTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  label: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  resource_path: z.string().min(1).max(255).optional(),
});

export class RoomController {
  private roomService: RoomManagementService;
  private upload: multer.Multer;

  constructor(roomService: RoomManagementService) {
    this.roomService = roomService;

    // Configure multer for file uploads
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
      },
      fileFilter: (req, file, cb) => {
        // Accept GLB files
        if (file.mimetype === 'model/gltf-binary' || file.originalname.endsWith('.glb')) {
          cb(null, true);
        } else {
          cb(new Error('Only GLB files are allowed'));
        }
      },
    });
  }

  async getRoomTypes(req: Request, res: Response): Promise<void> {
    try {
      const roomTypes = await this.roomService.getRoomTypes();
      res.json({
        success: true,
        data: roomTypes,
      });
    } catch (error) {
      console.error('Error getting room types:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get room types',
      });
    }
  }

  async createRoomType(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createRoomTypeSchema.parse(req.body);
      const roomType = await this.roomService.createRoomType(validatedData);
      res.status(201).json({
        success: true,
        data: roomType,
        message: 'Room type created successfully',
      });
    } catch (error) {
      console.error('Error creating room type:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }

      // Handle Prisma unique constraint errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        const prismaError = error as { meta?: { target?: string[] } };
        const field = prismaError.meta?.target?.[0] || 'field';
        res.status(400).json({
          error: 'Validation error',
          message: `A room type with this ${field} already exists`,
          code: 'UNIQUE_CONSTRAINT_ERROR',
          field,
        });
        return;
      }

      res
        .status(500)
        .json({ error: 'Internal server error', message: 'Failed to create room type' });
    }
  }

  async updateRoomType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'Bad request', message: 'Room type ID is required' });
        return;
      }
      const validatedData = updateRoomTypeSchema.parse(req.body);
      const roomType = await this.roomService.updateRoomType(id, validatedData);
      res.json({
        success: true,
        data: roomType,
        message: 'Room type updated successfully',
      });
    } catch (error) {
      console.error('Error updating room type:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }

      // Handle Prisma unique constraint errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        const prismaError = error as { meta?: { target?: string[] } };
        const field = prismaError.meta?.target?.[0] || 'field';
        res.status(400).json({
          error: 'Validation error',
          message: `A room type with this ${field} already exists`,
          code: 'UNIQUE_CONSTRAINT_ERROR',
          field,
        });
        return;
      }

      res
        .status(500)
        .json({ error: 'Internal server error', message: 'Failed to update room type' });
    }
  }

  async deleteRoomType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'Bad request', message: 'Room type ID is required' });
        return;
      }
      await this.roomService.deleteRoomType(id);
      res.json({
        success: true,
        message: 'Room type deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting room type:', error);
      res
        .status(500)
        .json({ error: 'Internal server error', message: 'Failed to delete room type' });
    }
  }

  // Middleware for file upload
  getUploadMiddleware() {
    return this.upload.single('file');
  }

  /**
   * Create a new room resource
   * POST /api/rooms
   */
  async createRoomResource(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      console.log('Step 1: Validating request body data', req.body);
      const validatedData = createRoomResourceSchema.parse(req.body);
      console.log('Validated data:', validatedData);

      // Check if file is uploaded
      console.log('Step 2: Checking uploaded file');
      if (!req.file) {
        console.log('Error: No file uploaded');
        res.status(400).json({
          error: 'File is required',
          message: 'Please upload a GLB file',
        });
        return;
      }
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      // Get admin ID from auth middleware (assuming it's set)
      console.log('Step 3: Getting admin ID from auth middleware');
      const uploadedByAdminId = (req as any).admin?.id;
      console.log('Admin ID:', uploadedByAdminId);

      console.log('Step 4: Preparing create request data');
      const createRequest: CreateRoomRequest = {
        ...validatedData,
        file: {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      };
      console.log('Create request prepared (excluding buffer for logging):', {
        ...createRequest,
        file: {
          originalname: createRequest.file.originalname,
          mimetype: createRequest.file.mimetype,
          size: createRequest.file.size,
        },
      });

      console.log('Step 5: Creating room resource');
      const roomResource = await this.roomService.createRoomResource(
        createRequest,
        uploadedByAdminId
      );
      console.log('Room resource created:', roomResource);

      console.log('Step 6: Sending success response');
      res.status(201).json({
        success: true,
        data: roomResource,
        message: 'Room resource created successfully',
      });
    } catch (error) {
      console.error('Error creating room resource 2:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      // Handle Prisma unique constraint errors (P2002)
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const prismaError = error as { code: string; meta?: { target?: string[] } };
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('resourceId')) {
          res.status(400).json({
            error: 'Duplicate resource',
            message:
              'A resource with this name already exists for this room type. Please use a different name.',
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create room resource',
      });
    }
  }

  /**
   * Get room resources with filtering and pagination
   * GET /api/rooms
   */
  async getRoomResources(req: Request, res: Response): Promise<void> {
    try {
      // Parse and validate query parameters
      const queryParams = {
        ...req.query,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        isPremium: req.query.isPremium ? req.query.isPremium === 'true' : undefined,
        isFree: req.query.isFree ? req.query.isFree === 'true' : undefined,
        includeUsage: req.query.includeUsage ? req.query.includeUsage === 'true' : undefined,
        includePermissions: req.query.includePermissions
          ? req.query.includePermissions === 'true'
          : undefined,
        includeUploadedBy: req.query.includeUploadedBy
          ? req.query.includeUploadedBy === 'true'
          : undefined,
        tags: req.query.tags as string,
      };

      const validatedQuery = roomResourceQuerySchema.parse(queryParams);

      // Extract load options
      const loadOptions: RoomLoadOptions = {
        includeUsage: validatedQuery.includeUsage,
        includePermissions: validatedQuery.includePermissions,
        includeUploadedBy: validatedQuery.includeUploadedBy,
      };

      // Remove load options from query
      const { includeUsage, includePermissions, includeUploadedBy, ...query } = validatedQuery;

      const result = await this.roomService.getRoomResources(query, loadOptions);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error getting room resources:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get room resources',
      });
    }
  }

  /**
   * Get room resource by ID
   * GET /api/rooms/:id
   */
  async getRoomResourceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Room resource ID is required',
        });
        return;
      }

      // Parse load options from query
      const loadOptions: RoomLoadOptions = {
        includeUsage: req.query.includeUsage === 'true',
        includePermissions: req.query.includePermissions === 'true',
        includeUploadedBy: req.query.includeUploadedBy === 'true',
      };

      const roomResource = await this.roomService.getRoomResourceById(id, loadOptions);

      if (!roomResource) {
        res.status(404).json({
          error: 'Not found',
          message: 'Room resource not found',
        });
        return;
      }

      res.json({
        success: true,
        data: roomResource,
      });
    } catch (error) {
      console.error('Error getting room resource by ID:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get room resource',
      });
    }
  }

  /**
   * Get room resource by resourceId
   * GET /api/rooms/resource/:resourceId
   */
  async getRoomResourceByResourceId(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId } = req.params;

      if (!resourceId) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Room resource ID is required',
        });
        return;
      }

      // Parse load options from query
      const loadOptions: RoomLoadOptions = {
        includeUsage: req.query.includeUsage === 'true',
        includePermissions: req.query.includePermissions === 'true',
        includeUploadedBy: req.query.includeUploadedBy === 'true',
      };

      const roomResource = await this.roomService.getRoomResourceByResourceId(resourceId, loadOptions);

      if (!roomResource) {
        res.status(404).json({
          error: 'Not found',
          message: 'Room resource not found',
        });
        return;
      }

      res.json({
        success: true,
        data: roomResource,
      });
    } catch (error) {
      console.error('Error getting room resource by resourceId:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get room resource by resourceId',
      });
    }
  }

  /**
   * Update room resource
   * PUT /api/rooms/:id
   */
  async updateRoomResource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Room resource ID is required',
        });
        return;
      }

      const validatedData = updateRoomResourceSchema.parse(req.body);

      const roomResource = await this.roomService.updateRoomResource(id, validatedData);

      if (!roomResource) {
        res.status(404).json({
          error: 'Not found',
          message: 'Room resource not found',
        });
        return;
      }

      res.json({
        success: true,
        data: roomResource,
        message: 'Room resource updated successfully',
      });
    } catch (error) {
      console.error('Error updating room resource:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update room resource',
      });
    }
  }

  /**
   * Delete room resource
   * DELETE /api/rooms/:id
   */
  async deleteRoomResource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Room resource ID is required',
        });
        return;
      }

      const success = await this.roomService.deleteRoomResource(id);

      if (!success) {
        res.status(404).json({
          error: 'Not found',
          message: 'Room resource not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Room resource deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting room resource:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete room resource',
      });
    }
  }

  /**
   * Get room resources by category
   * GET /api/rooms/category/:category
   */

  async getRoomResourcesByRoomType(req: Request, res: Response): Promise<void> {
    try {
      const { roomTypeId } = req.params;
      if (!roomTypeId) {
        res.status(400).json({ error: 'Room type ID is required' });
        return;
      }
      const roomResources = await this.roomService.getRoomResourcesByRoomType(roomTypeId);
      res.json({ success: true, data: roomResources });
    } catch (error: unknown) {
      console.error('Error getting room resources by type:', error);
      res.status(500).json({ error: 'Failed to get room resources by type' });
    }
  }

  /**
   * Track room resource usage
   * POST /api/rooms/:id/usage
   */
  async trackRoomUsage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action, metadata } = req.body;

      if (!id) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Room resource ID is required',
        });
        return;
      }

      // Validate action
      if (!Object.values(RoomUsageAction).includes(action)) {
        res.status(400).json({
          error: 'Invalid action',
          message: `Action must be one of: ${Object.values(RoomUsageAction).join(', ')}`,
        });
        return;
      }

      // Get developer/project info from auth middleware
      const developerId = (req as any).developer?.id;
      const projectId = (req as any).project?.id;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip;

      const usageData: CreateRoomUsageRequest = {
        roomResourceId: id,
        developerId,
        projectId,
        action,
        userAgent,
        ipAddress,
        metadata,
      };

      const usage = await this.roomService.trackRoomUsage(usageData);

      res.status(201).json({
        success: true,
        data: usage,
        message: 'Room usage tracked successfully',
      });
    } catch (error) {
      console.error('Error tracking room usage:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to track room usage',
      });
    }
  }

  /**
   * Get room usage statistics
   * GET /api/rooms/usage
   */
  async getRoomUsage(req: Request, res: Response): Promise<void> {
    try {
      const query: RoomUsageQuery = {
        roomResourceId: req.query.roomResourceId as string,
        developerId: req.query.developerId as string,
        projectId: req.query.projectId as string,
        action: req.query.action as RoomUsageAction,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const usage = await this.roomService.getRoomUsage(query);

      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      console.error('Error getting room usage:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get room usage',
      });
    }
  }

  /**
   * Grant room resource permission to developer
   * POST /api/rooms/:id/permissions
   */
  async grantRoomPermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { developerId, expiresAt, isPaid, paidAmount, reason } = req.body;

      if (!id) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Room resource ID is required',
        });
        return;
      }

      if (!developerId) {
        res.status(400).json({
          error: 'Developer ID is required',
        });
        return;
      }

      const grantedBy = (req as any).admin?.id;

      const permissionData: GrantRoomPermissionRequest = {
        developerId,
        roomResourceId: id,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isPaid,
        paidAmount,
        grantedBy,
        reason,
      };

      const permission = await this.roomService.grantRoomPermission(permissionData);

      res.status(201).json({
        success: true,
        data: permission,
        message: 'Room permission granted successfully',
      });
    } catch (error) {
      console.error('Error granting room permission:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to grant room permission',
      });
    }
  }

  /**
   * Check room resource permission
   * GET /api/rooms/:id/permissions/check
   */
  async checkRoomPermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { developerId } = req.query;

      if (!id) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Room resource ID is required',
        });
        return;
      }

      if (!developerId) {
        res.status(400).json({
          error: 'Developer ID is required',
        });
        return;
      }

      const hasPermission = await this.roomService.hasRoomPermission(developerId as string, id);

      res.json({
        success: true,
        data: { hasPermission },
      });
    } catch (error) {
      console.error('Error checking room permission:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check room permission',
      });
    }
  }

  /**
   * Download room resource file
   * GET /api/rooms/:id/download
   */
  async downloadRoomResource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Room resource ID is required',
        });
        return;
      }

      // Get room resource to check if it exists
      const roomResource = await this.roomService.getRoomResourceById(id);
      if (!roomResource) {
        res.status(404).json({
          error: 'Not found',
          message: 'Room resource not found',
        });
        return;
      }

      // Generate pre-signed URL for download
      const downloadResult = await this.roomService.generateDownloadUrlWithFallback(roomResource.s3Key);
      const downloadUrl = downloadResult.url;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      res.json({
        success: true,
        data: {
          downloadUrl,
          filename: roomResource.name + '.' + roomResource.fileType,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Error downloading room resource:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate download URL',
      });
    }
  }

  /**
   * Get room resource statistics
   * GET /api/rooms/stats
   */
  async getRoomResourceStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.roomService.getRoomResourceStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting room resource stats:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get room resource statistics',
      });
    }
  }

  /**
   * Get room permissions for developer
   * GET /api/rooms/my/permissions
   */
  async getRoomPermissions(req: Request, res: Response): Promise<void> {
    try {
      const developerId = (req as any).developer?.id;

      if (!developerId) {
        res.status(400).json({
          error: 'Developer ID is required',
        });
        return;
      }

      const permissions = await this.roomService.getRoomPermissions({ developerId });

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      console.error('Error getting developer room permissions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get room permissions',
      });
    }
  }

  async getRoomPresignedDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const developerId = (req as any).developer?.id || (req as any).apiKey?.developerId;

      console.log('=== getRoomPresignedDownloadUrl CALLED ===');
      console.log('getRoomPresignedDownloadUrl - Debug info:', {
        id,
        developerId,
        hasDeveloper: !!(req as any).developer,
        hasApiKey: !!(req as any).apiKey,
        apiKeyData: (req as any).apiKey,
        fullUrl: req.url,
        path: req.path
      });

      if (!id) {
        console.log('Missing room resource ID');
        res.status(400).json({ error: 'Room resource ID is required' });
        return;
      }

      if (!developerId) {
        console.log('Missing developer ID');
        res.status(400).json({ error: 'Developer authentication required' });
        return;
      }

      const hasPermission = await this.roomService.hasRoomPermission(developerId, id);
      if (!hasPermission) {
        res
          .status(403)
          .json({ error: 'Permission denied', message: 'You do not have access to this resource' });
        return;
      }

      const roomResource = await this.roomService.getRoomResourceById(id);
      if (!roomResource) {
        res.status(404).json({ error: 'Room resource not found' });
        return;
      }

      const downloadResult = await this.roomService.generateDownloadUrlWithFallback(roomResource.s3Key);
      const downloadUrl = downloadResult.url;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      res.json({
          success: true,
          data: {
            downloadUrl,
            filename: `${roomResource.name}.glb`,
            expiresAt,
            isPresigned: downloadResult.isPresigned,
          },
        });
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      res.status(500).json({ error: 'Failed to generate download URL' });
    }
  }

  /**
   * Get presigned download URL for room resource by resourceId
   * GET /api/rooms/resource/:resourceId/presigned-download
   */
  async getRoomPresignedDownloadUrlByResourceId(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId } = req.params;

      if (!resourceId) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Room resource ID is required',
        });
        return;
      }

      const downloadUrl = await this.roomService.generateDownloadUrlByResourceId(resourceId);

      if (!downloadUrl) {
        res.status(404).json({
          error: 'Not found',
          message: 'Room resource not found or not available for download',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          downloadUrl,
          expiresIn: '1 hour',
        },
      });
    } catch (error) {
      console.error('Error generating presigned download URL by resourceId:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate download URL by resourceId',
      });
    }
  }
}
