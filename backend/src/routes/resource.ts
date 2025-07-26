import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { validateApiKey, requireScope, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { apiLogger, s3Logger } from '@/utils/logger';
import { redisService } from '@/services/RedisService';
import { s3Service } from '@/services/S3Service';
import { schemas } from '@/schemas/validation';
import { config } from '@/config/config';
import { validateDeveloperJWT } from '@/middleware/auth';
import { skipProjectPermission } from '@/middleware/skipProjectPermissions';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: 1, // Allow single file upload
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = config.ALLOWED_FILE_TYPES.split(',').map((type) => type.trim());
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'INVALID_FILE_TYPE', `File type ${fileExtension} is not allowed`));
    }
  },
});

/**
 * @swagger
 * /api/resource/categories:
 *   get:
 *     summary: Get resource categories accessible to developer
 *     tags: [Resource]
 *     security:
 *       - apiKey: [resource:read]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: true
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         required: true
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *         description: Field to sort by
 *         default: name
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering categories
 *     responses:
 *       200:
 *         description: List of resource categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           isPremium:
 *                             type: boolean
 *                           price:
 *                             type: number
 *                           metadata:
 *                             type: object
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           _count:
 *                             type: object
 *                             properties:
 *                               resources:
 *                                 type: integer
 *                           permission:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               isPaid:
 *                                 type: boolean
 *                               paidAmount:
 *                                 type: number
 *                               grantedAt:
 *                                 type: string
 *                                 format: date-time
 *                               expiredAt:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient scope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route GET /api/resource/categories
 * @desc Get resource categories accessible to developer
 * @access Private (API Key)
 */
router.get(
  '/categories',
  validateApiKey,
  requireScope(['resource:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.apiKey!.developerId;
    const { page, limit, sortBy = 'name', sortOrder, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);



    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.itemCategory.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          metadata: true,
          updatedAt: true,
          createdAt: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.itemCategory.count({ where }),
    ]);

    // Transform data
    const transformedCategories = categories.map((category) => {
      return {
        ...category,
        permission: null,
      };
    });

    res.json({
      success: true,
      data: {
        categories: transformedCategories,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/resource/categories/{categoryId}/resources:
 *   get:
 *     summary: Get resources in a category
 *     tags: [Resource]
 *     security:
 *       - apiKey: [resource:read]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: true
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         required: true
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *         description: Field to sort by
 *         default: name
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering resources
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by file type
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *         style: form
 *         explode: true
 *     responses:
 *       200:
 *         description: List of resources in the category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     resources:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Resource'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied to this resource category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route GET /api/resource/categories/:categoryId/resources
 * @desc Get resources in a category
 * @access Private (API Key)
 */
router.get(
  '/categories/:categoryId/resources',
  validateApiKey,
  requireScope(['resource:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { categoryId } = req.params;
    const developerId = req.apiKey!.developerId;
    const { page, limit, sortBy = 'name', sortOrder, search, type, tags } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // All developers have access to all categories since category permissions were removed
    // No need to check for permission

    // Build where clause
    const where: any = {
      categoryId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.fileType = type;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = {
        contains: tagArray.join(','),
      };
    }

    const [resources, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          fileType: true,
          fileSize: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.item.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/resource/search:
 *   get:
 *     summary: Search resources across categories
 *     tags: [Resource]
 *     security:
 *       - apiKey: [resource:read]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by file type
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, name, downloads, size, createdAt]
 *         description: Field to sort by
 *         default: relevance
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     resources:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           fileType:
 *                             type: string
 *                           fileSize:
 *                             type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                     query:
 *                       type: string
 *       400:
 *         description: Bad request - Search query is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient scope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route GET /api/resource/search
 * @desc Search resources across categories
 * @access Private (API Key)
 */
router.get(
  '/search',
  validateApiKey,
  requireScope(['resource:read']),
  validationErrorHandler(schemas.resourceSearch, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.apiKey!.developerId;
    const { q, type, tags, categoryId, page, limit, sortBy = 'relevance', sortOrder } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get all categories since category permissions were removed
    const allCategories = await prisma.itemCategory.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    // All developers have access to all categories
    const categoryIds: string[] = allCategories.map((c) => c.id);

    if (categoryIds.length === 0) {
      // No accessible categories found at all → return empty result
      res.json({
        success: true,
        data: {
          resources: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0,
          },
        },
      });
      return;
    }

    // Build search query
    const where: any = {
      categoryId: { in: categoryIds },
    };

    // Apply text search only when a real query is provided (not wildcard '*')
    if (q && q !== '*') {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.fileType = type;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { contains: tagArray.join(',') };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'downloads') {
      orderBy = { downloadCount: sortOrder };
    } else if (sortBy === 'size') {
      orderBy = { fileSize: sortOrder };
    }

    const [resources, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          fileType: true,
          fileSize: true,
          createdAt: true,
          isPremium: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.item.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
        query: q,
      },
    });
  })
);

/**
 * @swagger
 * /api/resource/{id}:
 *   get:
 *     summary: Get resource details
 *     tags: [Resource]
 *     security:
 *       - apiKey: [resource:read]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied to this resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route GET /api/resource/:id
 * @desc Get resource details
 * @access Private (API Key)
 */
router.get(
  '/:id',
  validateApiKey,
  requireScope(['resource:read']),
  skipProjectPermission('item', 'access'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;

    const resource = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        fileType: true,
        fileSize: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    // Category permissions have been removed - all developers now have access to all categories
    // No need to check for permission anymore

    // Remove sensitive data
    const responseData = {
      ...resource,
      categoryId: resource.categoryId,
    };

    res.json({
      success: true,
      data: responseData,
    });
  })
);

/**
 * @route GET /api/resource/:id/basic
 * @desc Get basic resource details (name, description, metadata) – JWT developer, no category permission check
 */
router.get(
  '/:id/basic',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const resource = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        fileType: true,
        fileSize: true,
        accessPolicy: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        isPremium: true,
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    res.json({ success: true, data: resource });
  })
);

/**
 * @swagger
 * /api/resource/{id}/download:
 *   get:
 *     summary: Download resource file
 *     tags: [Resource]
 *     security:
 *       - apiKey: [resource:download]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Download URL for the resource
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     downloadUrl:
 *                       type: string
 *                       format: uri
 *                     filename:
 *                       type: string
 *                     fileSize:
 *                       type: integer
 *                     fileType:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
 *                       description: Expiration time in seconds
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied or permission expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route GET /api/resource/:id/download
 * @desc Download resource file
 * @access Private (API Key)
 */
router.get(
  '/:id/download',
  validateApiKey,
  requireScope(['resource:read']),
  skipProjectPermission('item', 'download'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;
    const startTime = Date.now();

    const resource = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        s3Key: true,
        fileSize: true,
        fileType: true,
        categoryId: true,
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    // Category permissions have been removed - all developers now have access to all categories
    // No need to check for permission anymore

    try {
      // Generate pre-signed URL for download
      const downloadUrl = await s3Service.generateDownloadUrl(resource.s3Key, 3600);

      // Log resource usage only - category permissions have been removed
      await Promise.all([
        // Log resource usage
        prisma.resourceUsage.create({
          data: {
            resourceId: resource.id,
            apiKeyId: req.apiKey?.id,
            action: 'download',
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
          },
        }),
      ]);

      const duration = Date.now() - startTime;
      apiLogger.info('Resource download initiated', {
        resourceId: id,
        developerId,
        fileSize: resource.fileSize,
        duration,
      });

      apiLogger.info('Resource downloaded', {
        resourceId: id,
        resourceName: resource.name,
        developerId,
        fileSize: resource.fileSize,
      });

      res.json({
        success: true,
        data: {
          downloadUrl,
          filename: resource.name,
          fileSize: resource.fileSize,
          fileType: resource.fileType,
          expiresIn: 3600, // 1 hour
        },
      });
    } catch (error) {
      apiLogger.error('Resource download failed', {
        resourceId: id,
        developerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      throw error;
    }
  })
);

/**
 * @swagger
 * /api/resource/{id}/download-permission:
 *   get:
 *     summary: Check if user has permission to download a resource
 *     tags: [Resource]
 *     security:
 *       - apiKey: [resource:read]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Download permission status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     canDownload:
 *                       type: boolean
 *                       description: Whether the user can download the resource
 *                     reason:
 *                       type: string
 *                       nullable: true
 *                       description: Reason if download is not allowed
 *                     resource:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         categoryId:
 *                           type: string
 *                         accessPolicy:
 *                           type: string
 *                           enum: [PUBLIC, PRIVATE, PROJECT_ONLY, DEVELOPERS_ONLY]
 *       401:
 *         description: Unauthorized - Invalid API key
 *       403:
 *         description: Forbidden - Insufficient scope
 *       404:
 *         description: Resource not found
 * @route GET /api/resource/:id/download-permission
 * @desc Check if user has permission to download a resource
 * @access Private (API Key)
 */
router.get(
  '/:id/download-permission',
  validateApiKey,
  requireScope(['resource:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;

    // Get resource details
    const resource = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        categoryId: true,
        accessPolicy: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    let canDownload = false;
    let reason: string | null = null;

    // Check access policy
    switch (resource.accessPolicy) {
      case 'PUBLIC':
        canDownload = true;
        break;

      case 'DEVELOPERS_ONLY':
      case 'PROJECT_ONLY':
        // Check if developer exists and is active
        const developer = await prisma.developer.findUnique({
          where: { id: developerId },
          select: { status: true },
        });

        if (developer && developer.status === 'ACTIVE') {
          canDownload = true;
        } else {
          reason = 'Developer account is not active';
        }
        break;

      case 'PRIVATE':
        break;

      default:
        reason = 'Unknown access policy';
    }

    apiLogger.info('Resource download permission checked', {
      resourceId: id,
      developerId,
      canDownload,
      reason: reason || 'Permission granted',
      accessPolicy: resource.accessPolicy,
    });

    res.json({
      success: true,
      data: {
        canDownload,
        reason,
        resource: {
          id: resource.id,
          name: resource.name,
          categoryId: resource.categoryId,
          accessPolicy: resource.accessPolicy,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/resource/{id}/preview:
 *   get:
 *     summary: Generate a pre-signed URL to preview a resource (no permission check)
 *     tags: [Resource]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Pre-signed URL generated
 *       401:
 *         description: Unauthorized – invalid or missing JWT
 *       404:
 *         description: Resource not found
 */
router.get(
  '/:id/preview',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const resource = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        s3Key: true,
        fileSize: true,
        fileType: true,
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    // Generate pre-signed URL (short expiry 15 min)
    const downloadUrl = await s3Service.generateDownloadUrl(resource.s3Key, 900);

    res.json({
      success: true,
      data: {
        downloadUrl,
        fileSize: resource.fileSize,
        fileType: resource.fileType,
        expiresIn: 900,
      },
    });
  })
);

// Resource upload endpoint moved to /api/admin/resource/upload

// Resource update endpoint moved to /api/admin/resource/:id

// Resource delete endpoint moved to /api/admin/resource/:id

export default router;
