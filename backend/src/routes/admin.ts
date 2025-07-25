import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/config/config';
import { validateJWT, requireRole, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { authLogger, businessLogger } from '@/utils/logger';
import { redisService } from '@/services/RedisService';
import { schemas } from '@/schemas/validation';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route POST /api/admin/auth/login
 * @desc Admin login
 * @access Public
 */
router.post('/auth/login', 
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
        password: true,
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
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      authLogger.warn('Admin login attempt with invalid password', {
        adminId: admin.id,
        ip: req.ip,
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_EXPIRES_IN,
        issuer: 'myroom-api',
        audience: 'myroom-admin',
      }
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
    await redisService.setex(`admin:${admin.id}`, config.CACHE_TTL_CUSTOMER, adminData);

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
 * @route POST /api/admin/auth/logout
 * @desc Admin logout
 * @access Private (Admin)
 */
router.post('/auth/logout',
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
 * @route GET /api/admin/auth/me
 * @desc Get current admin profile
 * @access Private (Admin)
 */
router.get('/auth/me',
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
 * @route PUT /api/admin/auth/change-password
 * @desc Change admin password
 * @access Private (Admin)
 */
router.put('/auth/change-password',
  validateJWT,
  validationErrorHandler(schemas.adminChangePassword),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user!.id;

    // Get current admin with password
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, password: true },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
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
      data: { password: hashedNewPassword },
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
 */
router.get('/admins',
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
 */
router.post('/admins',
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
        password: hashedPassword,
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

    businessLogger.info('New admin created', {
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
 */
router.get('/admins/:id',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

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
 */
router.put('/admins/:id',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  validationErrorHandler(schemas.adminUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
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

    businessLogger.info('Admin updated', {
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
 */
router.delete('/admins/:id',
  validateJWT,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
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

    businessLogger.info('Admin deleted', {
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
 * @route GET /api/admin/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (Admin)
 */
router.get('/dashboard/stats',
  validateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const [customerStats, projectStats, resourceStats, apiKeyStats] = await Promise.all([
      prisma.customer.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.project.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.resource.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.apiKey.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const stats = {
      customers: customerStats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.id;
        acc.total = (acc.total || 0) + stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      projects: projectStats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.id;
        acc.total = (acc.total || 0) + stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      resources: resourceStats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.id;
        acc.total = (acc.total || 0) + stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      apiKeys: apiKeyStats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.id;
        acc.total = (acc.total || 0) + stat._count.id;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;