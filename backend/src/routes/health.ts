import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { apiLogger, s3Logger } from '@/utils/logger';
import { databaseService } from '@/services/DatabaseService';
import { redisService } from '@/services/RedisService';
import { s3Service } from '@/services/S3Service';
import { config } from '@/config/config';
// Health endpoints are already public

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/health
 * @desc Basic health check
 * @access Public
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Basic health check
 *     description: Simple health check endpoint that returns basic system information
 *     responses:
 *       200:
 *         description: System is healthy
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
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       description: System uptime in seconds
 *                       example: 3600
 *                     environment:
 *                       type: string
 *                       example: production
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                       example: 5
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      responseTime: Date.now() - startTime,
    };

    res.json({
      success: true,
      data: health,
    });
  })
);

// Note: Cookie test endpoint removed - only needed for development testing

/**
 * @route GET /api/health/detailed
 * @desc Detailed health check with service status
 * @access Public
 * @swagger
 * /api/health/detailed:
 *   get:
 *     tags: [Health]
 *     summary: Detailed health check
 *     description: Comprehensive health check that verifies the status of all dependent services
 *     responses:
 *       200:
 *         description: Detailed health status (may indicate degraded if some services are unhealthy)
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
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       description: System uptime in seconds
 *                       example: 3600
 *                     environment:
 *                       type: string
 *                       example: production
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                       example: 120
 *                     checks:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [healthy, unhealthy]
 *                               example: healthy
 *                             responseTime:
 *                               type: number
 *                               example: 45
 *                             details:
 *                               type: object
 *                         redis:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [healthy, unhealthy]
 *                               example: healthy
 *                             responseTime:
 *                               type: number
 *                               example: 15
 *                             details:
 *                               type: object
 *                         s3:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [healthy, unhealthy]
 *                               example: healthy
 *                             responseTime:
 *                               type: number
 *                               example: 35
 *                             details:
 *                               type: object
 *                         memory:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: healthy
 *                             usage:
 *                               type: object
 *                               properties:
 *                                 rss:
 *                                   type: number
 *                                   example: 75
 *                                 heapTotal:
 *                                   type: number
 *                                   example: 50
 *                                 heapUsed:
 *                                   type: number
 *                                   example: 40
 *                                 external:
 *                                   type: number
 *                                   example: 10
 *                         cpu:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: healthy
 *                             usage:
 *                               type: object
 *                               properties:
 *                                 user:
 *                                   type: number
 *                                   example: 12345
 *                                 system:
 *                                   type: number
 *                                   example: 6789
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: unhealthy
 *                     checks:
 *                       type: object
 */
router.get(
  '/detailed',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const checks: any = {};
    let overallStatus = 'healthy';

    // Database health check
    try {
      const dbStartTime = Date.now();
      const dbHealth = await databaseService.healthCheck();
      const dbHealthy = dbHealth.status === 'healthy';
      checks.database = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - dbStartTime,
        details: dbHealth,
      };

      if (!dbHealthy) {
        overallStatus = 'degraded';
      }
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      overallStatus = 'unhealthy';
    }

    // Redis health check
    try {
      const redisStartTime = Date.now();
      const redisHealth = await redisService.healthCheck();
      const redisHealthy = redisHealth.status === 'healthy';
      checks.redis = {
        status: redisHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - redisStartTime,
        details: redisHealth,
      };

      if (!redisHealthy) {
        overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
      }
    } catch (error) {
      checks.redis = {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      overallStatus = 'unhealthy';
    }

    // S3 health check
    try {
      const s3StartTime = Date.now();
      const s3Health = await s3Service.healthCheck();
      const s3Healthy = s3Health.status === 'healthy';
      checks.s3 = {
        status: s3Healthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - s3StartTime,
        details: s3Health,
      };

      if (!s3Healthy) {
        overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
      }
    } catch (error) {
      checks.s3 = {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      overallStatus = 'unhealthy';
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();
    checks.memory = {
      status: 'healthy',
      usage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
    };

    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    checks.cpu = {
      status: 'healthy',
      usage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    };

    const totalResponseTime = Date.now() - startTime;

    const health = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      responseTime: totalResponseTime,
      checks,
    };

    // Log performance if response time is high
    if (totalResponseTime > 1000) {
      apiLogger.warn('Health check response time high', {
        responseTime: totalResponseTime,
        status: overallStatus,
      });
    }

    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: overallStatus !== 'unhealthy',
      data: health,
    });
  })
);

/**
 * @route GET /api/health/database
 * @desc Database-specific health check
 * @access Public
 * @swagger
 * /api/health/database:
 *   get:
 *     tags: [Health]
 *     summary: Database health check
 *     description: Checks the health and performance of the database connection
 *     responses:
 *       200:
 *         description: Database is healthy
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
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                       example: 45
 *                     details:
 *                       type: object
 *                       description: Database-specific health information
 *                     metrics:
 *                       type: object
 *                       description: Additional database metrics
 *       503:
 *         description: Database is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: unhealthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       example: 120
 *                     error:
 *                       type: string
 *                       example: "Connection timeout"
 */
router.get(
  '/database',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      const dbHealth = await databaseService.healthCheck();
      const responseTime = Date.now() - startTime;

      // Additional database metrics
      const metrics = await databaseService.getMetrics();

      const isHealthy = dbHealth.status === 'healthy';

      const health = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: dbHealth,
        metrics,
      };

      const statusCode = isHealthy ? 200 : 503;

      res.status(statusCode).json({
        success: isHealthy,
        data: health,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      res.status(503).json({
        success: false,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  })
);

/**
 * @route GET /api/health/redis
 * @desc Redis-specific health check
 * @access Public
 * @swagger
 * /api/health/redis:
 *   get:
 *     tags: [Health]
 *     summary: Redis health check
 *     description: Checks the health and performance of the Redis connection
 *     responses:
 *       200:
 *         description: Redis is healthy
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
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                       example: 15
 *                     details:
 *                       type: object
 *                       description: Redis-specific health information
 *       503:
 *         description: Redis is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: unhealthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       example: 120
 *                     error:
 *                       type: string
 *                       example: "Connection refused"
 */
router.get(
  '/redis',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      const redisHealth = await redisService.healthCheck();
      const responseTime = Date.now() - startTime;

      // Additional Redis info
      const info = await redisService.info();

      const isHealthy = redisHealth.status === 'healthy';

      const health = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: redisHealth,
      };

      const statusCode = isHealthy ? 200 : 503;

      res.status(statusCode).json({
        success: isHealthy,
        data: health,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      res.status(503).json({
        success: false,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  })
);

/**
 * @route GET /api/health/s3
 * @desc S3-specific health check
 * @access Public
 * @swagger
 * /api/health/s3:
 *   get:
 *     tags: [Health]
 *     summary: S3 health check
 *     description: Checks the health and performance of the S3 storage connection
 *     responses:
 *       200:
 *         description: S3 is healthy
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
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                       example: 35
 *                     details:
 *                       type: object
 *                       description: S3-specific health information
 *       503:
 *         description: S3 is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: unhealthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       example: 120
 *                     error:
 *                       type: string
 *                       example: "Access denied"
 */
router.get(
  '/s3',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      const s3Health = await s3Service.healthCheck();
      const responseTime = Date.now() - startTime;

      const isHealthy = s3Health.status === 'healthy';

      const health = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: s3Health,
      };

      const statusCode = isHealthy ? 200 : 503;

      res.status(statusCode).json({
        success: isHealthy,
        data: health,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      res.status(503).json({
        success: false,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  })
);

/**
 * @route GET /api/health/stats
 * @desc System statistics
 * @access Public
 * @swagger
 * /api/health/stats:
 *   get:
 *     tags: [Health]
 *     summary: System statistics
 *     description: Retrieves system-wide statistics and metrics about database entities and system performance
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
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
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                       example: 85
 *                     totals:
 *                       type: object
 *                       properties:
 *                         developers:
                           type: integer
                           example: 1250
 *                         projects:
 *                           type: integer
 *                           example: 3500
 *                         resources:
 *                           type: integer
 *                           example: 12000
 *                         manifests:
 *                           type: integer
 *                           example: 8500
 *                         apiKeys:
 *                           type: integer
 *                           example: 1500
 *                     recent24h:
 *                       type: object
 *                       properties:
 *                         developers:
                           type: integer
                           example: 25
 *                         projects:
 *                           type: integer
 *                           example: 120
 *                         resources:
 *                           type: integer
 *                           example: 350
 *                         manifests:
 *                           type: integer
 *                           example: 200
 *                     system:
 *                       type: object
 *                       properties:
 *                         uptime:
 *                           type: number
 *                           description: System uptime in seconds
 *                           example: 86400
 *                         memory:
 *                           type: object
 *                           properties:
 *                             rss:
 *                               type: integer
 *                               description: Resident Set Size in MB
 *                               example: 120
 *                             heapTotal:
 *                               type: integer
 *                               description: Total heap size in MB
 *                               example: 80
 *                             heapUsed:
 *                               type: integer
 *                               description: Used heap size in MB
 *                               example: 65
 *                         nodeVersion:
 *                           type: string
 *                           example: "v16.15.0"
 *                         platform:
 *                           type: string
 *                           example: "linux"
 *                         arch:
 *                           type: string
 *                           example: "x64"
 *       500:
 *         description: Error retrieving system statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       example: 120
 *                     error:
 *                       type: string
 *                       example: "Database query failed"
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      // Get basic system stats
      const [developerCount, projectCount, resourceCount, manifestCount, apiKeyCount] =
        await Promise.all([
          prisma.developer.count(),
          prisma.project.count(),
          prisma.item.count(),
          prisma.manifest.count(),
          prisma.apiKey.count(),
        ]);

      // Get recent activity (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [recentDevelopers, recentProjects, recentResources, recentManifests] = await Promise.all(
        [
          prisma.developer.count({ where: { createdAt: { gte: yesterday } } }),
          prisma.project.count({ where: { createdAt: { gte: yesterday } } }),
          prisma.item.count({ where: { createdAt: { gte: yesterday } } }),
          prisma.manifest.count({ where: { createdAt: { gte: yesterday } } }),
        ]
      );

      const stats = {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        totals: {
          developers: developerCount,
          projects: projectCount,
          resources: resourceCount,
          manifests: manifestCount,
          apiKeys: apiKeyCount,
        },
        recent24h: {
          developers: recentDevelopers,
          projects: recentProjects,
          resources: recentResources,
          manifests: recentManifests,
        },
        system: {
          uptime: process.uptime(),
          memory: {
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          },
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      res.status(500).json({
        success: false,
        data: {
          timestamp: new Date().toISOString(),
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  })
);

/**
 * @route GET /api/health/readiness
 * @desc Kubernetes readiness probe
 * @access Public
 * @swagger
 * /api/health/readiness:
 *   get:
 *     tags: [Health]
 *     summary: Kubernetes readiness probe
 *     description: Checks if the application is ready to serve traffic by verifying database and Redis connections
 *     responses:
 *       200:
 *         description: Application is ready to serve traffic
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
 *                     status:
 *                       type: string
 *                       enum: [ready, not_ready]
 *                       example: ready
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                       example: 25
 *                     services:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: boolean
 *                           example: true
 *                         redis:
 *                           type: boolean
 *                           example: true
 *       503:
 *         description: Application is not ready to serve traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: not_ready
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       example: 120
 *                     services:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: boolean
 *                           example: false
 *                         redis:
 *                           type: boolean
 *                           example: true
 *                     error:
 *                       type: string
 *                       example: "Database connection failed"
 */
router.get(
  '/readiness',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      // Check critical services
      const [dbHealth, redisHealth] = await Promise.all([
        databaseService.healthCheck(),
        redisService.healthCheck(),
      ]);

      const dbHealthy = dbHealth.status === 'healthy';
      const redisHealthy = redisHealth.status === 'healthy';
      const isReady = dbHealthy && redisHealthy;
      const responseTime = Date.now() - startTime;

      const readiness = {
        ready: isReady,
        timestamp: new Date().toISOString(),
        responseTime,
        checks: {
          database: dbHealthy,
          redis: redisHealthy,
        },
      };

      const statusCode = isReady ? 200 : 503;

      res.status(statusCode).json({
        success: isReady,
        data: readiness,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      res.status(503).json({
        success: false,
        data: {
          ready: false,
          timestamp: new Date().toISOString(),
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  })
);

/**
 * @route GET /api/health/liveness
 * @desc Kubernetes liveness probe
 * @access Public
 * @swagger
 * /api/health/liveness:
 *   get:
 *     tags: [Health]
 *     summary: Kubernetes liveness probe
 *     description: Checks if the application is alive and functioning properly
 *     responses:
 *       200:
 *         description: Application is alive
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
 *                     status:
 *                       type: string
 *                       enum: [alive]
 *                       example: alive
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                       example: 15
 *                     uptime:
 *                       type: number
 *                       description: Application uptime in seconds
 *                       example: 86400
 */
router.get(
  '/liveness',
  asyncHandler(async (req, res) => {
    // Simple liveness check - just verify the process is running
    const liveness = {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
    };

    res.json({
      success: true,
      data: liveness,
    });
  })
);

export default router;
