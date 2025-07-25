import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { validateApiKey, requireScope, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { businessLogger, performanceLogger } from '@/utils/logger';
import { redisService } from '@/services/RedisService';
import { s3Service } from '@/services/S3Service';
import { schemas } from '@/schemas/validation';
import { config } from '@/config/config';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.UPLOAD_MAX_FILE_SIZE,
    files: config.UPLOAD_MAX_FILES,
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = config.UPLOAD_ALLOWED_TYPES;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'INVALID_FILE_TYPE', `File type ${fileExtension} is not allowed`));
    }
  },
});

/**
 * @route GET /api/resource/categories
 * @desc Get resource categories accessible to customer
 * @access Private (API Key)
 */
router.get('/categories',
  validateApiKey,
  requireScope(['resource:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customerId = req.apiKey!.customerId;
    const { page, limit, sortBy = 'name', sortOrder, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {
      customerCategoryPermissions: {
        some: {
          customerId,
          status: 'ACTIVE',
        },
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.resourceCategory.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          metadata: true,
          createdAt: true,
          _count: {
            select: {
              resources: {
                where: { status: 'ACTIVE' },
              },
            },
          },
          customerCategoryPermissions: {
            where: { customerId },
            select: {
              permissions: true,
              quotaLimit: true,
              quotaUsed: true,
            },
          },
        },
      }),
      prisma.resourceCategory.count({ where }),
    ]);

    // Transform data to include permission info
    const transformedCategories = categories.map(category => ({
      ...category,
      permissions: category.customerCategoryPermissions[0]?.permissions || [],
      quota: {
        used: category.customerCategoryPermissions[0]?.quotaUsed || 0,
        limit: category.customerCategoryPermissions[0]?.quotaLimit || 0,
      },
      customerCategoryPermissions: undefined,
    }));

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
 * @route GET /api/resource/categories/:categoryId/resources
 * @desc Get resources in a category
 * @access Private (API Key)
 */
router.get('/categories/:categoryId/resources',
  validateApiKey,
  requireScope(['resource:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { categoryId } = req.params;
    const customerId = req.apiKey!.customerId;
    const { page, limit, sortBy = 'name', sortOrder, search, type, tags } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Check if customer has access to this category
    const permission = await prisma.customerCategoryPermission.findFirst({
      where: {
        customerId,
        categoryId,
        status: 'ACTIVE',
      },
    });

    if (!permission) {
      throw ApiError.forbidden('Access denied to this resource category');
    }

    // Build where clause
    const where: any = {
      categoryId,
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = {
        hasSome: tagArray,
      };
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          fileSize: true,
          mimeType: true,
          tags: true,
          metadata: true,
          thumbnailUrl: true,
          downloadCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.resource.count({ where }),
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
        permissions: permission.permissions,
      },
    });
  })
);

/**
 * @route GET /api/resource/:id
 * @desc Get resource details
 * @access Private (API Key)
 */
router.get('/:id',
  validateApiKey,
  requireScope(['resource:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const customerId = req.apiKey!.customerId;

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        fileSize: true,
        mimeType: true,
        tags: true,
        metadata: true,
        thumbnailUrl: true,
        downloadCount: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            customerCategoryPermissions: {
              where: { customerId },
              select: {
                permissions: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    // Check if customer has access to this resource's category
    const permission = resource.category.customerCategoryPermissions[0];
    if (!permission || permission.status !== 'ACTIVE') {
      throw ApiError.forbidden('Access denied to this resource');
    }

    // Remove sensitive data
    const responseData = {
      ...resource,
      category: {
        id: resource.category.id,
        name: resource.category.name,
      },
      permissions: permission.permissions,
    };

    res.json({
      success: true,
      data: responseData,
    });
  })
);

/**
 * @route GET /api/resource/:id/download
 * @desc Download resource file
 * @access Private (API Key)
 */
router.get('/:id/download',
  validateApiKey,
  requireScope(['resource:download']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const customerId = req.apiKey!.customerId;
    const startTime = Date.now();

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        downloadCount: true,
        category: {
          select: {
            id: true,
            customerCategoryPermissions: {
              where: { customerId },
              select: {
                permissions: true,
                status: true,
                quotaUsed: true,
                quotaLimit: true,
              },
            },
          },
        },
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    // Check permissions
    const permission = resource.category.customerCategoryPermissions[0];
    if (!permission || permission.status !== 'ACTIVE') {
      throw ApiError.forbidden('Access denied to this resource');
    }

    if (!permission.permissions.includes('DOWNLOAD')) {
      throw ApiError.forbidden('Download permission denied');
    }

    // Check quota
    if (permission.quotaLimit > 0 && permission.quotaUsed >= permission.quotaLimit) {
      throw ApiError.quotaExceeded('Download quota exceeded for this category');
    }

    try {
      // Generate pre-signed URL for download
      const downloadUrl = await s3Service.getPresignedUrl(
        resource.fileUrl,
        'getObject',
        config.PRESIGNED_URL_EXPIRES_IN
      );

      // Update download count and quota usage
      await Promise.all([
        prisma.resource.update({
          where: { id },
          data: { downloadCount: { increment: 1 } },
        }),
        prisma.customerCategoryPermission.update({
          where: {
            customerId_categoryId: {
              customerId,
              categoryId: resource.category.id,
            },
          },
          data: { quotaUsed: { increment: 1 } },
        }),
        // Log resource usage
        prisma.resourceUsage.upsert({
          where: {
            resourceId_date: {
              resourceId: id,
              date: new Date().toISOString().split('T')[0],
            },
          },
          update: {
            downloadCount: { increment: 1 },
            dataTransferred: { increment: resource.fileSize },
          },
          create: {
            resourceId: id,
            date: new Date().toISOString().split('T')[0],
            downloadCount: 1,
            dataTransferred: resource.fileSize,
          },
        }),
      ]);

      const duration = Date.now() - startTime;
      performanceLogger.info('Resource download initiated', {
        resourceId: id,
        customerId,
        fileSize: resource.fileSize,
        duration,
      });

      businessLogger.info('Resource downloaded', {
        resourceId: id,
        resourceName: resource.name,
        customerId,
        fileSize: resource.fileSize,
      });

      res.json({
        success: true,
        data: {
          downloadUrl,
          filename: resource.name,
          fileSize: resource.fileSize,
          mimeType: resource.mimeType,
          expiresIn: config.PRESIGNED_URL_EXPIRES_IN,
        },
      });
    } catch (error) {
      performanceLogger.error('Resource download failed', {
        resourceId: id,
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      throw error;
    }
  })
);

/**
 * @route POST /api/resource/upload
 * @desc Upload new resource
 * @access Private (API Key with admin scope)
 */
router.post('/upload',
  validateApiKey,
  requireScope(['resource:write']),
  upload.single('file'),
  validationErrorHandler(schemas.resourceCreate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, description, categoryId, type, tags, metadata } = req.body;
    const file = req.file;
    const customerId = req.apiKey!.customerId;

    if (!file) {
      throw ApiError.badRequest('No file provided');
    }

    // Check if customer has upload permission for this category
    const permission = await prisma.customerCategoryPermission.findFirst({
      where: {
        customerId,
        categoryId,
        status: 'ACTIVE',
      },
    });

    if (!permission || !permission.permissions.includes('UPLOAD')) {
      throw ApiError.forbidden('Upload permission denied for this category');
    }

    const startTime = Date.now();

    try {
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      const s3Key = `resources/${categoryId}/${fileName}`;

      // Upload to S3
      const uploadResult = await s3Service.uploadFile({
        key: s3Key,
        body: file.buffer,
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedBy: customerId,
          categoryId,
        },
      });

      // Generate thumbnail for images
      let thumbnailUrl = null;
      if (file.mimetype.startsWith('image/')) {
        // In a real implementation, you would generate a thumbnail here
        // For now, we'll use the same URL
        thumbnailUrl = s3Service.getPublicUrl(s3Key);
      }

      // Create resource record
      const resource = await prisma.resource.create({
        data: {
          name: name || file.originalname,
          description,
          type,
          fileUrl: s3Key,
          fileSize: file.size,
          mimeType: file.mimetype,
          tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
          metadata: metadata || {},
          thumbnailUrl,
          categoryId,
          status: 'ACTIVE',
          downloadCount: 0,
        },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          fileSize: true,
          mimeType: true,
          tags: true,
          metadata: true,
          thumbnailUrl: true,
          createdAt: true,
        },
      });

      const duration = Date.now() - startTime;
      performanceLogger.info('Resource uploaded successfully', {
        resourceId: resource.id,
        customerId,
        fileSize: file.size,
        duration,
      });

      businessLogger.info('New resource uploaded', {
        resourceId: resource.id,
        resourceName: resource.name,
        categoryId,
        customerId,
        fileSize: file.size,
      });

      res.status(201).json({
        success: true,
        data: resource,
      });
    } catch (error) {
      performanceLogger.error('Resource upload failed', {
        customerId,
        categoryId,
        fileSize: file.size,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      throw error;
    }
  })
);

/**
 * @route PUT /api/resource/:id
 * @desc Update resource metadata
 * @access Private (API Key with admin scope)
 */
router.put('/:id',
  validateApiKey,
  requireScope(['resource:write']),
  validationErrorHandler(schemas.resourceUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const customerId = req.apiKey!.customerId;

    // Check if resource exists and customer has permission
    const resource = await prisma.resource.findUnique({
      where: { id },
      select: {
        id: true,
        categoryId: true,
        category: {
          select: {
            customerCategoryPermissions: {
              where: { customerId },
              select: {
                permissions: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    const permission = resource.category.customerCategoryPermissions[0];
    if (!permission || permission.status !== 'ACTIVE' || !permission.permissions.includes('WRITE')) {
      throw ApiError.forbidden('Update permission denied for this resource');
    }

    const updatedResource = await prisma.resource.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        tags: true,
        metadata: true,
        updatedAt: true,
      },
    });

    businessLogger.info('Resource updated', {
      resourceId: id,
      customerId,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: updatedResource,
    });
  })
);

/**
 * @route DELETE /api/resource/:id
 * @desc Delete resource
 * @access Private (API Key with admin scope)
 */
router.delete('/:id',
  validateApiKey,
  requireScope(['resource:write']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const customerId = req.apiKey!.customerId;

    // Check if resource exists and customer has permission
    const resource = await prisma.resource.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        categoryId: true,
        category: {
          select: {
            customerCategoryPermissions: {
              where: { customerId },
              select: {
                permissions: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    const permission = resource.category.customerCategoryPermissions[0];
    if (!permission || permission.status !== 'ACTIVE' || !permission.permissions.includes('DELETE')) {
      throw ApiError.forbidden('Delete permission denied for this resource');
    }

    try {
      // Delete from S3
      await s3Service.deleteFile(resource.fileUrl);

      // Delete from database
      await prisma.resource.delete({
        where: { id },
      });

      businessLogger.info('Resource deleted', {
        resourceId: id,
        resourceName: resource.name,
        customerId,
      });

      res.json({
        success: true,
        message: 'Resource deleted successfully',
      });
    } catch (error) {
      businessLogger.error('Resource deletion failed', {
        resourceId: id,
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  })
);

/**
 * @route GET /api/resource/search
 * @desc Search resources across categories
 * @access Private (API Key)
 */
router.get('/search',
  validateApiKey,
  requireScope(['resource:read']),
  validationErrorHandler(schemas.resourceSearch, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customerId = req.apiKey!.customerId;
    const { q, type, tags, categoryId, page, limit, sortBy = 'relevance', sortOrder } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!q) {
      throw ApiError.badRequest('Search query is required');
    }

    // Get accessible categories
    const accessibleCategories = await prisma.customerCategoryPermission.findMany({
      where: {
        customerId,
        status: 'ACTIVE',
      },
      select: { categoryId: true },
    });

    const categoryIds = accessibleCategories.map(p => p.categoryId);

    if (categoryIds.length === 0) {
      return res.json({
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
    }

    // Build search query
    const where: any = {
      categoryId: { in: categoryIds },
      status: 'ACTIVE',
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
      ],
    };

    if (type) {
      where.type = type;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagArray };
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
      prisma.resource.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          fileSize: true,
          mimeType: true,
          tags: true,
          thumbnailUrl: true,
          downloadCount: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.resource.count({ where }),
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

export default router;