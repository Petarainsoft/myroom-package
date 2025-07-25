import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validateApiKey, requireScope, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { businessLogger, securityLogger } from '@/utils/logger';
import { redisService } from '@/services/RedisService';
import { schemas } from '@/schemas/validation';
import { config } from '@/config/config';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route POST /api/customer/register
 * @desc Register new customer
 * @access Public (with API key)
 */
router.post('/register',
  validateApiKey,
  requireScope(['customer:write']),
  validationErrorHandler(schemas.customerCreate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, email, password, company, phone } = req.body;

    // Check if customer with email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      throw ApiError.conflict('Customer with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        password: hashedPassword,
        company,
        phone,
        verificationToken,
        status: 'PENDING_VERIFICATION',
        plan: 'FREE',
        quotaUsed: 0,
        quotaLimit: config.DEFAULT_QUOTA_LIMIT,
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        status: true,
        plan: true,
        quotaLimit: true,
        createdAt: true,
      },
    });

    businessLogger.info('New customer registered', {
      customerId: customer.id,
      email: customer.email,
      company: customer.company,
      apiKeyId: req.apiKey!.id,
    });

    res.status(201).json({
      success: true,
      data: {
        customer,
        verificationToken, // In production, this should be sent via email
      },
      message: 'Customer registered successfully. Please verify your email.',
    });
  })
);

/**
 * @route POST /api/customer/verify
 * @desc Verify customer email
 * @access Public (with API key)
 */
router.post('/verify',
  validateApiKey,
  requireScope(['customer:write']),
  validationErrorHandler(schemas.customerVerify),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, verificationToken } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    if (customer.status !== 'PENDING_VERIFICATION') {
      throw ApiError.badRequest('Customer is already verified or inactive');
    }

    if (customer.verificationToken !== verificationToken) {
      securityLogger.warn('Invalid verification token attempt', {
        customerId: customer.id,
        email,
        ip: req.ip,
      });
      throw ApiError.unauthorized('Invalid verification token');
    }

    // Update customer status
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        status: 'ACTIVE',
        verificationToken: null,
        verifiedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        verifiedAt: true,
      },
    });

    businessLogger.info('Customer email verified', {
      customerId: customer.id,
      email,
    });

    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Email verified successfully',
    });
  })
);

/**
 * @route GET /api/customer/profile
 * @desc Get customer profile
 * @access Private (Customer with API key)
 */
router.get('/profile',
  validateApiKey,
  requireScope(['customer:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customerId = req.apiKey!.customerId;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        status: true,
        plan: true,
        quotaUsed: true,
        quotaLimit: true,
        createdAt: true,
        verifiedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            projects: true,
            apiKeys: true,
          },
        },
      },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    res.json({
      success: true,
      data: customer,
    });
  })
);

/**
 * @route PUT /api/customer/profile
 * @desc Update customer profile
 * @access Private (Customer with API key)
 */
router.put('/profile',
  validateApiKey,
  requireScope(['customer:write']),
  validationErrorHandler(schemas.customerUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customerId = req.apiKey!.customerId;
    const updateData = req.body;

    // If email is being updated, check for conflicts
    if (updateData.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: updateData.email,
          id: { not: customerId },
        },
      });

      if (existingCustomer) {
        throw ApiError.conflict('Customer with this email already exists');
      }

      // If email is changed, require re-verification
      updateData.status = 'PENDING_VERIFICATION';
      updateData.verificationToken = crypto.randomBytes(32).toString('hex');
      updateData.verifiedAt = null;
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        status: true,
        plan: true,
        quotaUsed: true,
        quotaLimit: true,
        verifiedAt: true,
      },
    });

    // Remove from cache to force refresh
    await redisService.del(`customer:${customerId}`);

    businessLogger.info('Customer profile updated', {
      customerId,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: customer,
      message: updateData.email ? 'Profile updated. Please verify your new email.' : 'Profile updated successfully',
    });
  })
);

/**
 * @route PUT /api/customer/change-password
 * @desc Change customer password
 * @access Private (Customer with API key)
 */
router.put('/change-password',
  validateApiKey,
  requireScope(['customer:write']),
  validationErrorHandler(schemas.customerChangePassword),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    const customerId = req.apiKey!.customerId;

    // Get current customer with password
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, password: true },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isCurrentPasswordValid) {
      securityLogger.warn('Customer password change attempt with invalid current password', {
        customerId,
        ip: req.ip,
      });
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.customer.update({
      where: { id: customerId },
      data: { password: hashedNewPassword },
    });

    businessLogger.info('Customer password changed', {
      customerId,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

/**
 * @route GET /api/customer/projects
 * @desc Get customer projects
 * @access Private (Customer with API key)
 */
router.get('/projects',
  validateApiKey,
  requireScope(['project:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customerId = req.apiKey!.customerId;
    const { page, limit, sortBy = 'createdAt', sortOrder, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { customerId };
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
          settings: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              manifests: true,
            },
          },
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
 * @route POST /api/customer/projects
 * @desc Create new project
 * @access Private (Customer with API key)
 */
router.post('/projects',
  validateApiKey,
  requireScope(['project:write']),
  validationErrorHandler(schemas.projectCreate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customerId = req.apiKey!.customerId;
    const { name, description, settings } = req.body;

    // Check customer quota
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        quotaUsed: true,
        quotaLimit: true,
        _count: { select: { projects: true } },
      },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Check project limit based on plan
    const projectLimits = {
      FREE: 3,
      BASIC: 10,
      PRO: 50,
      ENTERPRISE: 1000,
    };

    const currentPlan = req.apiKey!.customer?.plan || 'FREE';
    const projectLimit = projectLimits[currentPlan as keyof typeof projectLimits];

    if (customer._count.projects >= projectLimit) {
      throw ApiError.quotaExceeded(`Project limit reached for ${currentPlan} plan`);
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        settings: settings || {},
        customerId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        settings: true,
        createdAt: true,
      },
    });

    businessLogger.info('New project created', {
      projectId: project.id,
      customerId,
      name: project.name,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  })
);

/**
 * @route GET /api/customer/projects/:id
 * @desc Get project by ID
 * @access Private (Customer with API key)
 */
router.get('/projects/:id',
  validateApiKey,
  requireScope(['project:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const customerId = req.apiKey!.customerId;

    const project = await prisma.project.findFirst({
      where: {
        id,
        customerId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            manifests: true,
          },
        },
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
 * @route PUT /api/customer/projects/:id
 * @desc Update project
 * @access Private (Customer with API key)
 */
router.put('/projects/:id',
  validateApiKey,
  requireScope(['project:write']),
  validationErrorHandler(schemas.projectUpdate),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const customerId = req.apiKey!.customerId;
    const updateData = req.body;

    // Check if project exists and belongs to customer
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        customerId,
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
        settings: true,
        updatedAt: true,
      },
    });

    businessLogger.info('Project updated', {
      projectId: id,
      customerId,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: project,
    });
  })
);

/**
 * @route DELETE /api/customer/projects/:id
 * @desc Delete project
 * @access Private (Customer with API key)
 */
router.delete('/projects/:id',
  validateApiKey,
  requireScope(['project:write']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const customerId = req.apiKey!.customerId;

    // Check if project exists and belongs to customer
    const project = await prisma.project.findFirst({
      where: {
        id,
        customerId,
      },
      include: {
        _count: {
          select: {
            manifests: true,
          },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Check if project has manifests
    if (project._count.manifests > 0) {
      throw ApiError.badRequest('Cannot delete project with existing manifests');
    }

    await prisma.project.delete({
      where: { id },
    });

    businessLogger.info('Project deleted', {
      projectId: id,
      customerId,
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  })
);

/**
 * @route GET /api/customer/api-keys
 * @desc Get customer API keys
 * @access Private (Customer with API key)
 */
router.get('/api-keys',
  validateApiKey,
  requireScope(['apikey:read']),
  validationErrorHandler(schemas.pagination, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customerId = req.apiKey!.customerId;
    const { page, limit, sortBy = 'createdAt', sortOrder } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [apiKeys, total] = await Promise.all([
      prisma.apiKey.findMany({
        where: { customerId },
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          status: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
          rateLimit: true,
        },
      }),
      prisma.apiKey.count({ where: { customerId } }),
    ]);

    res.json({
      success: true,
      data: {
        apiKeys,
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
 * @route GET /api/customer/usage/summary
 * @desc Get customer usage summary
 * @access Private (Customer with API key)
 */
router.get('/usage/summary',
  validateApiKey,
  requireScope(['customer:read']),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const customerId = req.apiKey!.customerId;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const [apiKeyUsage, resourceUsage, customer] = await Promise.all([
      prisma.apiKeyUsage.groupBy({
        by: ['date'],
        where: {
          apiKey: { customerId },
          date: { gte: startDate },
        },
        _sum: {
          requestCount: true,
          dataTransferred: true,
        },
        orderBy: { date: 'asc' },
      }),
      prisma.resourceUsage.groupBy({
        by: ['date'],
        where: {
          resource: {
            category: {
              customerCategoryPermissions: {
                some: { customerId },
              },
            },
          },
          date: { gte: startDate },
        },
        _sum: {
          downloadCount: true,
          dataTransferred: true,
        },
        orderBy: { date: 'asc' },
      }),
      prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          quotaUsed: true,
          quotaLimit: true,
          plan: true,
        },
      }),
    ]);

    const summary = {
      quota: {
        used: customer?.quotaUsed || 0,
        limit: customer?.quotaLimit || 0,
        percentage: customer?.quotaLimit ? Math.round((customer.quotaUsed / customer.quotaLimit) * 100) : 0,
      },
      apiUsage: {
        totalRequests: apiKeyUsage.reduce((sum, usage) => sum + (usage._sum.requestCount || 0), 0),
        totalDataTransferred: apiKeyUsage.reduce((sum, usage) => sum + (usage._sum.dataTransferred || 0), 0),
        dailyUsage: apiKeyUsage.map(usage => ({
          date: usage.date,
          requests: usage._sum.requestCount || 0,
          dataTransferred: usage._sum.dataTransferred || 0,
        })),
      },
      resourceUsage: {
        totalDownloads: resourceUsage.reduce((sum, usage) => sum + (usage._sum.downloadCount || 0), 0),
        totalDataTransferred: resourceUsage.reduce((sum, usage) => sum + (usage._sum.dataTransferred || 0), 0),
        dailyUsage: resourceUsage.map(usage => ({
          date: usage.date,
          downloads: usage._sum.downloadCount || 0,
          dataTransferred: usage._sum.dataTransferred || 0,
        })),
      },
      plan: customer?.plan || 'FREE',
    };

    res.json({
      success: true,
      data: summary,
    });
  })
);

export default router;