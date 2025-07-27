import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { config } from '@/config/config';
import { validateJWT, requireRole, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { authLogger, apiLogger, s3Logger } from '@/utils/logger';
import { redisService } from '@/services/RedisService';
import { s3Service } from '@/services/S3Service';
import ItemManagementService from '@/services/ItemManagementService';
import { AvatarManagementService } from '@/services/AvatarManagementService';
import { schemas } from '@/schemas/validation';
import type { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import {
  AvatarGender,
  AvatarPartType,
  AvatarStatus,
  CreateAvatarRequest,
  UpdateAvatarRequest,
  AvatarQuery as AvatarQuery,
  AvatarValidationError,
  AvatarNotFoundError,
  AvatarPermissionError,
} from '@/types/avatar';

const router = Router();
const prisma = new PrismaClient();

// Initialize Resource Management Service
const resourceManagementService = new ItemManagementService(prisma);

// Initialize Avatar Management Service
const avatarLogger = apiLogger.child({ module: 'AvatarAdmin' });
const avatarService = new AvatarManagementService(prisma, s3Service, avatarLogger);

// Helper function to check for circular reference
async function checkCircularReference(parentId: string, categoryId: string): Promise<boolean> {
  let currentParentId: string | null = parentId;

  while (currentParentId) {
    if (currentParentId === categoryId) {
      return true; // Circular reference found
    }

    const parent: { parentId: string | null } | null = await prisma.itemCategory.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    });

    if (!parent) {
      break; // Parent not found, end the chain
    }

    currentParentId = parent.parentId;
  }

  return false; // No circular reference
}

// Helper function to update descendant paths when a category name changes
async function updateDescendantPaths(categoryId: string, newPath: string, newLevel?: number) {
  const descendants = await prisma.itemCategory.findMany({
    where: {
      parentId: categoryId,
    },
  });

  for (const descendant of descendants) {
    // Process name for path: convert to lowercase and replace spaces with underscores
    const processedName = descendant.name.toLowerCase().replace(/\s+/g, '_');
    const updatedPath = `${newPath}/${processedName}`;
    const updateData: any = {
      path: updatedPath,
      updatedAt: new Date(),
    };

    // Update level if provided
    if (newLevel !== undefined) {
      updateData.level = newLevel + 1;
    }

    await prisma.itemCategory.update({
      where: { id: descendant.id },
      data: updateData,
    });

    // Recursively update descendants
    await updateDescendantPaths(descendant.id, updatedPath, updateData.level);
  }
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  },
});

/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
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
 *                     token:
 *                       type: string
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Account is not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route POST /api/admin/auth/login
 * @desc Admin login
 * @access Public - This endpoint is already public (no authentication required)
 */
router.post(
  '/auth/login',
  validationErrorHandler(schemas.adminLogin),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        status: true,
        lastLoginAt: true,
      },
    });

    if (!admin) {
      authLogger.warn('Admin login attempt with invalid email', {
        email,
        ip: req.ip,
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Check admin status
    if (admin.status !== 'ACTIVE') {
      authLogger.warn('Inactive admin login attempt', {
        adminId: admin.id,
        status: admin.status,
        ip: req.ip,
      });
      throw ApiError.forbidden('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      authLogger.warn('Admin login attempt with invalid password', {
        adminId: admin.id,
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
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      config.JWT_SECRET as string,
      jwtOptions
    );

    // Update last login timestamp
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Cache admin data
    const adminData = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status,
    };
    await redisService.setex(`admin:${admin.id}`, config.CACHE_TTL_DEVELOPER, adminData);

    authLogger.info('Admin logged in successfully', {
      adminId: admin.id,
      role: admin.role,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          lastLoginAt: admin.lastLoginAt,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/auth/logout:
 *   post:
 *     summary: Admin logout
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route POST /api/admin/auth/logout
 * @desc Admin logout
 * @access Private (Admin)
 */
router.post(
  '/auth/logout',
  validateJWT,
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

    // Remove admin from cache
    await redisService.del(`admin:${req.user!.id}`);

    authLogger.info('Admin logged out successfully', {
      adminId: req.user!.id,
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
 * /api/admin/auth/me:
 *   get:
 *     summary: Get current admin profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route GET /api/admin/auth/me
 * @desc Get current admin profile
 * @access Private (Admin)
 */
router.get(
  '/auth/me',
  validateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    res.json({
      success: true,
      data: admin,
    });
  })
);

/**
 * @swagger
 * /api/admin/auth/change-password:
 *   put:
 *     summary: Change admin password
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized or invalid current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route PUT /api/admin/auth/change-password
 * @desc Change admin password
 * @access Private (Admin)
 */
router.put(
  '/auth/change-password',
  validateJWT,
  validationErrorHandler(schemas.adminChangePassword),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user!.id;

    // Get current admin with password
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, passwordHash: true },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isCurrentPasswordValid) {
      authLogger.warn('Admin password change attempt with invalid current password', {
        adminId,
        ip: req.ip,
      });
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash: hashedNewPassword },
    });

    authLogger.info('Admin password changed successfully', {
      adminId,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

/**
 * @route GET /api/admin/admins
 * @desc Get all admins
 * @access Private (Super Admin)
 * @swagger
 * /api/admin/admins:
 *   get:
 *     summary: Get all admins
 *     tags: [Admin]
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
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of admins retrieved successfully
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
 *                     admins:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Admin'
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
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/admins',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page, limit, sortBy = 'createdAt', sortOrder } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.admin.count(),
    ]);

    res.json({
      success: true,
      data: {
        admins,
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
 * @route POST /api/admin/admins
 * @desc Create new admin
 * @access Private (Super Admin)
 * @swagger
 * /api/admin/admins:
 *   post:
 *     summary: Create new admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: StrongP@ssw0rd
 *               role:
 *                 type: string
 *                 enum: [ADMIN, SUPER_ADMIN]
 *                 example: ADMIN
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Admin with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/admins',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  validationErrorHandler(schemas.adminCreate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, email, password, role } = req.body;

    // Check if admin with email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw ApiError.conflict('Admin with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    apiLogger.info('New admin created', {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: admin,
    });
  })
);

/**
 * @route GET /api/admin/admins/:id
 * @desc Get admin by ID
 * @access Private (Super Admin)
 * @swagger
 * /api/admin/admins/{id}:
 *   get:
 *     summary: Get admin by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/admins/:id',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };

    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    res.json({
      success: true,
      data: admin,
    });
  })
);

/**
 * @route PUT /api/admin/admins/:id
 * @desc Update admin
 * @access Private (Super Admin)
 * @swagger
 * /api/admin/admins/{id}:
 *   put:
 *     summary: Update admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Admin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.updated@example.com
 *               role:
 *                 type: string
 *                 enum: [ADMIN, SUPER_ADMIN]
 *                 example: ADMIN
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Admin with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/admins/:id',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  validationErrorHandler(schemas.adminUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };
    const updateData = req.body;

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      throw ApiError.notFound('Admin not found');
    }

    // If email is being updated, check for conflicts
    if (updateData.email && updateData.email !== existingAdmin.email) {
      const emailConflict = await prisma.admin.findUnique({
        where: { email: updateData.email },
      });

      if (emailConflict) {
        throw ApiError.conflict('Admin with this email already exists');
      }
    }

    // Update admin
    const admin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    // Remove from cache to force refresh
    await redisService.del(`admin:${id}`);

    apiLogger.info('Admin updated', {
      adminId: id,
      updatedFields: Object.keys(updateData),
      updatedBy: req.user!.id,
    });

    res.json({
      success: true,
      data: admin,
    });
  })
);

/**
 * @route DELETE /api/admin/admins/:id
 * @desc Delete admin
 * @access Private (Super Admin)
 * @swagger
 * /api/admin/admins/{id}:
 *   delete:
 *     summary: Delete admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin deleted successfully
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
 *                   example: Admin deleted successfully
 *       400:
 *         description: Bad request - Cannot delete your own account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/admins/:id',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };
    const currentAdminId = req.user!.id;

    // Prevent self-deletion
    if (id === currentAdminId) {
      throw ApiError.badRequest('Cannot delete your own account');
    }

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    // Delete admin
    await prisma.admin.delete({
      where: { id },
    });

    // Remove from cache
    await redisService.del(`admin:${id}`);

    apiLogger.info('Admin deleted', {
      adminId: id,
      deletedBy: currentAdminId,
    });

    res.json({
      success: true,
      message: 'Admin deleted successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/admins/{id}/activate:
 *   post:
 *     summary: Activate an admin user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin activated successfully
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
 *                   example: Admin activated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 * @route POST /api/admin/admins/:id/activate
 * @desc Activate an admin user
 * @access Private (Super Admin)
 */
router.post(
  '/admins/:id/activate',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };
    const currentAdminId = req.user!.id;

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    // Update admin status
    await prisma.admin.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    // Remove from cache to force refresh
    await redisService.del(`admin:${id}`);

    apiLogger.info('Admin activated', {
      adminId: id,
      activatedBy: currentAdminId,
    });

    res.json({
      success: true,
      message: 'Admin activated successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/admins/{id}/deactivate:
 *   post:
 *     summary: Deactivate an admin user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin deactivated successfully
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
 *                   example: Admin deactivated successfully
 *       400:
 *         description: Cannot deactivate yourself
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 * @route POST /api/admin/admins/:id/deactivate
 * @desc Deactivate an admin user
 * @access Private (Super Admin)
 */
router.post(
  '/admins/:id/deactivate',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };
    const currentAdminId = req.user!.id;

    // Prevent self-deactivation
    if (id === currentAdminId) {
      throw ApiError.badRequest('Cannot deactivate your own account');
    }

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    // Update admin status
    await prisma.admin.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    // Remove from cache
    await redisService.del(`admin:${id}`);

    apiLogger.info('Admin deactivated', {
      adminId: id,
      deactivatedBy: currentAdminId,
    });

    res.json({
      success: true,
      message: 'Admin deactivated successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/admins/{id}/reset-password:
 *   post:
 *     summary: Reset admin user password
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                     temporaryPassword:
 *                       type: string
 *                       example: temp_pass_123456
 *                 message:
 *                   type: string
 *                   example: Password reset successfully. Admin must change password on next login.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 * @route POST /api/admin/admins/:id/reset-password
 * @desc Reset admin user password
 * @access Private (Super Admin)
 */
router.post(
  '/admins/:id/reset-password',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };
    const currentAdminId = req.user!.id;

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    // Generate temporary password
    const temporaryPassword = `temp_${crypto.randomBytes(8).toString('hex')}`;
    const hashedPassword = await bcrypt.hash(temporaryPassword, config.BCRYPT_ROUNDS);

    // Update admin password
    await prisma.admin.update({
      where: { id },
      data: {
        passwordHash: hashedPassword,
        // In a real implementation, you might want to add a flag to force password change
      },
    });

    // Remove from cache to force refresh
    await redisService.del(`admin:${id}`);

    authLogger.info('Admin password reset', {
      adminId: id,
      resetBy: currentAdminId,
    });

    res.json({
      success: true,
      data: {
        temporaryPassword,
      },
      message: 'Password reset successfully. Admin must change password on next login.',
    });
  })
);

/**
 * @route GET /api/admin/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (Admin)
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves statistics about developers, projects, resources, and API keys for the admin dashboard
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                     developers:
                       type: object
                       properties:
                         active:
                           type: integer
                           example: 120
                         inactive:
                           type: integer
                           example: 15
                         suspended:
                           type: integer
                           example: 5
                         total:
                           type: integer
                           example: 140
 *                     projects:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: integer
 *                           example: 350
 *                         archived:
 *                           type: integer
 *                           example: 75
 *                         total:
 *                           type: integer
 *                           example: 425
 *                     resources:
 *                       type: object
 *                       properties:
 *                         public:
 *                           type: integer
 *                           example: 250
 *                         private:
 *                           type: integer
 *                           example: 750
 *                         total:
 *                           type: integer
 *                           example: 1000
 *                     apiKeys:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: integer
 *                           example: 180
 *                         revoked:
 *                           type: integer
 *                           example: 45
 *                         total:
 *                           type: integer
 *                           example: 225
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/dashboard/stats',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const [
      totalDevelopers,
      activeDevelopers,
      totalProjects,
      activeProjects,
      totalResources,
      totalCategories,
      totalApiKeys,
      apiCallsToday,
    ] = await Promise.all([
      prisma.developer.count(),
      prisma.developer.count({ where: { status: 'ACTIVE' } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.item.count(),
      prisma.itemCategory.count(),
      prisma.apiKey.count({ where: { status: 'ACTIVE' } }),
      prisma.apiKeyUsage.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        developers: {
          total: totalDevelopers,
          active: activeDevelopers,
          suspended: totalDevelopers - activeDevelopers,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
        },
        resources: {
          total: totalResources,
        },
        categories: {
          total: totalCategories,
        },
        apiKeys: {
          total: totalApiKeys,
        },
        apiCalls: {
          today: apiCallsToday,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/resource/upload:
 *   post:
 *     summary: Upload new resource (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - categoryId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               fileType:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Resource uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/resource/upload',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  upload.single('file'),
  validationErrorHandler(
    schemas.uploadResource.extend({ fileType: z.string().min(1, 'File type is required') })
  ), // Add fileType validation
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, description, categoryId, fileType, tags, metadata } = req.body;
    const file = req.file;
    const adminId = req.user!.id;

    if (!file) {
      throw ApiError.badRequest('No file provided');
    }

    console.log('🔍 File upload debug:', {
      fileName: file.originalname,
      fileSize: typeof file.size,
      fileSizeValue: file.size,
      isBigInt: typeof file.size === 'bigint',
    });

    const startTime = Date.now();

    try {
      // Upload to S3
      // uniquePath removed as it's no longer in schema
      // get category by categoryId
      // 'path' is a text field from the resource_categories table used to construct the resource URL.
      const cate = await prisma.itemCategory.findUnique({
        where: { id: categoryId },
        select: { path: true },
      });
      if (!cate) {
        throw ApiError.notFound('Resource category not found');
      }
      const specificS3Url = `models/items/${cate.path.replace(/-/g, '/')}/${file.originalname}`;
      s3Logger.info('S3URL ', specificS3Url);
      const uploadResult = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        `${adminId}`,
        {
          contentType: file.mimetype,
          metadata: {
            category: categoryId,
            uploadedBy: 'admin',
            adminId,
          },
          specificS3Url: specificS3Url,
        }
      );

      const s3Key = uploadResult.key;

      // Create resource record - ensure fileSize is a number
      const resource = await prisma.item.create({
        data: {
          name: name || file.originalname,
          description,
          fileType: 'model/gltf-binary',
          s3Url: s3Key,
          s3Key: s3Key,
          fileSize: Number(file.size), // Convert BigInt to number
          categoryId,
        },
        select: {
          id: true,
          name: true,
          description: true,
          fileType: true,
          fileSize: true,
          createdAt: true,
        },
      });

      const duration = Date.now() - startTime;
      s3Logger.info('Resource uploaded successfully by admin', {
        resourceId: resource.id,
        adminId,
        fileSize: Number(file.size), // Convert BigInt to number for logging
        duration,
      });

      apiLogger.info('New resource uploaded by admin', {
        resourceId: resource.id,
        resourceName: resource.name,
        categoryId,
        adminId,
        fileSize: Number(file.size), // Convert BigInt to number for logging
      });

      // Ensure response data doesn't have BigInt values
      const responseData = {
        ...resource,
        fileSize: Number(resource.fileSize),
      };

      res.status(201).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      s3Logger.error('Resource upload failed', {
        adminId,
        categoryId,
        fileSize: Number(file.size), // Convert BigInt to number for logging
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      throw error;
    }
  })
);

/**
 * @swagger
 * /api/admin/resource/{id}:
 *   put:
 *     summary: Update resource metadata (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resource ID
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
 *               fileType:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Resource not found
 */
router.put(
  '/resource/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validationErrorHandler(schemas.resourceUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };
    const updateData = req.body;
    const adminId = req.user!.id;

    // Check if resource exists
    const resource = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        categoryId: true,
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    const updatedResource = await prisma.item.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        fileType: true,
        updatedAt: true,
      },
    });

    apiLogger.info('Resource updated by admin', {
      resourceId: id,
      adminId,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: updatedResource,
    });
  })
);

/**
 * @swagger
 * /api/admin/resource/{id}:
 *   delete:
 *     summary: Delete resource (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Resource not found
 */
router.delete(
  '/resource/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };
    const adminId = req.user!.id;

    // Check if resource exists
    const resource = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        s3Url: true,
        categoryId: true,
      },
    });

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    try {
      // Delete from S3
      await s3Service.deleteFile(resource.s3Url);

      // Delete from database
      await prisma.item.delete({
        where: { id },
      });

      apiLogger.info('Resource deleted by admin', {
        resourceId: id,
        resourceName: resource.name,
        adminId,
      });

      res.json({
        success: true,
        message: 'Resource deleted successfully',
      });
    } catch (error) {
      apiLogger.error('Resource deletion failed', {
        resourceId: id,
        adminId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  })
);

// Admin Developer Management APIs
/**
 * @swagger
 * /api/admin/developers:
 *   get:
 *     summary: Get developers list with pagination and search
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for email or name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, INACTIVE]
 *         description: Filter by developer status
 *     responses:
 *       200:
 *         description: Developers retrieved successfully
 */
router.get(
  '/developers',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validationErrorHandler(schemas.developerQuery),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [developers, total] = await Promise.all([
      prisma.developer.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          suspendedAt: true,
          suspendedReason: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.developer.count({ where }),
    ]);

    res.json({
      success: true,
      data: developers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/developers:
 *   post:
 *     summary: Create new developer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/developers',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validationErrorHandler(schemas.developerCreate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, email, phone, company, website, plan = 'FREE' } = req.body;
    const adminId = req.user!.id;

    // Check if developer already exists
    const existingDeveloper = await prisma.developer.findUnique({
      where: { email },
    });

    if (existingDeveloper) {
      throw ApiError.conflict('Developer with this email already exists');
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).substring(2, 15);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const developer = await prisma.developer.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    // Log the action
    await prisma.developerAction.create({
      data: {
        developerId: developer.id,
        adminId,
        action: 'created',
        details: { tempPassword },
      },
    });

    apiLogger.info('Developer created by admin', {
      developerId: developer.id,
      adminId,
      developerEmail: developer.email,
    });

    res.status(201).json({
      success: true,
      data: { ...developer, tempPassword },
    });
  })
);

/**
 * @swagger
 * /api/admin/developers/{id}:
 *   get:
 *     summary: Get developer details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/developers/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };

    const developer = await prisma.developer.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                apiKeys: true,
              },
            },
          },
        },

        actions: {
          select: {
            action: true,
            details: true,
            createdAt: true,
            admin: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
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
 * /api/admin/developers/{id}/suspend:
 *   post:
 *     summary: Suspend developer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/developers/:id/suspend',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };

    if (!id) {
      throw ApiError.badRequest('Developer ID is required');
    }

    const { reason } = req.body;
    const adminId = req.user!.id;

    const developer = await prisma.developer.findUnique({
      where: { id },
      select: { id: true, email: true, status: true },
    });

    if (!developer) {
      throw ApiError.notFound('Developer not found');
    }

    if (developer.status === 'SUSPENDED') {
      throw ApiError.badRequest('Developer is already suspended');
    }

    const updatedDeveloper = await prisma.developer.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendedReason: reason || 'No reason provided',
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        suspendedAt: true,
        suspendedReason: true,
      },
    });

    // Log the action
    await prisma.developerAction.create({
      data: {
        developerId: id as string,
        adminId: adminId,
        action: 'suspended',
        details: { reason },
      },
    });

    // Clear developer cache
    await redisService.del(`developer:${id}`);

    apiLogger.info('Developer suspended by admin', {
      developerId: id,
      adminId,
      reason,
    });

    res.json({
      success: true,
      data: updatedDeveloper,
    });
  })
);

/**
 * @swagger
 * /api/admin/developers/{id}/activate:
 *   post:
 *     summary: Activate developer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/developers/:id/activate',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };

    if (!id) {
      throw ApiError.badRequest('Developer ID is required');
    }

    const adminId = req.user!.id;

    const developer = await prisma.developer.findUnique({
      where: { id },
      select: { id: true, email: true, status: true },
    });

    if (!developer) {
      throw ApiError.notFound('Developer not found');
    }

    if (developer.status === 'ACTIVE') {
      throw ApiError.badRequest('Developer is already active');
    }

    const updatedDeveloper = await prisma.developer.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        suspendedAt: null,
        suspendedReason: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });

    // Log the action
    await prisma.developerAction.create({
      data: {
        developerId: id as string,
        adminId: adminId,
        action: 'activated',
      },
    });

    // Clear developer cache
    await redisService.del(`developer:${id}`);

    apiLogger.info('Developer activated by admin', {
      developerId: id,
      adminId,
    });

    res.json({
      success: true,
      data: updatedDeveloper,
    });
  })
);

// Admin Category Management APIs
/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: Get all resource categories
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/categories',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      page = 1,
      limit = 50,
      search,
      includeChildren = false,
      parentId,
      level,
      isActive,
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (parentId !== undefined) {
      where.parentId = parentId === 'null' || parentId === '' ? null : parentId;
    }

    if (level !== undefined) {
      where.level = Number(level);
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // If includeChildren is true, we want to build a tree structure
    const shouldIncludeChildren =
      includeChildren === 'true' || includeChildren === 'TRUE' || Boolean(includeChildren);
    if (shouldIncludeChildren) {
      // Get all categories (no pagination for tree view)
      const allCategories = await prisma.itemCategory.findMany({
        where: search ? where : { isActive: isActive !== undefined ? isActive === 'true' : true },
        include: {
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
        },
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      });

      // Build tree structure
      const categoryMap = new Map();
      const rootCategories: any[] = [];

      // First pass: create map of all categories
      allCategories.forEach((cat) => {
        categoryMap.set(cat.id, {
          ...cat,
          children: [],
        });
      });

      // Second pass: build tree structure
      allCategories.forEach((cat) => {
        const categoryWithChildren = categoryMap.get(cat.id);
        if (cat.parentId) {
          const parent = categoryMap.get(cat.parentId);
          if (parent) {
            parent.children.push(categoryWithChildren);
          }
        } else {
          rootCategories.push(categoryWithChildren);
        }
      });

      res.json({
        success: true,
        data: rootCategories,
        pagination: {
          page: 1,
          limit: allCategories.length,
          total: allCategories.length,
          pages: 1,
        },
      });
    } else {
      // Flat view with pagination
      const [categories, total] = await Promise.all([
        prisma.itemCategory.findMany({
          where,
          include: {
            _count: {
              select: {
                items: true,
                children: true,
              },
            },
            parent: {
              select: {
                id: true,
                name: true,
                path: true,
              },
            },
          },
          skip,
          take: Number(limit),
          orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        }),
        prisma.itemCategory.count({ where }),
      ]);

      res.json({
        success: true,
        data: categories,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    }
  })
);

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     summary: Create new resource category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: StrongP@ssw0rd
 *               role:
 *                 type: string
 *                 enum: [ADMIN, SUPER_ADMIN]
 *                 example: ADMIN
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Admin with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/categories',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validationErrorHandler(schemas.resourceCategoryCreate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, description, sortOrder = 0, isActive = true } = req.body;

    // Normalize parentId values like "" or "null" to actual null
    let { parentId = null } = req.body as { parentId?: string | null };
    if (parentId === '' || parentId === 'null') {
      parentId = null;
    }

    // Check if category already exists in the same parent context
    const existingCategory = await prisma.itemCategory.findFirst({
      where: {
        name,
        parentId: parentId || null,
      },
    });

    if (existingCategory) {
      throw ApiError.conflict('Category with this name already exists in this location');
    }

    // Calculate level and path based on parent
    let level = 0;
    // Process name for path: convert to lowercase and replace spaces with underscores
    let processedName = name.toLowerCase().replace(/\s+/g, '_');
    let path = processedName;
    let parent = null;

    if (parentId) {
      parent = await prisma.itemCategory.findUnique({
        where: { id: parentId },
        select: { id: true, name: true, level: true, path: true },
      });

      if (!parent) {
        throw ApiError.notFound('Parent category not found');
      }

      level = parent.level + 1;
      path = parent.path
        ? `${parent.path}/${processedName}`
        : `${parent.name.toLowerCase().replace(/\s+/g, '_')}/${processedName}`;

      // Prevent circular references (max 5 levels deep)
      if (level > 5) {
        throw ApiError.badRequest('Maximum category depth (5 levels) exceeded');
      }
    }

    const category = await prisma.itemCategory.create({
      data: {
        name,
        description,
        parentId,
        level,
        path,
        sortOrder,
        isActive,
      },
      include: {
        _count: {
          select: {
            children: true,
            items: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });

    apiLogger.info('Resource category created by admin', {
      categoryId: category.id,
      categoryName: category.name,
      parentId: parentId,
      level: level,
      adminId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: {
        ...category,
        children: [],
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   put:
 *     summary: Update resource category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Admin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.updated@example.com
 *               role:
 *                 type: string
 *                 enum: [ADMIN, SUPER_ADMIN]
 *                 example: ADMIN
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Admin with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/categories/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validationErrorHandler(schemas.resourceCategoryUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };
    const updateData = req.body;

    const category = await prisma.itemCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    // Handle parent ID changes and validation
    if (updateData.parentId !== undefined) {
      // Check for self-reference
      if (updateData.parentId === id) {
        throw ApiError.badRequest('Cannot make a category its own parent');
      }

      // Check for circular reference by walking up the parent chain
      if (updateData.parentId && typeof updateData.parentId === 'string') {
        const isCircular = await checkCircularReference(updateData.parentId as string, id);
        if (isCircular) {
          throw ApiError.badRequest(
            'Cannot create circular reference - the target parent is a descendant of this category'
          );
        }
      }
    }

    // Check if name conflicts with another category in the same parent context
    const targetParentId =
      updateData.parentId !== undefined ? updateData.parentId : category.parentId;
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await prisma.itemCategory.findFirst({
        where: {
          name: updateData.name,
          parentId: targetParentId,
          id: { not: id },
        },
      });

      if (existingCategory) {
        throw ApiError.conflict('Category with this name already exists in this location');
      }
    }

    // Calculate new level and path if parent is changing or name is changing
    let finalUpdateData = { ...updateData };

    if (updateData.parentId !== undefined || updateData.name) {
      let newLevel = 0;
      // Process name for path: convert to lowercase and replace spaces with underscores
      const processedName = (updateData.name || category.name).toLowerCase().replace(/\s+/g, '_');
      let newPath = processedName;

      const newParentId =
        updateData.parentId !== undefined ? updateData.parentId : category.parentId;

      if (newParentId) {
        const newParent = await prisma.itemCategory.findUnique({
          where: { id: newParentId },
          select: { id: true, name: true, level: true, path: true },
        });

        if (!newParent) {
          throw ApiError.notFound('Parent category not found');
        }

        newLevel = newParent.level + 1;
        newPath = newParent.path
          ? `${newParent.path}/${processedName}`
          : `${newParent.name.toLowerCase().replace(/\s+/g, '_')}/${processedName}`;

        if (newLevel > 5) {
          throw ApiError.badRequest('Maximum category depth (5 levels) exceeded');
        }
      }

      finalUpdateData.level = newLevel;
      finalUpdateData.path = newPath;
    }

    const updatedCategory = await prisma.itemCategory.update({
      where: { id },
      data: finalUpdateData,
      include: {
        _count: {
          select: {
            children: true,
            items: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });

    // If the name or path changed, update all descendants
    if (
      (updateData.name && updateData.name !== category.name) ||
      updateData.parentId !== undefined
    ) {
      if (updatedCategory.path) {
        await updateDescendantPaths(id, updatedCategory.path as string, updatedCategory.level);
      }
    }

    apiLogger.info('Resource category updated by admin', {
      categoryId: id,
      adminId: req.user!.id,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: {
        ...updatedCategory,
        children: [],
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   delete:
 *     summary: Delete resource category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Resource not found
 */
router.delete(
  '/categories/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };

    const category = await prisma.itemCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            items: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    if (category._count.items > 0) {
      throw ApiError.badRequest(
        'Cannot delete category that has resources. Move or delete resources first.'
      );
    }

    if (category._count.children > 0) {
      throw ApiError.badRequest(
        'Cannot delete category that has subcategories. Move or delete subcategories first.'
      );
    }

    await prisma.itemCategory.delete({
      where: { id },
    });

    apiLogger.info('Resource category deleted by admin', {
      categoryId: id,
      categoryName: category.name,
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  })
);

// Admin Webhook Management APIs
/**
 * @swagger
 * /api/admin/webhooks:
 *   get:
 *     summary: Get all webhooks
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/webhooks',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page = 1, limit = 50, search, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { url: { contains: search as string, mode: 'insensitive' } },
        { events: { has: search as string } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [webhooks, total] = await Promise.all([
      prisma.webhook.findMany({
        where,
        include: {
          developer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              deliveries: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.webhook.count({ where }),
    ]);

    res.json({
      success: true,
      data: webhooks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/webhooks:
 *   post:
 *     summary: Create new webhook
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/webhooks',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { url, secret, events, developerId, metadata = {} } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      throw ApiError.badRequest('URL and events are required');
    }

    // Verify developer exists if developerId provided
    if (developerId) {
      const developer = await prisma.developer.findUnique({
        where: { id: developerId as string },
      });
      if (!developer) {
        throw ApiError.notFound('Developer not found');
      }
    }

    const webhook = await prisma.webhook.create({
      data: {
        url: url as string,
        secret: secret as string | undefined,
        events: Array.isArray(events) ? events.join(',') : events as string,
        developerId: developerId as string | undefined,
        metadata,
      },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    apiLogger.info('Webhook created by admin', {
      webhookId: webhook.id,
      url: webhook.url,
      adminId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: webhook,
    });
  })
);

/**
 * @swagger
 * /api/admin/webhooks/{id}:
 *   put:
 *     summary: Update webhook
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/webhooks/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };

    if (!id) {
      throw ApiError.badRequest('Webhook ID is required');
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: id as string },
    });

    if (!webhook) {
      throw ApiError.notFound('Webhook not found');
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id: id as string },
      data: req.body,
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    apiLogger.info('Webhook updated by admin', {
      webhookId: id,
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      data: updatedWebhook,
    });
  })
);

/**
 * @swagger
 * /api/admin/webhooks/{id}:
 *   delete:
 *     summary: Delete webhook
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/webhooks/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };

    if (!id) {
      throw ApiError.badRequest('Webhook ID is required');
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: id as string },
    });

    if (!webhook) {
      throw ApiError.notFound('Webhook not found');
    }

    await prisma.webhook.delete({
      where: { id: id as string },
    });

    apiLogger.info('Webhook deleted by admin', {
      webhookId: id,
      url: webhook.url,
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/webhooks/{id}/deliveries:
 *   get:
 *     summary: Get webhook deliveries
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/webhooks/:id/deliveries',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Ensure `id` is treated as a non-optional string
    const { id } = req.params as { id: string };
    const { page = 1, limit = 50 } = req.query;

    if (!id) {
      throw ApiError.badRequest('Webhook ID is required');
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where: { webhookId: id as string },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.webhookDelivery.count({ where: { webhookId: id as string } }),
    ]);

    res.json({
      success: true,
      data: deliveries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/resources:
 *   get:
 *     summary: Get all resources with pagination and search
 *     tags: [Admin]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for resource name
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, fileSize]
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
 *         description: List of resources
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
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * @route GET /api/admin/resources
 * @desc Get all resources with pagination and search
 * @access Private (Admin)
 */

router.get(
  '/resources',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validationErrorHandler(schemas.adminResourceQuery, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      includeDescendants = 'true',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      accessPolicy,
      ownerProjectId,
      tags,
    } = req.query;

    // Build filter
    const filter: any = {};
    if (search) filter.search = search as string;

    // Trace incoming pagination & filter params
    apiLogger.info('[RESOURCES] Incoming query params', {
      page,
      limit,
      search,
      categoryId,
      includeDescendants,
      status,
      accessPolicy,
      ownerProjectId,
      tags,
    });

    if (categoryId) {
      // Collect descendant category IDs if requested
      let categoryIds: string[] = [categoryId as string];

      if (includeDescendants !== 'false') {
        const rootCat = await prisma.itemCategory.findUnique({
          where: { id: categoryId as string },
          select: { path: true },
        });

        apiLogger.debug('[RESOURCES] Root category fetched', { rootCat });

        if (rootCat) {
          const descendants = await prisma.itemCategory.findMany({
            where: {
              path: {
                startsWith: rootCat.path + '/',
              },
            },
            select: { id: true },
          });

          apiLogger.debug('[RESOURCES] Descendant categories', {
            descendantCount: descendants.length,
            descendantIds: descendants.map((d) => d.id),
          });
          categoryIds = [categoryId as string, ...descendants.map((d) => d.id)];
        }
      }

      apiLogger.debug('[RESOURCES] Final categoryIds used for filter', { categoryIds });

      filter.categoryId = { in: categoryIds };
    }

    if (status) filter.status = status as string;
    if (accessPolicy) filter.accessPolicy = accessPolicy as string;
    if (ownerProjectId) filter.ownerProjectId = ownerProjectId as string;
    if (tags) filter.tags = tags as string;

    // Use ResourceManagementService
    const result = await resourceManagementService.getResources(
      filter,
      Number(page),
      Number(limit),
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    );

    apiLogger.info('Admin retrieved resources list', {
      adminId: req.user!.id,
      page: Number(page),
      limit: Number(limit),
      total: result.pagination.total,
      search: search || null,
      categoryId: categoryId || null,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /api/admin/resources:
 *   post:
 *     summary: Upload a new resource
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - name
 *               - categoryId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *                 description: Resource name
 *               description:
 *                 type: string
 *                 description: Resource description
 *               categoryId:
 *                 type: string
 *                 description: Category ID
 *               ownerProjectId:
 *                 type: string
 *                 description: Optional project owner ID
 *               accessPolicy:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, PROJECT_ONLY, DEVELOPERS_ONLY]
 *                 default: DEVELOPERS_ONLY
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               keywords:
 *                 type: string
 *                 description: Comma-separated keywords for search
 *     responses:
 *       201:
 *         description: Resource uploaded successfully
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
 *       400:
 *         description: Bad request - validation error
 *       413:
 *         description: File too large
 *       415:
 *         description: Unsupported media type
 * @route POST /api/admin/resources
 * @desc Upload a new resource
 * @access Private (Admin)
 */
router.post(
  '/resources',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  upload.single('file'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.file) {
      throw ApiError.badRequest('No file provided');
    }

    const {
      name,
      description,
      categoryId,
      ownerProjectId,
      accessPolicy,
      tags,
      keywords,
      metadata,
      isPremium,
      relativePath,
    } = req.body;

    if (!name || (!categoryId && !relativePath)) {
      throw ApiError.badRequest('Name and either categoryId or relativePath are required');
    }

    // Parse strings from input
    const tagsString = tags ? tags.toString() : '';
    const keywordsString = keywords ? keywords.toString() : '';
    const metadataObj = metadata ? JSON.parse(metadata) : {};

    // Create resource using ResourceManagementService
    const resource = await resourceManagementService.createResource({
      name,
      description,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      categoryId,
      ownerProjectId,
      uploadedByAdminId: req.user!.id,
      accessPolicy,
      tags: tagsString,
      keywords: keywordsString,
      metadata: metadataObj,
      isPremium: isPremium === 'true' || isPremium === true,
    });

    apiLogger.info('Resource uploaded successfully', {
      resourceId: resource.id,
      name: resource.name,
      adminId: req.user!.id,
      fileSize: req.file.size,
      categoryId,
    });

    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource uploaded successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/resources/{id}:
 *   put:
 *     summary: Update resource metadata
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
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
 *               categoryId:
 *                 type: string
 *               accessPolicy:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, PROJECT_ONLY, DEVELOPERS_ONLY]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, ARCHIVED]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *       404:
 *         description: Resource not found
 * @route PUT /api/admin/resources/:id
 * @desc Update resource metadata
 * @access Private (Admin)
 */
router.put(
  '/resources/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('Resource ID is required');
    }

    const updatedResource = await resourceManagementService.updateResource(id, req.body);

    apiLogger.info('Resource updated successfully', {
      resourceId: id,
      adminId: req.user!.id,
      updatedFields: Object.keys(req.body),
    });

    res.json({
      success: true,
      data: updatedResource,
      message: 'Resource updated successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/resources/{id}:
 *   delete:
 *     summary: Delete (archive) a resource
 *     tags: [Admin]
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
 *         description: Resource deleted successfully
 *       404:
 *         description: Resource not found
 * @route DELETE /api/admin/resources/:id
 * @desc Delete (archive) a resource
 * @access Private (Admin)
 */
router.delete(
  '/resources/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('Resource ID is required');
    }

    await resourceManagementService.deleteResource(id, req.user!.id);

    apiLogger.info('Resource deleted successfully', {
      resourceId: id,
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Resource deleted successfully',
    });
  })
);

/**
 * @swagger
 * /api/admin/resources/{id}:
 *   get:
 *     summary: Get resource details by ID
 *     tags: [Admin]
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
 *       404:
 *         description: Resource not found
 * @route GET /api/admin/resources/:id
 * @desc Get resource details by ID
 * @access Private (Admin)
 */
router.get(
  '/resources/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('Resource ID is required');
    }

    const resource = await resourceManagementService.getResourceById(id);

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    apiLogger.info('Resource details retrieved', {
      resourceId: id,
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      data: resource,
    });
  })
);

/**
 * @swagger
 * /api/admin/resources/{id}/preview:
 *   get:
 *     summary: Generate a pre-signed URL to preview a resource
 *     tags: [Admin]
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
 *         description: Pre-signed URL generated successfully
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
 *                       description: Pre-signed URL for preview
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Resource not found
 * @route GET /api/admin/resources/:id/preview
 * @desc Generate a pre-signed URL to preview a resource
 * @access Private (Admin)
 */
router.get(
  '/resources/:id/preview',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('Resource ID is required');
    }

    const resource = await resourceManagementService.getResourceById(id);

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    // Generate pre-signed URL for preview (read-only, shorter expiry)
    const downloadUrl = await s3Service.generateDownloadUrl(
      resource.s3Key,
      3600 // 1 hour expiry for preview
    );

    const downloadInfo = {
      downloadUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };

    apiLogger.info('Resource preview URL generated', {
      resourceId: id,
      adminId: req.user!.id,
      expiresAt: downloadInfo.expiresAt,
    });

    res.json({
      success: true,
      data: downloadInfo,
    });
  })
);

/**
 * @swagger
 * /api/admin/resources/{id}/download:
 *   get:
 *     summary: Generate a pre-signed URL to download a resource
 *     tags: [Admin]
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
 *         description: Pre-signed URL generated successfully
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
 *                       description: Pre-signed URL for download
 *                     filename:
 *                       type: string
 *                       description: Original filename
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Resource not found
 * @route GET /api/admin/resources/:id/download
 * @desc Generate a pre-signed URL to download a resource
 * @access Private (Admin)
 */
router.get(
  '/resources/:id/download',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('Resource ID is required');
    }

    const resource = await resourceManagementService.getResourceById(id);

    if (!resource) {
      throw ApiError.notFound('Resource not found');
    }

    // Generate pre-signed URL for download (longer expiry)
    const downloadUrl = await s3Service.generateDownloadUrl(
      resource.s3Key,
      7200 // 2 hours expiry for download
    );

    // Create filename from resource name and file extension
    const fileExtension = resource.fileType.startsWith('.')
      ? resource.fileType
      : `.${resource.fileType}`;
    const filename = `${resource.name}${fileExtension}`;

    const downloadInfo = {
      downloadUrl,
      filename,
      expiresAt: new Date(Date.now() + 7200 * 1000).toISOString(),
    };

    apiLogger.info('Resource download URL generated', {
      resourceId: id,
      adminId: req.user!.id,
      filename,
      expiresAt: downloadInfo.expiresAt,
    });

    res.json({
      success: true,
      data: downloadInfo,
    });
  })
);

/**
 * @swagger
 * /api/admin/resources/stats:
 *   get:
 *     summary: Get resource statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resource statistics
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
 *                     totalResources:
 *                       type: integer
 *                     activeResources:
 *                       type: integer
 *                     resourcesByCategory:
 *                       type: array
 *                     resourcesByAccessPolicy:
 *                       type: array
 *                     topCategories:
 *                       type: array
 * @route GET /api/admin/resources/stats
 * @desc Get resource statistics
 * @access Private (Admin)
 */
router.get(
  '/resources/stats',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const stats = await resourceManagementService.getResourceStats();

    apiLogger.info('Resource stats retrieved', {
      adminId: req.user!.id,
    });

    res.json({
      success: true,
      data: stats,
    });
  })
);

// ============================================================================
// AVATAR MANAGEMENT ROUTES
// ============================================================================

// Configure multer for avatar file uploads
const avatarUpload = multer({
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

// Avatar error handler
const handleAvatarError = (error: any, res: any): void => {
  avatarLogger.error('Avatar Admin API Error:', error);

  if (error instanceof AvatarValidationError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.message,
      field: error.field,
      value: error.value,
    });
    return;
  }

  if (error instanceof AvatarNotFoundError) {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: error.message,
    });
    return;
  }

  if (error instanceof AvatarPermissionError) {
    res.status(403).json({
      success: false,
      error: 'Permission Denied',
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
};

/**
 * @route GET /api/admin/avatar/categories
 * @desc Get all avatar categories
 * @access Private (Admin)
 */
router.get(
  '/avatar/categories',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const includeChildren = req.query.includeChildren !== 'false';
      const categories = await avatarService.getAvatarCategories(includeChildren);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      handleAvatarError(error, res);
    }
  })
);

/**
 * @route POST /api/admin/avatar/categories
 * @desc Create a new avatar category
 * @access Private (Admin)
 */
router.post(
  '/avatar/categories',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      // Implementation would go here - for now return not implemented
      res.status(501).json({
        success: false,
        error: 'Not Implemented',
        message: 'Avatar category creation not yet implemented',
      });
    } catch (error) {
      handleAvatarError(error, res);
    }
  })
);

/**
 * @route PUT /api/admin/avatar/categories/:id
 * @desc Update an avatar category
 * @access Private (Admin)
 */
router.put(
  '/avatar/categories/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      // Implementation would go here - for now return not implemented
      res.status(501).json({
        success: false,
        error: 'Not Implemented',
        message: 'Avatar category update not yet implemented',
      });
    } catch (error) {
      handleAvatarError(error, res);
    }
  })
);

/**
 * @route DELETE /api/admin/avatar/categories/:id
 * @desc Delete an avatar category
 * @access Private (Admin)
 */
router.delete(
  '/avatar/categories/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      // Implementation would go here - for now return not implemented
      res.status(501).json({
        success: false,
        error: 'Not Implemented',
        message: 'Avatar category deletion not yet implemented',
      });
    } catch (error) {
      handleAvatarError(error, res);
    }
  })
);

/**
 * @route GET /api/admin/avatar/resources
 * @desc Get avatar resources with filtering and pagination
 * @access Private (Admin)
 */
router.get(
  '/avatar/resources',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const query: AvatarQuery = {
        gender: req.query.gender as AvatarGender,
        partType: req.query.partType as AvatarPartType,
        categoryId: req.query.categoryId as string,
        status: req.query.status as AvatarStatus,
        isPremium:
          req.query.isPremium === 'true'
            ? true
            : req.query.isPremium === 'false'
              ? false
              : undefined,
        isFree:
          req.query.isFree === 'true' ? true : req.query.isFree === 'false' ? false : undefined,
        tags: req.query.tags as string,
        search: req.query.search as string,
      };

      const options = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        includeCategory: req.query.includeCategory === 'true',
      };

      const result = await avatarService.getAvatars(query, options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleAvatarError(error, res);
    }
  })
);

/**
 * @route GET /api/admin/avatar/resources/:id
 * @desc Get avatar resource by ID
 * @access Private (Admin)
 */
router.get(
  '/avatar/resources/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const resourceId = req.params.id;
      const options = {
        includeCategory: req.query.includeCategory === 'true',
      };

      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Resource ID is required',
        });
        return;
      }

      const resource = await avatarService.getAvatarById(resourceId, options);

      res.json({
        success: true,
        data: resource,
      });
    } catch (error) {
      handleAvatarError(error, res);
    }
  })
);

/**
 * @route POST /api/admin/avatar/resources
 * @desc Create a new avatar resource
 * @access Private (Admin)
 */
router.post(
  '/avatar/resources',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  upload.single('file'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'File is required',
        });
        return;
      }

      const adminId = req.user!.id;
      const request: CreateAvatarRequest = {
        name: req.body.name,
        description: req.body.description,
        gender: req.body.gender?.toUpperCase() as AvatarGender,
        partType: req.body.partType?.toUpperCase() as AvatarPartType,
        categoryId: req.body.categoryId,
        file: req.file.buffer,
        version: req.body.version || '1.0.0',
        // uniquePath removed as it's no longer in schema
        resourceId: req.body.resourceId,
        isPremium: req.body.isPremium === 'true',
        isFree: req.body.isFree === 'true',
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        tags: req.body.tags as string,
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined,
      };

      const resource = await avatarService.createAvatar(request, adminId);

      res.status(201).json({
        success: true,
        data: resource,
      });
    } catch (error) {
      handleAvatarError(error, res);
    }
  })
);

/**
 * @route PUT /api/admin/avatar/resources/:id
 * @desc Update avatar resource
 * @access Private (Admin)
 */
router.put(
  '/avatar/resources/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const resourceId = req.params.id;
      const adminId = req.user!.id;

      const request: UpdateAvatarRequest = {
        name: req.body.name,
        description: req.body.description,
        // gender and partType are not updatable in UpdateAvatarResourceRequest
        categoryId: req.body.categoryId,
        version: req.body.version,
        // resourceId is not updatable in UpdateAvatarResourceRequest
        isPremium: req.body.isPremium,
        isFree: req.body.isFree,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        tags: req.body.tags as string,
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined,
        status: req.body.status as AvatarStatus,
      };

      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Resource ID is required',
        });
        return;
      }

      const resource = await avatarService.updateAvatarResource(resourceId, request, adminId);

      res.json({
        success: true,
        data: resource,
      });
    } catch (error) {
      handleAvatarError(error, res);
    }
  })
);

/**
 * @route DELETE /api/admin/avatar/resources/:id
 * @desc Delete avatar resource
 * @access Private (Admin)
 */
router.delete(
  '/avatar/resources/:id',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const resourceId = req.params.id;
      const adminId = req.user!.id;

      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Resource ID is required',
        });
        return;
      }

      await avatarService.deleteAvatar(resourceId, adminId);

      res.json({
        success: true,
        message: 'Avatar resource deleted successfully',
      });
    } catch (error) {
      handleAvatarError(error, res);
    }
  })
);

/**
 * @route GET /api/admin/avatar/resources/:id/download
 * @desc Download avatar resource file
 * @access Private (Admin)
 */
router.get(
  '/avatar/resources/:id/download',
  validateJWT,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const resourceId = req.params.id;

      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Resource ID is required',
        });
        return;
      }

      const resource = await avatarService.getAvatarById(resourceId);

      // Generate pre-signed URL for download
      const downloadUrl = await s3Service.generateDownloadUrl(
        resource.s3Key, // Use s3Key for S3 operations
        3600 // 1 hour expiry
      );

      res.json({
        success: true,
        data: {
          downloadUrl,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
      });
    } catch (error) {
      handleAvatarError(error, res);
    }
  })
);

export default router;
