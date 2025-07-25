import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
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

/**
 * @route GET /api/manifest/projects/:projectId/manifests
 * @desc Get manifests for a project
 * @access Private (API Key)
 */
router.get('/projects/:projectId/manifests',
  validateApiKey,
  requireScope(['manifest:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const customerId = req.apiKey!.customerId;
    const { page, limit, sortBy = 'createdAt', sortOrder, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify project belongs to customer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        customerId,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const where: any = { projectId };
    if (status) {
      where.status = status;
    }

    const [manifests, total] = await Promise.all([
      prisma.manifest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          version: true,
          description: true,
          status: true,
          fileSize: true,
          checksum: true,
          downloadCount: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
        },
      }),
      prisma.manifest.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        manifests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
        project: {
          id: project.id,
          name: project.name,
        },
      },
    });
  })
);

/**
 * @route GET /api/manifest/:id
 * @desc Get manifest details
 * @access Private (API Key)
 */
router.get('/:id',
  validateApiKey,
  requireScope(['manifest:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const customerId = req.apiKey!.customerId;

    const manifest = await prisma.manifest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        version: true,
        description: true,
        status: true,
        fileSize: true,
        checksum: true,
        downloadCount: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
        project: {
          select: {
            id: true,
            name: true,
            customerId: true,
          },
        },
      },
    });

    if (!manifest) {
      throw ApiError.notFound('Manifest not found');
    }

    // Verify manifest belongs to customer's project
    if (manifest.project.customerId !== customerId) {
      throw ApiError.forbidden('Access denied to this manifest');
    }

    // Remove sensitive data
    const responseData = {
      ...manifest,
      project: {
        id: manifest.project.id,
        name: manifest.project.name,
      },
    };

    res.json({
      success: true,
      data: responseData,
    });
  })
);

/**
 * @route GET /api/manifest/:id/download
 * @desc Download manifest file
 * @access Private (API Key)
 */
router.get('/:id/download',
  validateApiKey,
  requireScope(['manifest:download']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const customerId = req.apiKey!.customerId;
    const startTime = Date.now();

    const manifest = await prisma.manifest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        version: true,
        fileUrl: true,
        fileSize: true,
        checksum: true,
        downloadCount: true,
        project: {
          select: {
            id: true,
            name: true,
            customerId: true,
          },
        },
      },
    });

    if (!manifest) {
      throw ApiError.notFound('Manifest not found');
    }

    // Verify manifest belongs to customer's project
    if (manifest.project.customerId !== customerId) {
      throw ApiError.forbidden('Access denied to this manifest');
    }

    // Check customer quota
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        quotaUsed: true,
        quotaLimit: true,
      },
    });

    if (customer && customer.quotaLimit > 0 && customer.quotaUsed >= customer.quotaLimit) {
      throw ApiError.quotaExceeded('Download quota exceeded');
    }

    try {
      // Generate pre-signed URL for download
      const downloadUrl = await s3Service.getPresignedUrl(
        manifest.fileUrl,
        'getObject',
        config.PRESIGNED_URL_EXPIRES_IN
      );

      // Update download count and customer quota
      await Promise.all([
        prisma.manifest.update({
          where: { id },
          data: { downloadCount: { increment: 1 } },
        }),
        prisma.customer.update({
          where: { id: customerId },
          data: { quotaUsed: { increment: 1 } },
        }),
      ]);

      const duration = Date.now() - startTime;
      performanceLogger.info('Manifest download initiated', {
        manifestId: id,
        customerId,
        fileSize: manifest.fileSize,
        duration,
      });

      businessLogger.info('Manifest downloaded', {
        manifestId: id,
        manifestName: manifest.name,
        version: manifest.version,
        projectId: manifest.project.id,
        customerId,
        fileSize: manifest.fileSize,
      });

      res.json({
        success: true,
        data: {
          downloadUrl,
          filename: `${manifest.name}-v${manifest.version}.json`,
          fileSize: manifest.fileSize,
          checksum: manifest.checksum,
          expiresIn: config.PRESIGNED_URL_EXPIRES_IN,
        },
      });
    } catch (error) {
      performanceLogger.error('Manifest download failed', {
        manifestId: id,
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      throw error;
    }
  })
);

/**
 * @route POST /api/manifest/projects/:projectId/manifests
 * @desc Create new manifest
 * @access Private (API Key)
 */
router.post('/projects/:projectId/manifests',
  validateApiKey,
  requireScope(['manifest:write']),
  validationErrorHandler(schemas.manifestCreate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const { name, version, description, manifestData, metadata } = req.body;
    const customerId = req.apiKey!.customerId;

    // Verify project belongs to customer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        customerId,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check if manifest with same name and version already exists
    const existingManifest = await prisma.manifest.findFirst({
      where: {
        projectId,
        name,
        version,
      },
    });

    if (existingManifest) {
      throw ApiError.conflict('Manifest with this name and version already exists');
    }

    const startTime = Date.now();

    try {
      // Prepare manifest content
      const manifestContent = JSON.stringify(manifestData, null, 2);
      const manifestBuffer = Buffer.from(manifestContent, 'utf-8');
      const fileSize = manifestBuffer.length;

      // Generate checksum
      const crypto = require('crypto');
      const checksum = crypto.createHash('sha256').update(manifestBuffer).digest('hex');

      // Generate S3 key
      const fileName = `${name}-v${version}-${Date.now()}.json`;
      const s3Key = `manifests/${projectId}/${fileName}`;

      // Upload to S3
      await s3Service.uploadFile({
        key: s3Key,
        body: manifestBuffer,
        contentType: 'application/json',
        metadata: {
          projectId,
          manifestName: name,
          version,
          uploadedBy: customerId,
        },
      });

      // Create manifest record
      const manifest = await prisma.manifest.create({
        data: {
          name,
          version,
          description,
          projectId,
          fileUrl: s3Key,
          fileSize,
          checksum,
          status: 'ACTIVE',
          downloadCount: 0,
          metadata: metadata || {},
        },
        select: {
          id: true,
          name: true,
          version: true,
          description: true,
          status: true,
          fileSize: true,
          checksum: true,
          createdAt: true,
          metadata: true,
        },
      });

      const duration = Date.now() - startTime;
      performanceLogger.info('Manifest created successfully', {
        manifestId: manifest.id,
        projectId,
        customerId,
        fileSize,
        duration,
      });

      businessLogger.info('New manifest created', {
        manifestId: manifest.id,
        manifestName: name,
        version,
        projectId,
        customerId,
        fileSize,
      });

      res.status(201).json({
        success: true,
        data: manifest,
      });
    } catch (error) {
      performanceLogger.error('Manifest creation failed', {
        projectId,
        customerId,
        manifestName: name,
        version,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      throw error;
    }
  })
);

/**
 * @route PUT /api/manifest/:id
 * @desc Update manifest
 * @access Private (API Key)
 */
router.put('/:id',
  validateApiKey,
  requireScope(['manifest:write']),
  validationErrorHandler(schemas.manifestUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { name, description, manifestData, metadata } = req.body;
    const customerId = req.apiKey!.customerId;

    // Check if manifest exists and belongs to customer
    const existingManifest = await prisma.manifest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        version: true,
        fileUrl: true,
        project: {
          select: {
            id: true,
            customerId: true,
          },
        },
      },
    });

    if (!existingManifest) {
      throw ApiError.notFound('Manifest not found');
    }

    if (existingManifest.project.customerId !== customerId) {
      throw ApiError.forbidden('Access denied to this manifest');
    }

    const startTime = Date.now();

    try {
      let updateData: any = {
        name,
        description,
        metadata,
      };

      // If manifest data is provided, update the file
      if (manifestData) {
        const manifestContent = JSON.stringify(manifestData, null, 2);
        const manifestBuffer = Buffer.from(manifestContent, 'utf-8');
        const fileSize = manifestBuffer.length;

        // Generate new checksum
        const crypto = require('crypto');
        const checksum = crypto.createHash('sha256').update(manifestBuffer).digest('hex');

        // Update file in S3
        await s3Service.uploadFile({
          key: existingManifest.fileUrl,
          body: manifestBuffer,
          contentType: 'application/json',
          metadata: {
            projectId: existingManifest.project.id,
            manifestName: name || existingManifest.name,
            version: existingManifest.version,
            updatedBy: customerId,
          },
        });

        updateData = {
          ...updateData,
          fileSize,
          checksum,
        };
      }

      const manifest = await prisma.manifest.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          version: true,
          description: true,
          status: true,
          fileSize: true,
          checksum: true,
          updatedAt: true,
          metadata: true,
        },
      });

      const duration = Date.now() - startTime;
      performanceLogger.info('Manifest updated successfully', {
        manifestId: id,
        customerId,
        hasDataUpdate: !!manifestData,
        duration,
      });

      businessLogger.info('Manifest updated', {
        manifestId: id,
        manifestName: manifest.name,
        version: manifest.version,
        customerId,
        updatedFields: Object.keys(updateData),
      });

      res.json({
        success: true,
        data: manifest,
      });
    } catch (error) {
      performanceLogger.error('Manifest update failed', {
        manifestId: id,
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      throw error;
    }
  })
);

/**
 * @route DELETE /api/manifest/:id
 * @desc Delete manifest
 * @access Private (API Key)
 */
router.delete('/:id',
  validateApiKey,
  requireScope(['manifest:write']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const customerId = req.apiKey!.customerId;

    // Check if manifest exists and belongs to customer
    const manifest = await prisma.manifest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        version: true,
        fileUrl: true,
        project: {
          select: {
            id: true,
            customerId: true,
          },
        },
      },
    });

    if (!manifest) {
      throw ApiError.notFound('Manifest not found');
    }

    if (manifest.project.customerId !== customerId) {
      throw ApiError.forbidden('Access denied to this manifest');
    }

    try {
      // Delete from S3
      await s3Service.deleteFile(manifest.fileUrl);

      // Delete from database
      await prisma.manifest.delete({
        where: { id },
      });

      businessLogger.info('Manifest deleted', {
        manifestId: id,
        manifestName: manifest.name,
        version: manifest.version,
        projectId: manifest.project.id,
        customerId,
      });

      res.json({
        success: true,
        message: 'Manifest deleted successfully',
      });
    } catch (error) {
      businessLogger.error('Manifest deletion failed', {
        manifestId: id,
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  })
);

/**
 * @route GET /api/manifest/:id/content
 * @desc Get manifest content (JSON data)
 * @access Private (API Key)
 */
router.get('/:id/content',
  validateApiKey,
  requireScope(['manifest:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const customerId = req.apiKey!.customerId;

    const manifest = await prisma.manifest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        version: true,
        fileUrl: true,
        checksum: true,
        project: {
          select: {
            id: true,
            customerId: true,
          },
        },
      },
    });

    if (!manifest) {
      throw ApiError.notFound('Manifest not found');
    }

    if (manifest.project.customerId !== customerId) {
      throw ApiError.forbidden('Access denied to this manifest');
    }

    try {
      // Get file content from S3
      const fileContent = await s3Service.getFileContent(manifest.fileUrl);
      const manifestData = JSON.parse(fileContent.toString('utf-8'));

      businessLogger.info('Manifest content accessed', {
        manifestId: id,
        manifestName: manifest.name,
        version: manifest.version,
        customerId,
      });

      res.json({
        success: true,
        data: {
          id: manifest.id,
          name: manifest.name,
          version: manifest.version,
          checksum: manifest.checksum,
          content: manifestData,
        },
      });
    } catch (error) {
      businessLogger.error('Failed to retrieve manifest content', {
        manifestId: id,
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internalServerError('Failed to retrieve manifest content');
    }
  })
);

/**
 * @route GET /api/manifest/projects/:projectId/manifests/latest
 * @desc Get latest manifest for a project
 * @access Private (API Key)
 */
router.get('/projects/:projectId/manifests/latest',
  validateApiKey,
  requireScope(['manifest:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const customerId = req.apiKey!.customerId;
    const { name } = req.query;

    // Verify project belongs to customer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        customerId,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const where: any = {
      projectId,
      status: 'ACTIVE',
    };

    if (name) {
      where.name = name;
    }

    const manifest = await prisma.manifest.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        version: true,
        description: true,
        status: true,
        fileSize: true,
        checksum: true,
        downloadCount: true,
        createdAt: true,
        metadata: true,
      },
    });

    if (!manifest) {
      throw ApiError.notFound('No manifest found');
    }

    res.json({
      success: true,
      data: manifest,
    });
  })
);

/**
 * @route GET /api/manifest/projects/:projectId/manifests/:name/versions
 * @desc Get all versions of a manifest
 * @access Private (API Key)
 */
router.get('/projects/:projectId/manifests/:name/versions',
  validateApiKey,
  requireScope(['manifest:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId, name } = req.params;
    const customerId = req.apiKey!.customerId;
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify project belongs to customer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        customerId,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const where = {
      projectId,
      name,
    };

    const [manifests, total] = await Promise.all([
      prisma.manifest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          version: true,
          description: true,
          status: true,
          fileSize: true,
          checksum: true,
          downloadCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.manifest.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        manifests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
        manifestName: name,
        project: {
          id: project.id,
          name: project.name,
        },
      },
    });
  })
);

export default router;