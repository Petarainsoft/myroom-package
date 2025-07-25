import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from '@/config/config';
import { logger, requestLogger } from '@/utils/logger';
import { databaseService } from '@/services/DatabaseService';
import { redisService } from '@/services/RedisService';
import { s3Service } from '@/services/S3Service';
import { requestLoggerMiddleware } from '@/middleware/requestLogger';
import { notFoundHandler, errorHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';

// Import routes
import adminRoutes from '@/routes/admin';
import customerRoutes from '@/routes/customer';
import resourceRoutes from '@/routes/resource';
import manifestRoutes from '@/routes/manifest';
import healthRoutes from '@/routes/health';

class App {
  public app: express.Application;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: config.CORS_CREDENTIALS,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400, // 24 hours
    }));

    // Compression
    this.app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses > 1KB
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path.startsWith('/api/health');
      },
      keyGenerator: (req) => {
        // Use API key if available, otherwise use IP
        return req.headers['x-api-key'] as string || req.ip;
      },
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({
      limit: config.UPLOAD_MAX_FILE_SIZE,
      verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        (req as any).rawBody = buf;
      },
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: config.UPLOAD_MAX_FILE_SIZE 
    }));

    // Request logging
    if (config.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => {
            requestLogger.info(message.trim());
          },
        },
      }));
    }

    // Custom request logger
    this.app.use(requestLoggerMiddleware);

    // Health check for load balancers (before other middleware)
    this.app.get('/health', (req, res) => {
      if (this.isShuttingDown) {
        return res.status(503).json({
          success: false,
          message: 'Server is shutting down',
        });
      }
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/customer', customerRoutes);
    this.app.use('/api/resource', resourceRoutes);
    this.app.use('/api/manifest', manifestRoutes);
    this.app.use('/api/health', healthRoutes);

    // API documentation endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        success: true,
        data: {
          name: 'MyRoom API',
          version: process.env.npm_package_version || '1.0.0',
          description: '3D Room Visualization Platform API',
          environment: config.NODE_ENV,
          endpoints: {
            admin: '/api/admin',
            customer: '/api/customer',
            resource: '/api/resource',
            manifest: '/api/manifest',
            health: '/api/health',
          },
          documentation: {
            swagger: '/api/docs',
            postman: '/api/postman',
          },
        },
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'MyRoom API Server',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing MyRoom API Server...');

      // Initialize database connection
      logger.info('Connecting to database...');
      await databaseService.connect();
      logger.info('Database connected successfully');

      // Initialize Redis connection
      logger.info('Connecting to Redis...');
      await redisService.connect();
      logger.info('Redis connected successfully');

      // Initialize S3 service (health check)
      logger.info('Checking S3 connection...');
      const s3Health = await s3Service.healthCheck();
      if (s3Health.isHealthy) {
        logger.info('S3 connection verified successfully');
      } else {
        logger.warn('S3 connection check failed', s3Health);
      }

      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public async start(port: number): Promise<void> {
    try {
      await this.initialize();

      const server = this.app.listen(port, () => {
        logger.info(`MyRoom API Server started successfully`, {
          port,
          environment: config.NODE_ENV,
          nodeVersion: process.version,
          platform: process.platform,
          pid: process.pid,
        });
      });

      // Graceful shutdown handling
      const gracefulShutdown = async (signal: string) => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        this.isShuttingDown = true;

        // Stop accepting new connections
        server.close(async () => {
          logger.info('HTTP server closed');

          try {
            // Close database connections
            await databaseService.disconnect();
            logger.info('Database disconnected');

            // Close Redis connections
            await redisService.disconnect();
            logger.info('Redis disconnected');

            logger.info('Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during graceful shutdown', {
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            process.exit(1);
          }
        });

        // Force shutdown after timeout
        setTimeout(() => {
          logger.error('Graceful shutdown timeout, forcing exit');
          process.exit(1);
        }, 30000); // 30 seconds timeout
      };

      // Handle shutdown signals
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', {
          error: error.message,
          stack: error.stack,
        });
        gracefulShutdown('uncaughtException');
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection', {
          reason: reason instanceof Error ? reason.message : String(reason),
          stack: reason instanceof Error ? reason.stack : undefined,
          promise: String(promise),
        });
        gracefulShutdown('unhandledRejection');
      });

    } catch (error) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default App;