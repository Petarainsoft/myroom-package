import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  AuthenticatedRequest,
  validateApiKey,
  requireScope,
  validateDeveloperJWT,
} from '@/middleware/auth';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { apiLogger, authLogger, logger } from '../utils/logger';
import { redisService } from '@/services/RedisService';
import { s3Service } from '@/services/S3Service';
import { schemas } from '@/schemas/validation';
import type { SignOptions } from 'jsonwebtoken';
import { config } from '@/config/config';
import jwt from 'jsonwebtoken';
import { databaseService } from '@/services/DatabaseService';
import ItemManagementService from '@/services/ItemManagementService';
import {
  getAccessibleResources,
  checkResourceAccess,
  getDeveloperPermissionsSummary,
  getDeveloperPermissions,
} from '@/utils/resourcePermissions';

const router = Router();
const prisma = new PrismaClient();

// Initialize Resource Management Service
const resourceManagementService = new ItemManagementService(prisma);

// Note: Developer registration is now handled by /api/auth/register endpoint
// This duplicate endpoint has been removed to avoid confusion

/**
 * @swagger
 * /api/developer/verify:
 *   post:
 *     summary: Verify developer email
 *     tags: [Authentication]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Developer'
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *       400:
 *         description: Developer is already verified or suspended
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
 *       404:
 *         description: Developer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route POST /api/developer/verify
 * @desc Verify developer email
 * @access Public (with API key)
 */
router.post(
  '/verify',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email } = req.body;
    const developer = await prisma.developer.findUnique({ where: { email } });
    if (!developer) throw ApiError.notFound('Developer not found');
    if (developer.status !== 'INACTIVE') {
      throw ApiError.badRequest('Developer is already verified or suspended');
    }
    const updatedDeveloper = await prisma.developer.update({
      where: { id: developer.id },
      data: { status: 'ACTIVE' },
      select: { id: true, name: true, email: true, status: true },
    });
    apiLogger.info('Developer email verified', { developerId: developer.id, email });
    res.json({ success: true, data: updatedDeveloper, message: 'Email verified successfully' });
  })
);

/**
 * @swagger
 * /api/developer/profile:
 *   get:
 *     summary: Get developer profile
 *     tags: [Developer Management]
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Developer profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Developer'
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
 *       404:
 *         description: Developer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route GET /api/developer/profile
 * @desc Get developer profile
 * @access Private (Developer with JWT)
 */
router.get(
  '/profile',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.user!.developerId!;

    const developer = await prisma.developer.findUnique({
      where: { id: developerId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    if (!developer) {
      throw ApiError.notFound('Developer not found');
    }

    res.json({
      success: true,
      data: developer,
    });
  })
);

/**
 * @swagger
 * /api/developer/profile:
 *   put:
 *     summary: Update developer profile
 *     tags: [Developer Management]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               website:
 *                 type: string
 *               plan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Developer'
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *       400:
 *         description: Validation error
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
 *       409:
 *         description: Conflict - Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route PUT /api/developer/profile
 * @desc Update developer profile
 * @access Private (Developer with JWT)
 */
router.put(
  '/profile',
  validateDeveloperJWT,
  validationErrorHandler(schemas.developerUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.user!.developerId!;
    const updateData = req.body;
    // Nếu email bị thay đổi, chỉ cập nhật status sang INACTIVE
    if (updateData.email) {
      const existingDeveloper = await prisma.developer.findFirst({
        where: { email: updateData.email, id: { not: developerId } },
      });
      if (existingDeveloper) throw ApiError.conflict('Developer with this email already exists');
      updateData.status = 'INACTIVE';
    }
    // Chỉ giữ lại các trường hợp lệ
    const allowedFields = ['name', 'email', 'phone', 'company', 'website', 'plan', 'status'];
    Object.keys(updateData).forEach((key) => {
      if (!allowedFields.includes(key)) delete updateData[key];
    });
    const developer = await prisma.developer.update({
      where: { id: developerId },
      data: updateData,
      select: { id: true, name: true, email: true, status: true },
    });
    await redisService.del(`developer:${developerId}`);
    apiLogger.info('Developer profile updated', {
      developerId,
      updatedFields: Object.keys(updateData),
    });
    res.json({
      success: true,
      data: developer,
      message: updateData.email
        ? 'Profile updated. Please verify your new email.'
        : 'Profile updated successfully',
    });
  })
);

/**
 * @swagger
 * /api/developer/change-password:
 *   put:
 *     summary: Change developer password
 *     tags: [Developer Management]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: Password changed successfully
 *       401:
 *         description: Unauthorized - Invalid API key or incorrect current password
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
 *       404:
 *         description: Developer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route PUT /api/developer/change-password
 * @desc Change developer password
 * @access Private (Developer with JWT)
 */
router.put(
  '/change-password',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    const developerId = req.user!.developerId!;
    const developer = await prisma.developer.findUnique({
      where: { id: developerId },
      select: { id: true, passwordHash: true },
    });
    if (!developer) throw ApiError.notFound('Developer not found');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, developer.passwordHash);
    if (!isCurrentPasswordValid) {
      authLogger.warn('Developer password change attempt with invalid current password', {
        developerId,
        ip: req.ip,
      });
      throw ApiError.unauthorized('Current password is incorrect');
    }
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await prisma.developer.update({
      where: { id: developerId },
      data: { passwordHash: hashedNewPassword },
    });
    apiLogger.info('Developer password changed', { developerId });
    res.json({ success: true, message: 'Password changed successfully' });
  })
);

/**
 * @swagger
 * /api/developer/projects:
 *   get:
 *     summary: Get developer projects with pagination
 *     tags: [Project Management]
 *     security:
 *       - apiKey: []
 *     parameters:
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt, status]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, ARCHIVED]
 *         description: Filter by project status
 *     responses:
 *       200:
 *         description: List of developer projects
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
 *                     projects:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [ACTIVE, INACTIVE, ARCHIVED]
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
 * @route GET /api/developer/projects
 * @desc Get developer projects
 * @access Private (Developer with API key)
 */
router.get(
  '/projects',
  validateApiKey,
  requireScope(['project:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.apiKey!.developerId;
    const { page, limit, sortBy = 'createdAt', sortOrder, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { developerId };
    if (status) {
      where.status = status;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        projects,
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
 * /api/developer/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Project Management]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Project name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Project description
 *     responses:
 *       201:
 *         description: Project created successfully
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
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE, ARCHIVED]
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid input data
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
 *         description: Forbidden - Insufficient scope or quota exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Developer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route POST /api/developer/projects
 * @desc Create new project
 * @access Private (Developer with API key)
 */
router.post(
  '/projects',
  validateApiKey,
  requireScope(['project:write']),
  validationErrorHandler(schemas.projectCreate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.apiKey!.developerId;
    const { name, description } = req.body;

    // Check developer quota
    const developer = await prisma.developer.findUnique({
      where: { id: developerId },
      select: {
        status: true,
        _count: { select: { projects: true } },
      },
    });

    if (!developer) {
      throw ApiError.notFound('Developer not found');
    }

    // Check project limit based on plan
    const projectLimits = {
      FREE: 3,
      BASIC: 10,
      PRO: 50,
      ENTERPRISE: 1000,
    };
    // Không có trường plan, mặc định là FREE
    const currentPlan = 'FREE';
    const projectLimit = projectLimits[currentPlan as keyof typeof projectLimits];

    if (developer._count.projects >= projectLimit) {
      throw ApiError.quotaExceeded(`Project limit reached for ${currentPlan} plan`);
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        developerId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        updatedAt: true,
      },
    });

    apiLogger.info('New project created', {
      projectId: project.id,
      developerId,
      name: project.name,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  })
);

/**
 * @swagger
 * /api/developer/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Project Management]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
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
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE, ARCHIVED]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
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
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route GET /api/developer/projects/:id
 * @desc Get project by ID
 * @access Private (Developer with API key)
 */
router.get(
  '/projects/:id',
  validateApiKey,
  requireScope(['project:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;

    const project = await prisma.project.findFirst({
      where: {
        id,
        developerId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    res.json({
      success: true,
      data: project,
    });
  })
);

/**
 * @swagger
 * /api/developer/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Project Management]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Project name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Project description
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, ARCHIVED]
 *                 description: Project status
 *     responses:
 *       200:
 *         description: Project updated successfully
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
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE, ARCHIVED]
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid input data
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
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route PUT /api/developer/projects/:id
 * @desc Update project
 * @access Private (Developer with API key)
 */
router.put(
  '/projects/:id',
  validateApiKey,
  requireScope(['project:write']),
  validationErrorHandler(schemas.projectUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;
    const updateData = req.body;

    // Check if project exists and belongs to developer
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        developerId,
      },
    });

    if (!existingProject) {
      throw ApiError.notFound('Project not found');
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        updatedAt: true,
      },
    });

    apiLogger.info('Project updated', {
      projectId: id,
      developerId,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: project,
    });
  })
);

/**
 * @swagger
 * /api/developer/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Project Management]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
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
 *                   example: Project deleted successfully
 *       400:
 *         description: Bad request - Cannot delete project with existing manifests
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
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route DELETE /api/developer/projects/:id
 * @desc Delete project
 * @access Private (Developer with API key)
 */
router.delete(
  '/projects/:id',
  validateApiKey,
  requireScope(['project:write']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;

    // Check if project exists and belongs to developer
    const project = await prisma.project.findFirst({
      where: {
        id,
        developerId,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check if project has manifests
    const manifestCount = await prisma.manifest.count({
      where: {
        projectId: id,
      },
    });

    if (manifestCount > 0) {
      throw ApiError.badRequest('Cannot delete project with existing manifests');
    }

    await prisma.project.delete({
      where: { id },
    });

    apiLogger.info('Project deleted', {
      projectId: id,
      developerId,
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  })
);

/**
 * @swagger
 * /api/developer/api-keys:
 *   post:
 *     summary: Create a new API key for a project
 *     tags: [API Key Management]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - projectId
 *               - scopes
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: API key name
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: Project ID to associate the API key with
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [developer:read, developer:write, project:read, project:write, apikey:read, resource:read, manifest:read]
 *                 minItems: 1
 *                 description: API key scopes/permissions
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date for the API key
 *     responses:
 *       201:
 *         description: API key created successfully
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
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     key:
 *                       type: string
 *                       description: The generated API key (only shown once)
 *                     scopes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE]
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     projectId:
 *                       type: string
 *                       format: uuid
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: API key created successfully
 *       400:
 *         description: Bad request - Invalid input data
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
 *         description: Forbidden - Insufficient scope or project not owned by developer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route POST /api/developer/api-keys
 * @desc Create new API key for a project
 * @access Private (Developer with API key)
 */
router.post(
  '/api-keys',
  validateDeveloperJWT,
  validationErrorHandler(schemas.apiKeyCreate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.user!.developerId!;
    const { name, projectId, scopes, expiresAt } = req.body;

    // Verify that the project belongs to the developer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        developerId,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found or does not belong to developer');
    }

    // Check API key limit per project
    const existingApiKeysCount = await prisma.apiKey.count({
      where: {
        projectId,
        status: 'ACTIVE',
      },
    });

    const apiKeyLimits = {
      FREE: 2,
      BASIC: 5,
      PRO: 20,
      ENTERPRISE: 100,
    };

    // Default to FREE plan
    const currentPlan = 'FREE';
    const apiKeyLimit = apiKeyLimits[currentPlan as keyof typeof apiKeyLimits];

    if (existingApiKeysCount >= apiKeyLimit) {
      throw ApiError.quotaExceeded(
        `API key limit reached for ${currentPlan} plan (${apiKeyLimit} keys per project)`
      );
    }

    // Generate a secure API key
    const apiKey = `pk_${crypto.randomBytes(32).toString('hex')}`;

    // Parse expiration date if provided
    let expirationDate: Date | null = null;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      if (expirationDate <= new Date()) {
        throw ApiError.badRequest('Expiration date must be in the future');
      }
    }

    // Create the API key
    const newApiKey = await prisma.apiKey.create({
      data: {
        key: apiKey,
        name,
        scopes,
        projectId,
        status: 'ACTIVE',
        expiresAt: expirationDate,
      },
      select: {
        id: true,
        name: true,
        key: true,
        scopes: true,
        status: true,
        expiresAt: true,
        projectId: true,
        createdAt: true,
      },
    });

    apiLogger.info('New API key created', {
      apiKeyId: newApiKey.id,
      projectId,
      developerId,
      name: newApiKey.name,
      scopes: newApiKey.scopes,
    });

    res.status(201).json({
      success: true,
      data: newApiKey,
      message:
        'API key created successfully. Please save this key securely as it will not be shown again.',
    });
  })
);

/**
 * @swagger
 * /api/developer/api-keys:
 *   get:
 *     summary: Get developer API keys with pagination
 *     tags: [API Key Management]
 *     security:
 *       - apiKey: []
 *     parameters:
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, lastUsedAt, status]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of developer API keys
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
 *                     apiKeys:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           key:
 *                             type: string
 *                             description: Masked API key (only first few characters shown)
 *                           scopes:
 *                             type: array
 *                             items:
 *                               type: string
 *                           status:
 *                             type: string
 *                             enum: [ACTIVE, REVOKED, EXPIRED]
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           lastUsedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           createdAt:
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
 * @route GET /api/developer/api-keys
 * @desc Get developer API keys
 * @access Private (Developer with JWT)
 */
router.get(
  '/api-keys',
  validateDeveloperJWT,
  validationErrorHandler(schemas.apiKeyQuery, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.user!.developerId!;
    const { page, limit, sortBy = 'createdAt', sortOrder, projectId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause with optional projectId filter
    const whereClause: any = {
      project: {
        developerId,
      },
    };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const [apiKeys, total] = await Promise.all([
      prisma.apiKey.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          key: true, // Full key for frontend to use
          scopes: true,
          status: true,
          expiresAt: true,
          lastUsedAt: true,
          projectId: true, // ✅ Add projectId
          createdAt: true,
        },
      }),
      prisma.apiKey.count({
        where: whereClause,
      }),
    ]);

    // Return full API keys for frontend functionality
    // Note: Consider security implications in production
    res.json({
      success: true,
      data: {
        apiKeys: apiKeys,
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
 * /api/developer/usage/summary:
 *   get:
 *     summary: Get developer usage summary
 *     tags: [Analytics & Usage]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Time period for usage data
 *     responses:
 *       200:
 *         description: Developer usage summary
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
 *                     quota:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: integer
 *                           description: Amount of quota used
 *                         limit:
 *                           type: integer
 *                           description: Total quota limit
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Percentage of quota used
 *                     apiUsage:
 *                       type: object
 *                       properties:
 *                         totalRequests:
 *                           type: integer
 *                           description: Total API requests made
 *                         totalDataTransferred:
 *                           type: integer
 *                           description: Total data transferred in bytes
 *                         dailyUsage:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties: {}
 *                           description: Daily usage statistics
 *                     resourceUsage:
 *                       type: object
 *                       properties:
 *                         totalDownloads:
 *                           type: integer
 *                           description: Total resource downloads
 *                         totalDataTransferred:
 *                           type: integer
 *                           description: Total data transferred in bytes
 *                         dailyUsage:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties: {}
 *                           description: Daily usage statistics
 *                     plan:
 *                       type: string
 *                       enum: [FREE, BASIC, PRO, ENTERPRISE]
 *                       description: Current subscription plan
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
 * @route GET /api/developer/usage/summary
 * @desc Get developer usage summary
 * @access Private (Developer with JWT)
 */
router.get(
  '/usage/summary',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.user!.developerId!;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const [apiKeyUsageCount, resourceUsageCount, developer] = await Promise.all([
      prisma.apiKeyUsage.count({
        where: {
          apiKey: {
            project: {
              developerId,
            },
          },
          createdAt: { gte: startDate },
        },
      }),
      prisma.resourceUsage.count({
        where: {
          resource: {
            status: 'ACTIVE',
            deletedAt: null,
          },
          createdAt: { gte: startDate },
        },
      }),
      prisma.developer.findUnique({
        where: { id: developerId },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    const summary = {
      quota: {
        used: 0, // Note: Quota tracking would be implemented here
        limit: 1000, // Default limit
        percentage: 0,
      },
      apiUsage: {
        totalRequests: apiKeyUsageCount,
        totalDataTransferred: 0, // Note: Data transfer tracking would be implemented here
        dailyUsage: [], // Note: Daily usage tracking would be implemented here
      },
      resourceUsage: {
        totalDownloads: resourceUsageCount,
        totalDataTransferred: 0, // Note: Data transfer tracking would be implemented here
        dailyUsage: [], // Note: Daily usage tracking would be implemented here
      },
      plan: 'FREE', // Default plan
    };

    res.json({
      success: true,
      data: summary,
    });
  })
);

/**
 * @swagger
 * /api/developer/usage-stats:
 *   get:
 *     summary: Get detailed developer usage statistics
 *     tags: [Analytics & Usage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Time period for usage data
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for activity logs
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of activity items per page
 *     responses:
 *       200:
 *         description: Detailed developer usage statistics
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         apiCalls:
 *                           type: integer
 *                           description: Total API calls in period
 *                         downloads:
 *                           type: integer
 *                           description: Total downloads in period
 *                         storageUsed:
 *                           type: integer
 *                           description: Storage used in bytes
 *                         activeProjects:
 *                           type: integer
 *                           description: Number of active projects
 *                         apiCallsChange:
 *                           type: number
 *                           description: Percentage change vs previous period
 *                         downloadsChange:
 *                           type: number
 *                           description: Percentage change vs previous period
 *                     dailyStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           apiCalls:
 *                             type: integer
 *                           downloads:
 *                             type: integer
 *                           dataTransferred:
 *                             type: integer
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [api_call, download, upload, project_created]
 *                           description:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           metadata:
 *                             type: object
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
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * @route GET /api/developer/usage-stats
 * @desc Get detailed developer usage statistics
 * @access Private (Developer with JWT)
 */
router.get(
  '/usage-stats',
  validateDeveloperJWT,
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.user!.developerId!;
    const { period = '30d', page, limit } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Calculate date ranges
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get summary statistics
    const [
      currentApiCalls,
      previousApiCalls,
      currentDownloads,
      previousDownloads,
      activeProjects,
      totalProjects,
    ] = await Promise.all([
      prisma.apiKeyUsage.count({
        where: {
          apiKey: {
            project: { developerId },
          },
          createdAt: { gte: startDate },
        },
      }),
      prisma.apiKeyUsage.count({
        where: {
          apiKey: {
            project: { developerId },
          },
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
      prisma.resourceUsage.count({
        where: {
          resource: {
            status: 'ACTIVE',
            deletedAt: null,
          },
          createdAt: { gte: startDate },
        },
      }),
      prisma.resourceUsage.count({
        where: {
          resource: {
            status: 'ACTIVE',
            deletedAt: null,
          },
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
      prisma.project.count({
        where: { developerId, status: 'ACTIVE' },
      }),
      prisma.project.count({
        where: { developerId },
      }),
    ]);

    // Calculate percentage changes
    const apiCallsChange =
      previousApiCalls > 0
        ? ((currentApiCalls - previousApiCalls) / previousApiCalls) * 100
        : currentApiCalls > 0
          ? 100
          : 0;

    const downloadsChange =
      previousDownloads > 0
        ? ((currentDownloads - previousDownloads) / previousDownloads) * 100
        : currentDownloads > 0
          ? 100
          : 0;

    // Get daily statistics (simplified - in production, you'd aggregate by day)
    const dailyStats = [];
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const [dayApiCalls, dayDownloads] = await Promise.all([
        prisma.apiKeyUsage.count({
          where: {
            apiKey: {
              project: { developerId },
            },
            createdAt: { gte: date, lt: nextDate },
          },
        }),
        prisma.resourceUsage.count({
          where: {
            resource: {
              status: 'ACTIVE',
              deletedAt: null,
            },
            createdAt: { gte: date, lt: nextDate },
          },
        }),
      ]);

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        apiCalls: dayApiCalls,
        downloads: dayDownloads,
        dataTransferred: dayDownloads * 1024 * 1024, // Mock data
      });
    }

    // Get recent activity (simplified)
    const recentActivity = [
      {
        id: '1',
        type: 'api_call',
        description: 'API key used for resource access',
        timestamp: new Date().toISOString(),
        metadata: { endpoint: '/resource/categories' },
      },
      {
        id: '2',
        type: 'download',
        description: 'Downloaded 3D model asset',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: { resourceName: 'modern_chair.gltf' },
      },
      // Add more mock activities as needed
    ];

    apiLogger.info('Developer retrieved usage statistics', {
      developerId,
      period,
      currentApiCalls,
      currentDownloads,
    });

    res.json({
      success: true,
      data: {
        summary: {
          apiCalls: currentApiCalls,
          downloads: currentDownloads,
          storageUsed: totalProjects * 50 * 1024 * 1024, // Mock: 50MB per project
          activeProjects,
          apiCallsChange: Number(apiCallsChange.toFixed(2)),
          downloadsChange: Number(downloadsChange.toFixed(2)),
        },
        dailyStats,
        recentActivity: recentActivity.slice(skip, skip + Number(limit)),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: recentActivity.length,
          pages: Math.ceil(recentActivity.length / Number(limit)),
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/developer/auth/login:
 *   post:
 *     summary: Developer login
 *     tags: [Developer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account is not active
 */
router.post(
  '/auth/login',
  validationErrorHandler(schemas.developerLogin),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, password } = req.body;

    // Find developer by email
    const developer = await prisma.developer.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!developer) {
      authLogger.warn('Developer login attempt with invalid email', {
        email,
        ip: req.ip,
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Check developer status
    if (developer.status !== 'ACTIVE') {
      authLogger.warn('Inactive developer login attempt', {
        developerId: developer.id,
        status: developer.status,
        ip: req.ip,
      });
      throw ApiError.forbidden('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, developer.passwordHash);
    if (!isPasswordValid) {
      authLogger.warn('Developer login attempt with invalid password', {
        developerId: developer.id,
        ip: req.ip,
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Generate JWT token
    const expiresIn: string | number = /^\d+$/.test(config.JWT_EXPIRES_IN)
      ? parseInt(config.JWT_EXPIRES_IN, 10)
      : config.JWT_EXPIRES_IN;

    const jwtOptions: SignOptions = {
      expiresIn: expiresIn as any,
    };
    const token = jwt.sign(
      {
        id: developer.id,
        email: developer.email,
        role: 'DEVELOPER',
      },
      config.JWT_SECRET as string,
      jwtOptions
    );

    // Cache developer data
    const developerData = {
      id: developer.id,
      email: developer.email,
      name: developer.name,
      status: developer.status,
    };
    await redisService.setex(`developer:${developer.id}`, config.CACHE_TTL_DEVELOPER, developerData);

    authLogger.info('Developer logged in successfully', {
      developerId: developer.id,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: {
        token,
        developer: {
          id: developer.id,
          email: developer.email,
          name: developer.name,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/developer/auth/logout:
 *   post:
 *     summary: Developer logout
 *     tags: [Developer Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post(
  '/auth/logout',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const token = req.headers.authorization?.substring(7); // Remove 'Bearer ' prefix

    if (token) {
      // Add token to blacklist
      const decoded = jwt.decode(token) as any;
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

      if (expiresIn > 0) {
        await redisService.setex(`blacklist:${token}`, expiresIn, 'true');
      }
    }

    // Remove developer from cache
    await redisService.del(`developer:${req.user!.id}`);

    authLogger.info('Developer logged out successfully', {
      developerId: req.user!.id,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * @swagger
 * /api/developer/auth/profile:
 *   get:
 *     summary: Get current developer profile
 *     tags: [Developer Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get(
  '/auth/profile',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developer = await prisma.developer.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
            resourcePermissions: true,
          },
        },
      },
    });

    if (!developer) {
      throw ApiError.notFound('Developer not found');
    }

    res.json({
      success: true,
      data: developer,
    });
  })
);

/**
 * @swagger
 * /api/developer/my/projects:
 *   get:
 *     summary: Get developer's projects (JWT authenticated)
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 */
router.get(
  '/my/projects',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    logger.info('🚀 Developer fetching projects', {
      developerId: req.user!.developerId,
      userRole: req.user!.role,
    });

    const projects = await prisma.project.findMany({
      where: {
        developerId: req.user!.developerId, // Use developerId from JWT token
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            apiKeys: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: projects,
    });
  })
);

/**
 * @swagger
 * /api/developer/my/projects:
 *   post:
 *     summary: Create new project (JWT authenticated)
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Project created successfully
 */
router.post(
  '/my/projects',
  validateDeveloperJWT,
  validationErrorHandler(schemas.projectCreateJwt),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, description } = req.body;
    const developerId = req.user!.developerId!;

    logger.info('🚀 Developer creating project', {
      developerId,
      projectName: name,
      userRole: req.user!.role,
    });

    const project = await prisma.project.create({
      data: {
        name,
        description,
        developerId, // Use developerId from JWT token
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        developerId: true,
      },
    });

    apiLogger.info('Project created by developer', {
      projectId: project.id,
      developerId,
      projectName: project.name,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  })
);

/**
 * @swagger
 * /api/developer/projects/{projectId}/manifests:
 *   get:
 *     summary: Get manifests for a project (JWT authenticated)
 *     tags: [Developer Manifests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manifests retrieved successfully
 */
router.get(
  '/projects/:projectId/manifests',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const developerId = req.user!.developerId!;
    const { page = 1, limit = 20, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify project belongs to developer
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        developerId,
      },
      select: {
        id: true,
        name: true,
        description: true,
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
        project,
      },
    });
  })
);

/**
 * @swagger
 * /api/developer/manifests/{id}:
 *   get:
 *     summary: Get manifest details (JWT authenticated)
 *     tags: [Developer Manifests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manifest retrieved successfully
 */
router.get(
  '/manifests/:id',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.user!.developerId!;

    // Get manifest and verify ownership through project
    const manifest = await prisma.manifest.findFirst({
      where: {
        id,
        projectId: {
          in: await prisma.project
            .findMany({
              where: { developerId },
              select: { id: true },
            })
            .then((projects) => projects.map((p) => p.id)),
        },
      },
    });

    if (!manifest) {
      throw ApiError.notFound('Manifest not found');
    }

    // Generate download URL if manifest has S3 data
    let downloadUrl;
    if (manifest.s3Key) {
      try {
        downloadUrl = await s3Service.generateDownloadUrl(manifest.s3Key, 3600); // 1 hour expiry
      } catch (error) {
        apiLogger.warn('Failed to generate download URL for manifest', {
          manifestId: id,
          s3Key: manifest.s3Key,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...manifest,
        downloadUrl,
      },
    });
  })
);

/**
 * @swagger
 * /api/developer/category-permissions:
 *   get:
 *     summary: Get developer's category permissions
 *     tags: [Developer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Developer category permissions retrieved successfully
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
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           categoryId:
 *                             type: string
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               isPremium:
 *                                 type: boolean
 *                               price:
 *                                 type: number
 *                           isPaid:
 *                             type: boolean
 *                           paidAmount:
 *                             type: number
 *                             nullable: true
 *                           grantedAt:
 *                             type: string
 *                             format: date-time
 *                           expiredAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
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
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/developer/my/projects/{id}:
 *   get:
 *     summary: Get single project by ID (JWT authenticated)
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
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
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE, ARCHIVED]
 *                     developerId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Project doesn't belong to developer
 */
router.get(
  '/my/projects/:id',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.user!.developerId!;

    logger.info('🔍 Developer fetching single project', {
      developerId,
      projectId: id,
      userRole: req.user!.role,
    });

    // Find project that belongs to the developer
    const project = await prisma.project.findFirst({
      where: {
        id,
        developerId, // Ensure project belongs to the authenticated developer
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        developerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    apiLogger.info('Single project retrieved by developer', {
      projectId: project.id,
      developerId,
      projectName: project.name,
    });

    res.json({
      success: true,
      data: project,
    });
  })
);

/**
 * @swagger
 * /api/developer/my/projects/{id}:
 *   put:
 *     summary: Update project by ID (JWT authenticated)
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Project doesn't belong to developer
 */
router.put(
  '/my/projects/:id',
  validateDeveloperJWT,
  validationErrorHandler(schemas.projectUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const developerId = req.user!.developerId!;

    logger.info('📝 Developer updating project', {
      developerId,
      projectId: id,
      userRole: req.user!.role,
    });

    // Verify project belongs to developer first
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        developerId,
      },
    });

    if (!existingProject) {
      throw ApiError.notFound('Project not found');
    }

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        developerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    apiLogger.info('Project updated by developer', {
      projectId: project.id,
      developerId,
      projectName: project.name,
    });

    res.json({
      success: true,
      data: project,
    });
  })
);

/**
 * @swagger
 * /api/developer/my/projects/{id}:
 *   delete:
 *     summary: Delete project by ID (JWT authenticated)
 *     tags: [Developer Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Project doesn't belong to developer
 */
router.delete(
  '/my/projects/:id',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.user!.developerId!;

    logger.info('🗑️ Developer deleting project', {
      developerId,
      projectId: id,
      userRole: req.user!.role,
    });

    // Verify project belongs to developer first
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        developerId,
      },
    });

    if (!existingProject) {
      throw ApiError.notFound('Project not found');
    }

    // Delete project (this will cascade delete related manifests and API keys)
    await prisma.project.delete({
      where: { id },
    });

    apiLogger.info('Project deleted by developer', {
      projectId: id,
      developerId,
      projectName: existingProject.name,
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  })
);

/**
 * @swagger
 * /api/developer/api-keys/{id}:
 *   delete:
 *     summary: Revoke/Delete API key
 *     tags: [Developer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: API key ID to revoke
 *     responses:
 *       200:
 *         description: API key revoked successfully
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
 *                   example: "API key revoked successfully"
 *       404:
 *         description: API key not found or does not belong to developer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route DELETE /api/developer/api-keys/:id
 * @desc Revoke/Delete API key
 * @access Private (Developer with JWT)
 */
router.delete(
  '/api-keys/:id',
  validateDeveloperJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.user!.developerId!;
    const { id: apiKeyId } = req.params;

    // Verify that the API key belongs to the developer
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        project: {
          developerId,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!apiKey) {
      throw ApiError.notFound('API key not found or does not belong to developer');
    }

    // Update API key status to REVOKED instead of deleting (for audit trail)
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        status: 'REVOKED',
        updatedAt: new Date(),
      },
    });

    apiLogger.info('API key revoked', {
      apiKeyId,
      developerId,
      projectId: apiKey.projectId,
      apiKeyName: apiKey.name,
    });

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  })
);

/**
 * @swagger
 * /api/developer/test-delete/{id}:
 *   delete:
 *     summary: Test DELETE endpoint without auth (temporary debug)
 *     tags: [Developer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test endpoint working
 */
router.delete(
  '/test-delete/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    res.json({
      success: true,
      message: `DELETE endpoint working. Received ID: ${id}`,
      timestamp: new Date().toISOString(),
    });
  })
);

// ========== RESOURCE MANAGEMENT ENDPOINTS ==========

/**
 * @swagger
 * /api/developer/resources:
 *   get:
 *     summary: Get accessible resources for developer
 *     tags: [Developer Resources]
 *     security:
 *       - apiKey: []
 *     parameters:
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
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags to filter by
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for resource name or keywords
 *     responses:
 *       200:
 *         description: List of accessible resources
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
 *                         $ref: '#/components/schemas/ResourceWithPermissions'
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
 *       403:
 *         description: Forbidden - Insufficient permissions
 * @route GET /api/developer/resources
 * @desc Get accessible resources for developer based on permissions
 * @access Private (Developer with API key)
 */
router.get(
  '/resources',
  validateApiKey,
  requireScope(['resource:read', 'read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.apiKey!.developerId;

    const {
      page = 1,
      limit = 20,
      categoryId,
      tags,
      search,
      fileType,
      uniquePath,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    // Cast query params to correct types
    const parsedTags = tags
      ? (([] as string[]).concat(tags as any).filter((t) => typeof t === 'string') as string[])
      : undefined;

    // Sử dụng utility function mới với resource-based permissions
    const result = await getAccessibleResources(developerId, {
      categoryId: categoryId as string | undefined,
      search: search as string | undefined,
      fileType: fileType as string | undefined,
      uniquePath: uniquePath as string | undefined,
      tags: parsedTags,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    apiLogger.info('Developer retrieved accessible resources', {
      developerId,
      page: Number(page),
      limit: Number(limit),
      total: result.pagination.total,
      categoryId: categoryId || null,
      search: search || null,
      system: 'resource-based-permissions',
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/developer/resources/{id}:
 *   get:
 *     summary: Get specific resource details
 *     tags: [Developer Resources]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                   $ref: '#/components/schemas/ResourceWithPermissions'
 *       403:
 *         description: Forbidden - No access to this resource
 *       404:
 *         description: Resource not found
 * @route GET /api/developer/resources/:id
 * @desc Get specific resource details with access check
 * @access Private (Developer with API key)
 */
router.get(
  '/resources/:id',
  validateApiKey,
  requireScope(['resource:read', 'read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { resourceId } = req.params;
    const developerId = req.apiKey!.developerId;

    // Sử dụng utility function mới với resource-based permissions
    const accessCheck = await checkResourceAccess(developerId, resourceId as string);

    if (!accessCheck.hasAccess) {
      throw ApiError.forbidden('Access denied to this resource');
    }

    const resource = await prisma.item.findUnique({
      where: {
        resourceId: resourceId as string,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        description: true,
        fileType: true,
        fileSize: true,
        isPremium: true,
        price: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
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

    // Track resource access
    await prisma.resourceUsage
      .create({
        data: {
          resourceId: resourceId as string,
          apiKeyId: req.apiKey!.id,
          action: 'view',
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip || null,
        },
      })
      .catch((error) => {
        // Log error but don't fail the request
        apiLogger.error('Failed to track resource usage', { error: error.message });
      });

    apiLogger.info('Developer accessed resource', {
      resourceId: resourceId,
      resourceName: resource.name,
      developerId,
      hasAccess: true,
      reason: accessCheck.reason,
      system: 'resource-based-permissions',
    });

    res.json({
      success: true,
      data: {
        ...resource,
        accessInfo: {
          hasAccess: true,
          reason: accessCheck.reason,
          isFree: !resource.isPremium,
          isPremium: resource.isPremium,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/developer/items/{id}/download:
 *   get:
 *     summary: Get download URL for an item
 *     tags: [Developer Resources]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item Resource ID
 *     responses:
 *       200:
 *         description: Download URL provided
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
 *                       description: Presigned S3 URL for downloading
 *                     expiresIn:
 *                       type: integer
 *                       description: URL expiration time in seconds
 *       403:
 *         description: Forbidden - No access to this resource
 *       404:
 *         description: Item not found
 * @route GET /api/developer/items/:resourceId/download
 * @desc Get download URL for an item
 * @access Private (Developer with API key)
 */
router.get(
  '/items/:resourceId/download',
  validateApiKey,
  requireScope(['resource:read', 'read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const developerId = req.apiKey!.developerId;

    // Sử dụng utility function mới với resource-based permissions
    const accessCheck = await checkResourceAccess(developerId, id as string);

    if (!accessCheck.hasAccess) {
      throw ApiError.forbidden('Access denied to this item');
    }

    // Find resource in items table
    const resource = await prisma.item.findUnique({
      where: {
        resourceId: id as string,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        s3Key: true,
        fileType: true,
        fileSize: true,
        resourceId: true,
      },
    });

    if (!resource) {
      throw ApiError.notFound('Item not found');
    }

    // Generate presigned download URL with fallback
    const downloadResult = await s3Service.generateDownloadUrlWithFallback(resource.s3Key, 3600); // 1 hour
    const downloadUrl = downloadResult.url;

    // Track resource download
    await prisma.resourceUsage
      .create({
        data: {
          resourceId: id as string,
          apiKeyId: req.apiKey!.id,
          action: 'download',
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip || null,
        },
      })
      .catch((error) => {
        apiLogger.error('Failed to track item download', { error: error.message });
      });

    apiLogger.info('Developer requested item download', {
      resourceId: id,
      resourceName: resource.name,
      developerId,
      hasAccess: true,
      reason: accessCheck.reason,
      system: 'resource-based-permissions',
    });

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: 3600,
        isPresigned: downloadResult.isPresigned,
        resource: {
          id: resource.id,
          name: resource.name,
          fileType: resource.fileType,
          fileSize: resource.fileSize,
          resourceId: resource.resourceId,
          type: 'item',
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/developer/avatars/{id}/download:
 *   get:
 *     summary: Get download URL for an avatar
 *     tags: [Developer Resources]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Avatar Resource ID
 *     responses:
 *       200:
 *         description: Download URL generated successfully
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
 *                       description: Presigned S3 URL for downloading
 *                     expiresIn:
 *                       type: integer
 *                       description: URL expiration time in seconds
 *       403:
 *         description: Forbidden - No access to this resource
 *       404:
 *         description: Avatar not found
 * @route GET /api/developer/avatars/:resourceId/download
 * @desc Get download URL for an avatar
 * @access Private (Developer with API key)
 */
router.get(
  '/avatars/:resourceId/download',
  validateApiKey,
  requireScope(['resource:read', 'read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { resourceId } = req.params;
    const developerId = req.apiKey!.developerId;

    // Find avatar resource
    const avatarResource = await prisma.avatar.findUnique({
      where: {
        resourceId: resourceId as string,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        s3Key: true,
        resourceId: true,
        isPremium: true,
      },
    });

    if (!avatarResource) {
      throw ApiError.notFound('Avatar not found');
    }

    // Check permission for premium avatars
    if (avatarResource.isPremium) {
      const permission = await prisma.developerAvatarPermission.findUnique({
        where: {
          developerId_avatarResourceId: {
            developerId,
            avatarResourceId: avatarResource.id,
          },
        },
      });
      if (!permission || (permission.expiresAt && permission.expiresAt < new Date())) {
        throw ApiError.forbidden('No access to this premium avatar');
      }
    }

    // Generate presigned download URL
    const downloadResult = await s3Service.generateDownloadUrlWithFallback(avatarResource.s3Key, 3600); // 1 hour
    const downloadUrl = downloadResult.url;

    // Note: Avatar downloads are not tracked in ResourceUsage table
    // as it's designed for Item resources, not Avatar resources
    // TODO: Implement separate AvatarUsage tracking if needed
    
    apiLogger.info('Avatar download tracked', {
      avatarId: avatarResource.id,
      resourceId: resourceId,
      developerId,
      action: 'download',
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
    });

    apiLogger.info('Developer requested avatar download', {
      resourceId: resourceId,
      resourceName: avatarResource.name,
      developerId,
      hasAccess: true,
      system: 'avatar-permissions',
    });

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: 3600,
        isPresigned: downloadResult.isPresigned,
        resource: {
          id: avatarResource.id,
          name: avatarResource.name,
          fileType: 'model/gltf-binary',
          fileSize: null,
          resourceId: avatarResource.resourceId,
          type: 'avatar',
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/developer/categories:
 *   get:
 *     summary: Get accessible resource categories
 *     tags: [Developer Resources]
 *     security:
 *       - apiKey: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: List of accessible categories
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
 *                         $ref: '#/components/schemas/ResourceCategory'
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
 * @route GET /api/developer/categories
 * @desc Get accessible resource categories for developer
 * @access Private (Developer with API key)
 */
router.get(
  '/categories',
  validateApiKey,
  requireScope(['resource:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.apiKey!.developerId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get all categories since category permissions were removed
    const [categories, total] = await Promise.all([
      prisma.itemCategory.findMany({
        where: {
          isActive: true,
        },
        include: {
          _count: {
            select: {
              items: {
                where: {
                  status: 'ACTIVE',
                  deletedAt: null,
                },
              },
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.itemCategory.count({
        where: {
          isActive: true,
        },
      }),
    ]);

    // Transform categories to include access info
    const transformedCategories = categories.map((category) => ({
      ...category,
      hasAccess: true, // All developers have access to all categories
      isPaid: false,
      accessGrantedAt: new Date(),
      accessExpiresAt: null,
      resourceCount: category._count.items,
    }));

    apiLogger.info('Developer retrieved accessible categories', {
      developerId,
      page: Number(page),
      limit: Number(limit),
      total,
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
 * /api/developer/categories/{id}/resources:
 *   get:
 *     summary: Get resources in a specific category
 *     tags: [Developer Resources]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
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
 *     responses:
 *       200:
 *         description: List of resources in category
 *       403:
 *         description: Forbidden - No access to this category
 *       404:
 *         description: Category not found
 * @route GET /api/developer/categories/:id/resources
 * @desc Get resources in a specific category that developer has access to
 * @access Private (Developer with API key)
 */
router.get(
  '/categories/:id/resources',
  validateApiKey,
  requireScope(['resource:read', 'read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id: categoryId } = req.params;
    const developerId = req.apiKey!.developerId;
    const {
      page = 1,
      limit = 20,
      search,
      fileType,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    // Kiểm tra category có tồn tại không
    const category = await prisma.itemCategory.findUnique({
      where: { id: categoryId as string },
      select: { id: true, name: true, description: true },
    });

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    // Sử dụng utility function mới với resource-based permissions
    const result = await getAccessibleResources(developerId, {
      categoryId: categoryId as string,
      search: search as string,
      fileType: fileType as string,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    apiLogger.info('Developer retrieved category resources', {
      developerId,
      categoryId,
      categoryName: category.name,
      page: Number(page),
      limit: Number(limit),
      total: result.pagination.total,
      system: 'resource-based-permissions',
    });

    res.json({
      success: true,
      data: {
        category,
        ...result,
      },
    });
  })
);

/**
 * @swagger
 * /api/developer/permissions/summary:
 *   get:
 *     summary: Get developer's resource permissions summary
 *     tags: [Developer Resources]
 *     security:
 *       - apiKey: [resource:read]
 * @route GET /api/developer/permissions/summary
 * @desc Get summary of developer's resource permissions
 * @access Private (Developer with API key)
 */
router.get(
  '/permissions/summary',
  validateApiKey,
  requireScope(['resource:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.apiKey!.developerId;

    const summary = await getDeveloperPermissionsSummary(developerId);

    apiLogger.info('Developer retrieved permissions summary', {
      developerId,
      summary,
    });

    res.json({
      success: true,
      data: summary,
    });
  })
);

/**
 * @swagger
 * /api/developer/permissions:
 *   get:
 *     summary: Get developer's resource permissions details
 *     tags: [Developer Resources]
 *     security:
 *       - apiKey: [resource:read]
 * @route GET /api/developer/permissions
 * @desc Get detailed list of developer's resource permissions
 * @access Private (Developer with API key)
 */
router.get(
  '/permissions',
  validateApiKey,
  requireScope(['resource:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.apiKey!.developerId;
    const { page = 1, limit = 20, activeOnly = true } = req.query;

    const result = await getDeveloperPermissions(developerId, {
      activeOnly: activeOnly === 'true',
      page: Number(page),
      limit: Number(limit),
    });

    apiLogger.info('Developer retrieved permissions details', {
      developerId,
      page: Number(page),
      limit: Number(limit),
      total: result.pagination.total,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/developer/resources/free:
 *   get:
 *     summary: Get free resources accessible to developer
 *     tags: [Developer Resources]
 *     security:
 *       - apiKey: [resource:read]
 * @route GET /api/developer/resources/free
 * @desc Get all free resources that developer can access
 * @access Private (Developer with API key)
 */
router.get(
  '/resources/free',
  validateApiKey,
  requireScope(['resource:read', 'read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.apiKey!.developerId;

    const {
      page = 1,
      limit = 20,
      categoryId,
      search,
      fileType,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    // Sử dụng utility function với filter chỉ lấy free resources
    const result = await getAccessibleResources(developerId, {
      categoryId: categoryId as string,
      search: search as string,
      fileType: fileType as string,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    // Filter chỉ lấy free resources (non-premium)
    const freeResources = result.resources.filter((resource) => !resource.isPremium);

    apiLogger.info('Developer retrieved free resources', {
      developerId,
      page: Number(page),
      limit: Number(limit),
      total: freeResources.length,
      categoryId: categoryId || null,
      search: search || null,
    });

    res.json({
      success: true,
      data: {
        resources: freeResources,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: freeResources.length,
          pages: Math.ceil(freeResources.length / Number(limit)),
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/developer/resources/paid:
 *   get:
 *     summary: Get paid resources accessible to developer
 *     tags: [Developer Resources]
 *     security:
 *       - apiKey: [resource:read]
 * @route GET /api/developer/resources/paid
 * @desc Get all paid resources that developer has permission to access
 * @access Private (Developer with API key)
 */
router.get(
  '/resources/paid',
  validateApiKey,
  requireScope(['resource:read', 'read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const developerId = req.apiKey!.developerId;

    const {
      page = 1,
      limit = 20,
      categoryId,
      search,
      fileType,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    // Sử dụng utility function với filter chỉ lấy paid resources
    const result = await getAccessibleResources(developerId, {
      categoryId: categoryId as string,
      search: search as string,
      fileType: fileType as string,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    // Filter chỉ lấy paid resources (premium)
    const paidResources = result.resources.filter((resource) => resource.isPremium);

    apiLogger.info('Developer retrieved paid resources', {
      developerId,
      page: Number(page),
      limit: Number(limit),
      total: paidResources.length,
      categoryId: categoryId || null,
      search: search || null,
    });

    res.json({
      success: true,
      data: {
        resources: paidResources,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: paidResources.length,
          pages: Math.ceil(paidResources.length / Number(limit)),
        },
      },
    });
  })
);

export default router;
