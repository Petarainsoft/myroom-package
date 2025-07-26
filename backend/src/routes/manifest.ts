import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateApiKey, requireScope, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { apiLogger, s3Logger } from '@/utils/logger';
import { redisService } from '@/services/RedisService';
import { s3Service } from '@/services/S3Service';
import { schemas } from '@/schemas/validation';
import { config } from '@/config/config';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/manifest/projects/:projectId/manifests
 * @desc Get all manifests for a project
 * @access Private (API Key)
 * @swagger
 * /api/manifest/projects/{projectId}/manifests:
 *   get:
 *     tags: [Manifest]
 *     summary: Get all manifests for a project
 *     description: Retrieves all manifests associated with a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: List of manifests for the project
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
 *                     manifests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Manifest'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           example: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/projects/:projectId/manifests',
  validateApiKey,
  requireScope(['manifest:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const developerId = req.apiKey!.developerId;
    const { page, limit, sortBy = 'createdAt', sortOrder, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify project belongs to developer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        developerId,
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
          s3Url: true,
          s3Key: true,
          createdAt: true,
          updatedAt: true,
          config: true,
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
 * @swagger
 * /api/manifest/{id}:
 *   get:
 *     tags: [Manifest]
 *     summary: Get manifest details
 *     description: Retrieves detailed information about a specific manifest
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the manifest
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Manifest details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Manifest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id',
  validateApiKey,
  requireScope(['manifest:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;

    const manifest = await prisma.manifest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        version: true,
        description: true,
        status: true,
        s3Url: true,
        s3Key: true,
        createdAt: true,
        updatedAt: true,
        config: true,
        projectId: true,
      },
    });

    if (!manifest) {
      throw ApiError.notFound('Manifest not found');
    }

    // Verify project belongs to developer
    if (manifest.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: manifest.projectId },
        select: { id: true, name: true, developerId: true },
      });
      
      if (!project || project.developerId !== developerId) {
        throw ApiError.forbidden('Access denied to this manifest');
      }
      
      // Add project info to response
      const responseData = {
        ...manifest,
        project: {
          id: project.id,
          name: project.name,
        },
      };
      
      res.json({
        success: true,
        data: responseData,
      });
      return;
    }

    res.json({
      success: true,
      data: manifest,
    });
  })
);

/**
 * @route GET /api/manifest/:id/download
 * @desc Download manifest file
 * @access Private (API Key)
 * @swagger
 * /api/manifest/{id}/download:
 *   get:
 *     tags: [Manifest]
 *     summary: Download manifest file
 *     description: Generates a pre-signed URL to download the manifest file
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the manifest
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Download URL for the manifest file
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
 *                       description: Pre-signed URL to download the file
 *                       example: https://s3.amazonaws.com/bucket/file.json?signature=xyz
 *                     expiresIn:
 *                       type: integer
 *                       description: Time in seconds until the URL expires
 *                       example: 3600
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/download',
  validateApiKey,
  requireScope(['manifest:download']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;
    const startTime = Date.now();

    const manifest = await prisma.manifest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        version: true,
        s3Url: true,
        s3Key: true,
        projectId: true,
      },
    });

    if (!manifest) {
      throw ApiError.notFound('Manifest not found');
    }

    // Verify project belongs to developer
    if (manifest.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: manifest.projectId },
        select: { id: true, name: true, developerId: true },
      });
      
      if (!project || project.developerId !== developerId) {
        throw ApiError.forbidden('Access denied to this manifest');
      }
    }

    // Check developer quota
    const developer = await prisma.developer.findUnique({
        where: { id: developerId },
        select: {
          id: true,
        },
      });

    // Note: Quota checking would be implemented here
    // if (developer && developer.quotaLimit > 0 && developer.quotaUsed >= developer.quotaLimit) {
    //   throw ApiError.quotaExceeded('Download quota exceeded');
    // }

    try {
      // Generate pre-signed URL for download
      const downloadUrl = await s3Service.generateDownloadUrl(
        manifest.s3Url!,
        3600 // 1 hour
      );

      // Note: Developer quota tracking would be implemented here
      // await prisma.developer.update({
      //   where: { id: developerId },
      //   data: { quotaUsed: { increment: 1 } },
      // });

      const duration = Date.now() - startTime;
      s3Logger.info('Manifest download initiated', {
        manifestId: id,
        developerId,
        duration,
      });

      apiLogger.info('Manifest downloaded', {
        manifestId: id,
        manifestName: manifest.name,
        version: manifest.version,
        projectId: manifest.projectId,
        developerId,
      });

      res.json({
        success: true,
        data: {
          downloadUrl,
          filename: `${manifest.name}-v${manifest.version}.json`,
          expiresIn: 3600, // 1 hour
        },
      });
    } catch (error) {
      s3Logger.error('Manifest download failed', {
        manifestId: id,
        developerId,
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
 * @swagger
 * /api/manifest/projects/{projectId}/manifests:
 *   post:
 *     tags: [Manifest]
 *     summary: Create new manifest
 *     description: Creates a new manifest for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - manifestData
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the manifest
 *                 example: "Main Scene Configuration"
 *               description:
 *                 type: string
 *                 description: Description of the manifest
 *                 example: "Configuration for the main scene of the project"
 *               manifestData:
 *                 type: object
 *                 description: JSON data for the manifest
 *                 example: { "scene": { "objects": [], "settings": {} } }
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the manifest
 *                 example: { "author": "John Doe", "version": "1.0.0" }
 *     security:
 *       - apiKey: []
 *     responses:
 *       201:
 *         description: Manifest created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Manifest'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/projects/:projectId/manifests',
  validateApiKey,
  requireScope(['manifest:write']),
  validationErrorHandler(schemas.manifestCreate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const { name, version, description, manifestData, metadata } = req.body;
    const developerId = req.apiKey!.developerId;

    // Verify project belongs to developer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        developerId,
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
      // Upload to S3
      if (!projectId) {
        throw ApiError.badRequest('Project ID is required');
      }
      
      const uploadResult = await s3Service.uploadFile(
        manifestBuffer,
        `${name}-${version}.json`,
        developerId,
        {
          contentType: 'application/json',
          metadata: {
            projectId,
            manifestName: name,
            version,
            uploadedBy: developerId,
            category: 'manifests',
          },
        }
      );
      
      const s3Key = uploadResult.key;

      // Create manifest record
      const manifest = await prisma.manifest.create({
        data: {
          name,
          version,
          description,
          projectId,
          s3Url: s3Key,
          s3Key,
          status: 'ACTIVE',
          config: metadata || {},
        },
        select: {
          id: true,
          name: true,
          version: true,
          description: true,
          status: true,
          createdAt: true,
          config: true,
        },
      });

      const duration = Date.now() - startTime;
      s3Logger.info('Manifest created successfully', {
        manifestId: manifest.id,
        projectId,
        developerId,
        duration,
      });

      apiLogger.info('New manifest created', {
        manifestId: manifest.id,
        manifestName: name,
        version,
        projectId,
        developerId,
      });

      res.status(201).json({
        success: true,
        data: manifest,
      });
    } catch (error) {
      s3Logger.error('Manifest creation failed', {
        projectId,
        developerId,
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
 * @swagger
 * /api/manifest/{id}:
 *   put:
 *     tags: [Manifest]
 *     summary: Update manifest
 *     description: Updates an existing manifest's metadata and/or content
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the manifest to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the manifest
 *                 example: "Updated Scene Configuration"
 *               description:
 *                 type: string
 *                 description: Updated description of the manifest
 *                 example: "Updated configuration for the main scene"
 *               manifestData:
 *                 type: object
 *                 description: Updated JSON data for the manifest (optional)
 *                 example: { "scene": { "objects": [], "settings": { "updated": true } } }
 *               metadata:
 *                 type: object
 *                 description: Updated additional metadata for the manifest
 *                 example: { "author": "Jane Doe", "version": "1.1.0" }
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Manifest updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Manifest'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id',
  validateApiKey,
  requireScope(['manifest:write']),
  validationErrorHandler(schemas.manifestUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { name, description, manifestData, metadata } = req.body;
    const developerId = req.apiKey!.developerId;

    // Check if manifest exists and belongs to developer
    const existingManifest = await prisma.manifest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        version: true,
        s3Key: true,
        projectId: true,
      },
    });

    if (!existingManifest) {
      throw ApiError.notFound('Manifest not found');
    }

    // Verify project belongs to developer
    if (existingManifest.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: existingManifest.projectId },
        select: { id: true, developerId: true },
      });
      
      if (!project || project.developerId !== developerId) {
        throw ApiError.forbidden('Access denied to this manifest');
      }
    }

    const startTime = Date.now();

    try {
      let updateData: any = {
        name,
        description,
        config: metadata,
      };

      // If manifest data is provided, update the file
      if (manifestData) {
        const manifestContent = JSON.stringify(manifestData, null, 2);
        const manifestBuffer = Buffer.from(manifestContent, 'utf-8');
        const fileSize = manifestBuffer.length;

        // Generate new checksum
        const crypto = require('crypto');
        const checksum = crypto.createHash('sha256').update(manifestBuffer).digest('hex');

        // Update file in S3 - first delete old file, then upload new one
        await s3Service.deleteFile(existingManifest.s3Key!);
        
        const uploadResult = await s3Service.uploadFile(
          manifestBuffer,
          `${name || existingManifest.name}-${existingManifest.version}.json`,
          developerId,
          {
            contentType: 'application/json',
            metadata: {
              projectId: existingManifest.projectId!,
              manifestName: name || existingManifest.name,
              version: existingManifest.version,
              updatedBy: developerId,
              category: 'manifests',
            },
          }
        );
        
        // Update the s3Key in updateData
        updateData.s3Key = uploadResult.key;
        updateData.s3Url = uploadResult.key;
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
          updatedAt: true,
          config: true,
        },
      });

      const duration = Date.now() - startTime;
      s3Logger.info('Manifest updated successfully', {
        manifestId: id,
        developerId,
        hasDataUpdate: !!manifestData,
        duration,
      });

      apiLogger.info('Manifest updated', {
        manifestId: id,
        manifestName: manifest.name,
        version: manifest.version,
        developerId,
        updatedFields: Object.keys(updateData),
      });

      res.json({
        success: true,
        data: manifest,
      });
    } catch (error) {
      s3Logger.error('Manifest update failed', {
        manifestId: id,
        developerId,
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
 * @swagger
 * /api/manifest/{id}:
 *   delete:
 *     tags: [Manifest]
 *     summary: Delete manifest
 *     description: Deletes a manifest and its associated file from S3
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the manifest to delete
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Manifest deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Manifest deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id',
  validateApiKey,
  requireScope(['manifest:write']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;

    // Check if manifest exists and belongs to developer
    const manifest = await prisma.manifest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        version: true,
        s3Key: true,
        projectId: true,
      },
    });

    if (!manifest) {
      throw ApiError.notFound('Manifest not found');
    }

    // Verify project belongs to developer
    if (manifest.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: manifest.projectId },
        select: { developerId: true },
      });
      
      if (!project || project.developerId !== developerId) {
        throw ApiError.forbidden('Access denied to this manifest');
      }
    }

    try {
      // Delete from S3
      if (manifest.s3Key) {
        await s3Service.deleteFile(manifest.s3Key);
      }

      // Delete from database
      await prisma.manifest.delete({
        where: { id },
      });

      apiLogger.info('Manifest deleted', {
        manifestId: id,
        manifestName: manifest.name,
        version: manifest.version,
        projectId: manifest.projectId,
        developerId,
      });

      res.json({
        success: true,
        message: 'Manifest deleted successfully',
      });
    } catch (error) {
      apiLogger.error('Manifest deletion failed', {
        manifestId: id,
        developerId,
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
 * @swagger
 * /api/manifest/{id}/content:
 *   get:
 *     tags: [Manifest]
 *     summary: Get manifest content
 *     description: Retrieves the JSON content of a manifest by generating a pre-signed URL
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the manifest
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Pre-signed URL to access manifest content
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
 *                     id:
 *                       type: string
 *                       example: "manifest-123"
 *                     name:
 *                       type: string
 *                       example: "Main Scene Configuration"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     downloadUrl:
 *                       type: string
 *                       description: Pre-signed URL to download the content
 *                       example: "https://s3.amazonaws.com/bucket/file.json?signature=xyz"
 *                     expiresIn:
 *                       type: integer
 *                       description: Time in seconds until the URL expires
 *                       example: 3600
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/content',
  validateApiKey,
  requireScope(['manifest:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;

    const manifest = await prisma.manifest.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        version: true,
        s3Url: true,
        s3Key: true,
        projectId: true,
      },
    });

    if (!manifest) {
      throw ApiError.notFound('Manifest not found');
    }

    // Verify project belongs to developer
    if (manifest.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: manifest.projectId },
        select: { developerId: true },
      });
      
      if (!project || project.developerId !== developerId) {
        throw ApiError.forbidden('Access denied to this manifest');
      }
    }

    try {
      // Get file content from S3
      const fileContent = await s3Service.generateDownloadUrl(
        manifest.s3Url!,
        3600 // 1 hour
      );
      
      // For now, return the presigned URL instead of content
      // In a real implementation, you'd fetch the content using the URL

      apiLogger.info('Manifest content accessed', {
        manifestId: id,
        manifestName: manifest.name,
        version: manifest.version,
        developerId,
      });

      res.json({
        success: true,
        data: {
          id: manifest.id,
          name: manifest.name,
          version: manifest.version,
          downloadUrl: fileContent,
          expiresIn: 3600, // 1 hour
        },
      });
    } catch (error) {
      apiLogger.error('Failed to retrieve manifest content', {
        manifestId: id,
        developerId,
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
 * @swagger
 * /api/manifest/projects/{projectId}/manifests/latest:
 *   get:
 *     tags: [Manifest]
 *     summary: Get latest manifest for a project
 *     description: Retrieves the most recently created active manifest for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by manifest name (optional)
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Latest manifest for the project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Manifest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/projects/:projectId/manifests/latest',
  validateApiKey,
  requireScope(['manifest:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const developerId = req.apiKey!.developerId;
    const { name } = req.query;

    // Verify project belongs to developer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        developerId,
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
        s3Url: true,
        s3Key: true,
        createdAt: true,
        config: true,
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
 * @swagger
 * /api/manifest/projects/{projectId}/manifests/{name}/versions:
 *   get:
 *     tags: [Manifest]
 *     summary: Get all versions of a manifest
 *     description: Retrieves all versions of a specific manifest by name for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the manifest
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: List of manifest versions
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
 *                     manifests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "manifest-123"
 *                           version:
 *                             type: string
 *                             example: "1.0.0"
 *                           description:
 *                             type: string
 *                             example: "Initial version"
 *                           status:
 *                             type: string
 *                             example: "ACTIVE"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 5
 *                         pages:
 *                           type: integer
 *                           example: 1
 *                     manifestName:
 *                       type: string
 *                       example: "Main Scene Configuration"
 *                     project:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "project-123"
 *                         name:
 *                           type: string
 *                           example: "My VR Project"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/projects/:projectId/manifests/:name/versions',
  validateApiKey,
  requireScope(['manifest:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId, name } = req.params;
    const developerId = req.apiKey!.developerId;
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify project belongs to developer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        developerId,
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
          s3Url: true,
          s3Key: true,
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

/**
 * @route GET /api/manifest/projects/:projectId/presets/:name
 * @desc Get preset by name for a project
 * @access Private (API Key)
 * @swagger
 * /api/manifest/projects/{projectId}/presets/{name}:
 *   get:
 *     tags: [Manifest]
 *     summary: Get preset by name for a project
 *     description: Retrieves a preset configuration by name for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the preset (e.g., 'default-preset')
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Preset configuration
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
 *                     id:
 *                       type: string
 *                       example: "preset-123"
 *                     name:
 *                       type: string
 *                       example: "default-preset"
 *                     config:
 *                       type: object
 *                       description: Preset JSON configuration
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/projects/:projectId/presets/:name',
  validateApiKey,
  requireScope(['manifest:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId, name } = req.params;
    const developerId = req.apiKey!.developerId;

    // Verify project belongs to developer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        developerId,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Find preset by name in the project
    const preset = await prisma.manifest.findFirst({
      where: {
        projectId,
        name,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        version: true,
        description: true,
        status: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!preset) {
      throw ApiError.notFound(`Preset '${name}' not found`);
    }

    apiLogger.info('Preset accessed by name', {
      presetId: preset.id,
      presetName: name,
      projectId,
      developerId,
    });

    res.json({
      success: true,
      data: preset,
    });
  })
);

/**
 * @route POST /api/manifest/projects/:projectId/presets
 * @desc Create a new preset for a project
 * @access Private (API Key)
 * @swagger
 * /api/manifest/projects/{projectId}/presets:
 *   post:
 *     tags: [Manifest]
 *     summary: Create a new preset for a project
 *     description: Creates a new preset configuration for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - config
 *             properties:
 *               name:
 *                 type: string
 *                 example: "default-preset"
 *                 description: Unique name for the preset
 *               description:
 *                 type: string
 *                 example: "Default room configuration"
 *                 description: Optional description
 *               config:
 *                 type: object
 *                 description: Preset JSON configuration
 *                 example:
 *                   version: "1.0"
 *                   room:
 *                     name: "Living Room"
 *                     resourceId: "relax-mr_khroom_0001"
 *                   avatar:
 *                     gender: "male"
 *                     parts: {}
 *                   items: []
 *     security:
 *       - apiKey: []
 *     responses:
 *       201:
 *         description: Preset created successfully
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
 *                     id:
 *                       type: string
 *                       example: "preset-123"
 *                     name:
 *                       type: string
 *                       example: "default-preset"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Preset name already exists
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/projects/:projectId/presets',
  validateApiKey,
  requireScope(['manifest:write']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const { name, description, config } = req.body;
    const developerId = req.apiKey!.developerId;

    // Validate required fields
    if (!name || !config) {
      throw ApiError.badRequest('Name and config are required');
    }

    // Verify project belongs to developer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        developerId,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check if preset name already exists in this project
    const existingPreset = await prisma.manifest.findFirst({
      where: {
        projectId,
        name,
      },
    });

    if (existingPreset) {
      throw ApiError.conflict(`Preset with name '${name}' already exists`);
    }

    // Create preset in manifest table
    const preset = await prisma.manifest.create({
      data: {
        name,
        description: description || `Preset configuration: ${name}`,
        version: '1.0.0',
        projectId,
        status: 'ACTIVE',
        config: config, // Store JSON config directly
        // No S3 storage for presets, just config column
      },
      select: {
        id: true,
        name: true,
        version: true,
        description: true,
        status: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    apiLogger.info('Preset created', {
      presetId: preset.id,
      presetName: name,
      projectId,
      developerId,
    });

    res.status(201).json({
      success: true,
      data: preset,
    });
  })
);

/**
 * @route PUT /api/manifest/presets/:id
 * @desc Update a preset
 * @access Private (API Key)
 * @swagger
 * /api/manifest/presets/{id}:
 *   put:
 *     tags: [Manifest]
 *     summary: Update a preset
 *     description: Updates an existing preset configuration
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the preset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "default-preset"
 *                 description: Preset name
 *               description:
 *                 type: string
 *                 example: "Updated room configuration"
 *                 description: Preset description
 *               config:
 *                 type: object
 *                 description: Updated preset JSON configuration
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Preset updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/presets/:id',
  validateApiKey,
  requireScope(['manifest:write']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { name, description, config } = req.body;
    const developerId = req.apiKey!.developerId;

    // Find preset and verify access
    const preset = await prisma.manifest.findUnique({
      where: { id },
      include: {
        project: {
          select: { developerId: true },
        },
      },
    });

    if (!preset) {
      throw ApiError.notFound('Preset not found');
    }

    if (preset.project?.developerId !== developerId) {
      throw ApiError.forbidden('Access denied to this preset');
    }

    // Check for name conflicts if name is being changed
    if (name && name !== preset.name) {
      const existingPreset = await prisma.manifest.findFirst({
        where: {
          projectId: preset.projectId,
          name,
          id: { not: id },
        },
      });

      if (existingPreset) {
        throw ApiError.conflict(`Preset with name '${name}' already exists`);
      }
    }

    // Update preset
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (config) updateData.config = config;

    const updatedPreset = await prisma.manifest.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        version: true,
        description: true,
        status: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    apiLogger.info('Preset updated', {
      presetId: id,
      presetName: updatedPreset.name,
      developerId,
    });

    res.json({
      success: true,
      data: updatedPreset,
    });
  })
);

/**
 * @route PATCH /api/manifest/presets/:id/status
 * @desc Activate or deactivate a preset
 * @access Private (API Key)
 * @swagger
 * /api/manifest/presets/{id}/status:
 *   patch:
 *     tags: [Manifest]
 *     summary: Activate or deactivate a preset
 *     description: Changes the status of a preset (ACTIVE/INACTIVE)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the preset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: "ACTIVE"
 *                 description: New status for the preset
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Preset status updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/presets/:id/status',
  validateApiKey,
  requireScope(['manifest:write']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const developerId = req.apiKey!.developerId;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      throw ApiError.badRequest('Valid status (ACTIVE/INACTIVE) is required');
    }

    // Find preset and verify access
    const preset = await prisma.manifest.findUnique({
      where: { id },
      include: {
        project: {
          select: { developerId: true },
        },
      },
    });

    if (!preset) {
      throw ApiError.notFound('Preset not found');
    }

    if (preset.project?.developerId !== developerId) {
      throw ApiError.forbidden('Access denied to this preset');
    }

    // Update status
    const updatedPreset = await prisma.manifest.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    apiLogger.info('Preset status updated', {
      presetId: id,
      presetName: preset.name,
      newStatus: status,
      developerId,
    });

    res.json({
      success: true,
      data: updatedPreset,
    });
  })
);

/**
 * @route GET /api/manifest/projects/:projectId/presets
 * @desc List all presets for a project
 * @access Private (API Key)
 * @swagger
 * /api/manifest/projects/{projectId}/presets:
 *   get:
 *     tags: [Manifest]
 *     summary: List all presets for a project
 *     description: Retrieves all preset configurations for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Filter by status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: List of presets for the project
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
 *                     presets:
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
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
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
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/projects/:projectId/presets',
  validateApiKey,
  requireScope(['manifest:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const developerId = req.apiKey!.developerId;
    const { page, limit, sortBy = 'createdAt', sortOrder, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify project belongs to developer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        developerId,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const where: any = { projectId };
    if (status) {
      where.status = status;
    }

    const [presets, total] = await Promise.all([
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
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.manifest.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        presets,
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

export default router;