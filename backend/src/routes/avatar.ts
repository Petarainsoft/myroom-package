import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { AvatarManagementService } from '../services/AvatarManagementService';
import { S3Service } from '../services/S3Service';
import { logger } from '../utils/logger';
import {
  AvatarGender,
  AvatarPartType,
  AvatarStatus,
  CreateAvatarRequest,
  UpdateAvatarRequest,
  AvatarQuery,
  AvatarValidationError,
  AvatarNotFoundError,
  AvatarPermissionError,
} from '../types/avatar';
import { validateApiKey, validateJWT } from '../middleware/auth';
import { validateAdmin } from '../middleware/adminAuth';
import { skipProjectPermission } from '../middleware/skipProjectPermissions';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'model/gltf-binary' || file.originalname.endsWith('.glb')) {
      cb(null, true);
    } else {
      cb(new Error('Only GLB files are allowed'));
    }
  },
});

// Initialize services
const prisma = new PrismaClient();
const s3Service = new S3Service();
const avatarLogger = logger.child({ module: 'AvatarRoutes' });
const avatarService = new AvatarManagementService(prisma, s3Service, avatarLogger);

// Error handler
const handleError = (error: any, res: Response): void => {
  avatarLogger.error('Avatar API Error:', error);

  if (error instanceof AvatarValidationError) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      field: error.field,
      value: error.value,
    });
    return;
  }

  if (error instanceof AvatarNotFoundError) {
    res.status(404).json({
      error: 'Not Found',
      message: error.message,
    });
    return;
  }

  if (error instanceof AvatarPermissionError) {
    res.status(403).json({
      error: 'Permission Denied',
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
};

// Avatar Categories Routes

/**
 * GET /api/avatar/categories
 * Get all avatar categories with hierarchy
 */
router.get('/categories', validateApiKey, async (req: Request, res: Response) => {
  try {
    const includeChildren = req.query.includeChildren !== 'false';
    const categories = await avatarService.getAvatarCategories(includeChildren);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /api/avatar/categories/gender/:gender
 * Get avatar categories for specific gender
 */
router.get(
  '/categories/gender/:gender',
  validateApiKey,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const gender = req.params.gender?.toUpperCase() as AvatarGender;

      if (!gender || !Object.values(AvatarGender).includes(gender)) {
        res.status(400).json({
          error: 'Invalid Gender',
          message: 'Gender must be MALE, FEMALE, or UNISEX',
        });
        return;
      }

      const categories = await avatarService.getAvatarCategoriesByGender(gender);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      handleError(error, res);
    }
  }
);

/**
 * @swagger
 * /api/avatar/resources/{resourceId}/presigned:
 *   get:
 *     summary: Get presigned S3 URL for avatar resource
 *     description: Returns a presigned URL to download the avatar resource file
 *     tags: [Avatar Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique resource ID
 *     responses:
 *       200:
 *         description: Presigned URL
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
// Get presigned URL for avatar resource
router.get('/resources/:resourceId/presigned',
  validateApiKey,
  skipProjectPermission('avatar', 'download'),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    avatarLogger.info({
      message: 'Presigned URL request received',
      resourceId: req.params.resourceId,
      developerId: (req as any).apiKey?.developerId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    try {
      const { resourceId } = req.params;
      if (!resourceId) {
        avatarLogger.warn({
          message: 'Missing resource ID in request',
          ip: req.ip
        });
        res.status(400).json({
          error: 'Bad Request',
          message: 'Resource ID is required',
        });
        return;
      }

      // Extract actual ID from resource path format (e.g. male-male_hair-male_hair_001)
      // const resourceParts = resourceId.split('-');
      // if (resourceParts.length < 3) {
      //   avatarLogger.warn({
      //     message: 'Invalid resource ID format',
      //     resourceId,
      //     ip: req.ip
      //   });
      //   res.status(400).json({
      //     error: 'Bad Request', 
      //     message: 'Invalid resource ID format',
      //   });
      //   return;
      // }
      // const actualResourceId = resourceParts[resourceParts.length - 1];

      avatarLogger.warn({
        message: 'Finding avatar resource',
        resourceId: resourceId
      });
      const resource = await prisma.avatar.findUnique({ where: { resourceId: resourceId, deletedAt: null } });
      
      if (!resource) {
        avatarLogger.warn({
          message: 'Avatar resource not found',
          resourceId
        });
        throw new AvatarNotFoundError(resourceId.toString(), 'resource');
      }

      // Check permission for premium
      if (resource.isPremium) {
        const developerId = (req as any).apiKey.developerId;
        avatarLogger.debug({
          message: 'Checking premium permission',
          resourceId,
          developerId
        });

        const permission = await prisma.developerAvatarPermission.findUnique({
          where: {
            developerId_avatarResourceId: {
              developerId,
              avatarResourceId: resource.id,
            },
          },
        });

        if (!permission || (permission.expiresAt && permission.expiresAt < new Date())) {
          avatarLogger.warn({
            message: 'Premium access denied',
            resourceId,
            developerId,
            hasPermission: !!permission,
            expiresAt: permission?.expiresAt
          });
          throw new AvatarPermissionError('No access to this premium resource');
        }
      }

      avatarLogger.debug({
        message: 'Generating S3 download URL',
        resourceId,
        s3Key: resource.s3Key
      });
      const url = await s3Service.generateDownloadUrl(resource.s3Key);

      const responseTime = Date.now() - startTime;
      avatarLogger.info({
        message: 'Presigned URL generated successfully',
        resourceId,
        responseTimeMs: responseTime
      });

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      avatarLogger.error({
        message: 'Error generating presigned URL',
        resourceId: req.params.resourceId,
        error,
        responseTimeMs: responseTime
      });
      handleError(error, res);
    }
  }
);

// Avatar Resources Routes

/**
 * POST /api/avatar/resources
 * Create a new avatar resource (Admin only)
 */
router.post(
  '/resources',
  validateJWT,
  validateAdmin,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'File Required',
          message: 'GLB file is required',
        });
        return;
      }

      const request: CreateAvatarRequest = {
        name: req.body.name,
        description: req.body.description,
        gender: req.body.gender?.toUpperCase() as AvatarGender,
        partType: req.body.partType?.toUpperCase() as AvatarPartType,
        categoryId: req.body.categoryId,
        file: req.file.buffer,
        version: req.body.version,
        uniquePath: req.body.uniquePath,
        resourceId: req.body.resourceId,
        isPremium: req.body.isPremium === 'true',
        isFree: req.body.isFree !== 'false',
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        keywords: req.body.keywords ? JSON.parse(req.body.keywords) : [],
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
      };

      const adminId = (req as any).admin.id;
      const resource = await avatarService.createAvatar(request, adminId);

      res.status(201).json({
        success: true,
        data: resource,
      });
    } catch (error) {
      handleError(error, res);
    }
  }
);

/**
 * GET /api/avatar/resources
 * Get avatar resources with filtering and pagination
 */
router.get('/resources', validateApiKey, async (req: Request, res: Response): Promise<void> => {
  try {
    const query: AvatarQuery = {
      gender: req.query.gender as AvatarGender,
      partType: req.query.partType as AvatarPartType,
      categoryId: req.query.categoryId as string,
      status: req.query.status as AvatarStatus,
      isPremium:
        req.query.isPremium === 'true' ? true : req.query.isPremium === 'false' ? false : undefined,
      isFree: req.query.isFree === 'true' ? true : req.query.isFree === 'false' ? false : undefined,
      tags: req.query.tags as string,
      keywords: req.query.keywords as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const options = {
      includeCategory: req.query.includeCategory === 'true',
      includeUsage: req.query.includeUsage === 'true',
      includePermissions: req.query.includePermissions === 'true',
    };

    const result = await avatarService.getAvatars(query, options);

    res.json({
      success: true,
      data: result.resources,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /api/avatar/resources/:id
 * Get avatar resource by ID
 */
router.get('/resources/:id', validateApiKey, skipProjectPermission('avatar', 'access'), async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  avatarLogger.info({
    message: 'Get avatar resource by ID request received',
    resourceId: req.params.id,
    developerId: (req as any).apiKey?.developerId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    queryParams: req.query
  });

  try {
    const options = {
      includeCategory: req.query.includeCategory === 'true',
      includeUsage: req.query.includeUsage === 'true',
      includePermissions: req.query.includePermissions === 'true',
    };

    avatarLogger.debug({
      message: 'Request options',
      options
    });

    const resourceId = req.params.id;
    if (!resourceId) {
      avatarLogger.warn({
        message: 'Missing resource ID in request',
        ip: req.ip
      });
      res.status(400).json({
        error: 'Resource ID is required',
        code: 'MISSING_RESOURCE_ID',
      });
      return;
    }

    avatarLogger.debug({
      message: 'Finding avatar resource',
      resourceId
    });

    const resource = await avatarService.getAvatarById(resourceId, options);

    const responseTime = Date.now() - startTime;
    avatarLogger.info({
      message: 'Avatar resource retrieved successfully',
      resourceId,
      responseTimeMs: responseTime,
      resourceDetails: {
        name: resource.name,
        gender: resource.gender,
        partType: resource.partType,
        status: resource.status
      }
    });

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    avatarLogger.error({
      message: 'Error retrieving avatar resource',
      resourceId: req.params.id,
      error,
      responseTimeMs: responseTime
    });
    handleError(error, res);
  }
});

/**
 * PUT /api/avatar/resources/:id
 * Update avatar resource (Admin only)
 */
router.put(
  '/resources/:id',
  validateJWT,
  validateAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const request: UpdateAvatarRequest = {
        name: req.body.name,
        description: req.body.description,
        categoryId: req.body.categoryId,
        version: req.body.version,
        isPremium: req.body.isPremium,
        isFree: req.body.isFree,
        price: req.body.price,
        status: req.body.status as AvatarStatus,
        tags: req.body.tags,
        keywords: req.body.keywords,
        metadata: req.body.metadata,
      };

      const adminId = (req as any).admin.id;
      const resourceId = req.params.id;
      if (!resourceId) {
        res.status(400).json({
          error: 'Resource ID is required',
          code: 'MISSING_RESOURCE_ID',
        });
        return;
      }

      const resource = await avatarService.updateAvatarResource(resourceId, request, adminId);

      res.json({
        success: true,
        data: resource,
      });
    } catch (error) {
      handleError(error, res);
    }
  }
);

/**
 * DELETE /api/avatar/resources/:id
 * Delete avatar resource (Admin only)
 */
router.delete(
  '/resources/:id',
  validateJWT,
  validateAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = (req as any).admin.id;
      const resourceId = req.params.id;
      if (!resourceId) {
        res.status(400).json({
          error: 'Resource ID is required',
          code: 'MISSING_RESOURCE_ID',
        });
        return;
      }

      await avatarService.deleteAvatar(resourceId, adminId);

      res.json({
        success: true,
        message: 'Avatar resource deleted successfully',
      });
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Avatar Resources by Gender and Part Type

/**
 * GET /api/avatar/resources/gender/:gender/part/:partType
 * Get avatar resources by gender and part type
 */
router.get(
  '/resources/gender/:gender/part/:partType',
  validateApiKey,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const gender = req.params.gender?.toUpperCase() as AvatarGender;
      const partType = req.params.partType?.toUpperCase() as AvatarPartType;

      if (!gender || !Object.values(AvatarGender).includes(gender)) {
        res.status(400).json({
          error: 'Invalid Gender',
          message: 'Gender must be MALE, FEMALE, or UNISEX',
        });
        return;
      }

      if (!partType || !Object.values(AvatarPartType).includes(partType)) {
        res.status(400).json({
          error: 'Invalid Part Type',
          message: 'Part type must be BODY, HAIR, TOP, BOTTOM, SHOES, ACCESSORY, or FULLSET',
        });
        return;
      }

      const query: AvatarQuery = {
        gender,
        partType,
        status: AvatarStatus.ACTIVE,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const result = await avatarService.getAvatars(query, { includeCategory: true });

      res.json({
        success: true,
        data: result.resources,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Avatar API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
