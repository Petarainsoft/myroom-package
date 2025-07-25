import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { performanceLogger } from '@/utils/logger';
import { databaseService } from '@/services/DatabaseService';
import { redisService } from '@/services/RedisService';
import { s3Service } from '@/services/S3Service';
import { config } from '@/config/config';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/health
 * @desc Basic health check
 * @access Public
 */
router.get('/',
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

/**
 * @route GET /api/health/detailed
 * @desc Detailed health check with service status
 * @access Public
 */
router.get('/detailed',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const checks: any = {};
    let overallStatus = 'healthy';

    // Database health check
    try {
      const dbStartTime = Date.now();
      const dbHealth = await databaseService.healthCheck();
      checks.database = {
        status: dbHealth.isHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - dbStartTime,
        details: dbHealth,
      };
      
      if (!dbHealth.isHealthy) {
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
      checks.redis = {
        status: redisHealth.isHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - redisStartTime,
        details: redisHealth,
      };
      
      if (!redisHealth.isHealthy) {
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
      checks.s3 = {
        status: s3Health.isHealthy ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - s3StartTime,
        details: s3Health,
      };
      
      if (!s3Health.isHealthy) {
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
      performanceLogger.warn('Health check response time high', {
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
 */
router.get('/database',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      const dbHealth = await databaseService.healthCheck();
      const responseTime = Date.now() - startTime;

      // Additional database metrics
      const metrics = await databaseService.getMetrics();

      const health = {
        status: dbHealth.isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: dbHealth,
        metrics,
      };

      const statusCode = dbHealth.isHealthy ? 200 : 503;

      res.status(statusCode).json({
        success: dbHealth.isHealthy,
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
 */
router.get('/redis',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      const redisHealth = await redisService.healthCheck();
      const responseTime = Date.now() - startTime;

      // Additional Redis info
      const info = await redisService.info();

      const health = {
        status: redisHealth.isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: redisHealth,
        info: {
          version: info.redis_version,
          mode: info.redis_mode,
          connectedClients: info.connected_clients,
          usedMemory: info.used_memory_human,
          uptime: info.uptime_in_seconds,
        },
      };

      const statusCode = redisHealth.isHealthy ? 200 : 503;

      res.status(statusCode).json({
        success: redisHealth.isHealthy,
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
 */
router.get('/s3',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      const s3Health = await s3Service.healthCheck();
      const responseTime = Date.now() - startTime;

      const health = {
        status: s3Health.isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: s3Health,
      };

      const statusCode = s3Health.isHealthy ? 200 : 503;

      res.status(statusCode).json({
        success: s3Health.isHealthy,
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
 */
router.get('/stats',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      // Get basic system stats
      const [customerCount, projectCount, resourceCount, manifestCount, apiKeyCount] = await Promise.all([
        prisma.customer.count(),
        prisma.project.count(),
        prisma.resource.count(),
        prisma.manifest.count(),
        prisma.apiKey.count(),
      ]);

      // Get recent activity (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [recentCustomers, recentProjects, recentResources, recentManifests] = await Promise.all([
        prisma.customer.count({ where: { createdAt: { gte: yesterday } } }),
        prisma.project.count({ where: { createdAt: { gte: yesterday } } }),
        prisma.resource.count({ where: { createdAt: { gte: yesterday } } }),
        prisma.manifest.count({ where: { createdAt: { gte: yesterday } } }),
      ]);

      const stats = {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        totals: {
          customers: customerCount,
          projects: projectCount,
          resources: resourceCount,
          manifests: manifestCount,
          apiKeys: apiKeyCount,
        },
        recent24h: {
          customers: recentCustomers,
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
 */
router.get('/readiness',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      // Check critical services
      const [dbHealth, redisHealth] = await Promise.all([
        databaseService.healthCheck(),
        redisService.healthCheck(),
      ]);

      const isReady = dbHealth.isHealthy && redisHealth.isHealthy;
      const responseTime = Date.now() - startTime;

      const readiness = {
        ready: isReady,
        timestamp: new Date().toISOString(),
        responseTime,
        checks: {
          database: dbHealth.isHealthy,
          redis: redisHealth.isHealthy,
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
 */
router.get('/liveness',
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