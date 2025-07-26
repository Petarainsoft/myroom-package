import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/config/config';
import { asyncHandler, validationErrorHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { authLogger } from '@/utils/logger';
import { redisService } from '@/services/RedisService';
import { schemas } from '@/schemas/validation';
import type { SignOptions } from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new developer
 *     description: Create a new developer account with email and password
 *     tags: [Authentication]
 *     security: []
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Developer full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Developer email address
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Developer password (minimum 8 characters)
 *                 example: SecurePassword123!
 *     responses:
 *       201:
 *         description: Developer registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 developer:
 *                   $ref: '#/components/schemas/Developer'
 *                 message:
 *                   type: string
 *                   example: Developer registered successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route POST /api/auth/register
 * @desc Register new developer
 * @access Public
 */
router.post('/register',
  validationErrorHandler(schemas.developerCreate),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if developer with email already exists
    const existingDeveloper = await prisma.developer.findUnique({
      where: { email },
    });

    if (existingDeveloper) {
      throw ApiError.conflict('Developer with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create developer
    const developer = await prisma.developer.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const expiresIn: string | number = /^\d+$/.test(config.JWT_EXPIRES_IN)
      ? parseInt(config.JWT_EXPIRES_IN, 10)
      : config.JWT_EXPIRES_IN;

    const jwtOptions: SignOptions = { expiresIn: expiresIn as any };
    const token = jwt.sign(
      {
        id: developer.id,
        email: developer.email,
        developerId: developer.id,
      },
      config.JWT_SECRET as string,
      jwtOptions
    );

    authLogger.info('New developer registered', {
      developerId: developer.id,
      email: developer.email,
    });

    res.status(201).json({
      success: true,
      token,
      developer: {
        id: developer.id,
        name: developer.name,
        email: developer.email,
      },
      message: 'Developer registered successfully',
    });
  })
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Developer login
 *     description: Authenticate developer and receive JWT token
 *     tags: [Authentication]
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
 *                 description: Developer email address
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Developer password
 *                 example: SecurePassword123!
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
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 developer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     name:
 *                       type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Account not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * @route POST /api/auth/login
 * @desc Developer login
 * @access Public
 */
router.post('/login',
  validationErrorHandler(schemas.adminLogin), // Using adminLogin schema for developer login too
  asyncHandler(async (req, res) => {
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
    const expiresIn2: string | number = /^\d+$/.test(config.JWT_EXPIRES_IN)
      ? parseInt(config.JWT_EXPIRES_IN, 10)
      : config.JWT_EXPIRES_IN;

    const jwtOptions: SignOptions = { expiresIn: expiresIn2 as any };
    const token = jwt.sign(
      {
        id: developer.id,
        email: developer.email,
        developerId: developer.id,
      },
      config.JWT_SECRET as string,
      jwtOptions
    );

    // No need to update last login timestamp as it's not in the schema
    // But we can log the login time
    authLogger.info('Developer login time', {
      developerId: developer.id,
      loginTime: new Date(),
    });

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
      token,
      developer: {
        id: developer.id,
        email: developer.email,
        name: developer.name,
      },
    });
  })
);

export default router;