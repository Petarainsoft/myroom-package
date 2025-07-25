import { PrismaClient, Prisma } from '@prisma/client';
import { config } from '@/config/config';
import { dbLogger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';

/**
 * Database Service using Prisma ORM
 * Handles database connections, transactions, and common operations
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
      datasources: {
        db: {
          url: config.DATABASE_URL,
        },
      },
    });

    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Get Prisma client instance
   */
  public getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Setup Prisma event listeners for logging
   */
  private setupEventListeners(): void {
    this.prisma.$on('query', (e) => {
      if (config.NODE_ENV === 'development') {
        dbLogger.debug('Database Query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
          timestamp: e.timestamp,
        });
      }
    });

    this.prisma.$on('error', (e) => {
      dbLogger.error('Database Error', {
        message: e.message,
        timestamp: e.timestamp,
      });
    });

    this.prisma.$on('info', (e) => {
      dbLogger.info('Database Info', {
        message: e.message,
        timestamp: e.timestamp,
      });
    });

    this.prisma.$on('warn', (e) => {
      dbLogger.warn('Database Warning', {
        message: e.message,
        timestamp: e.timestamp,
      });
    });
  }

  /**
   * Connect to database
   */
  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      dbLogger.info('Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      dbLogger.error('Failed to connect to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.databaseError('Failed to connect to database');
    }
  }

  /**
   * Disconnect from database
   */
  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      dbLogger.info('Database disconnected successfully');
    } catch (error) {
      dbLogger.error('Failed to disconnect from database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if database is connected
   */
  public isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Perform health check
   */
  public async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      dbLogger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.databaseError('Database health check failed');
    }
  }

  /**
   * Execute transaction
   */
  public async transaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    try {
      const result = await this.prisma.$transaction(fn, {
        maxWait: 5000, // 5 seconds
        timeout: 10000, // 10 seconds
      });
      
      dbLogger.debug('Transaction completed successfully');
      return result;
    } catch (error) {
      dbLogger.error('Transaction failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw this.handlePrismaError(error);
      }
      
      throw ApiError.databaseError('Transaction failed');
    }
  }

  /**
   * Handle Prisma-specific errors
   */
  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): ApiError {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target as string[];
        const field = target ? target[0] : 'field';
        return ApiError.conflict(`${field} already exists`);
      
      case 'P2025':
        // Record not found
        return ApiError.notFound('Record not found');
      
      case 'P2003':
        // Foreign key constraint violation
        return ApiError.badRequest('Invalid reference to related record');
      
      case 'P2004':
        // Constraint violation
        return ApiError.badRequest('Data constraint violation');
      
      case 'P2011':
        // Null constraint violation
        return ApiError.badRequest('Required field is missing');
      
      case 'P2012':
        // Missing required value
        return ApiError.badRequest('Missing required value');
      
      case 'P2013':
        // Missing required argument
        return ApiError.badRequest('Missing required argument');
      
      case 'P2014':
        // Invalid ID
        return ApiError.badRequest('Invalid ID provided');
      
      case 'P2015':
        // Related record not found
        return ApiError.notFound('Related record not found');
      
      case 'P2016':
        // Query interpretation error
        return ApiError.badRequest('Invalid query parameters');
      
      case 'P2017':
        // Records not connected
        return ApiError.badRequest('Records are not connected');
      
      case 'P2018':
        // Required connected records not found
        return ApiError.notFound('Required connected records not found');
      
      case 'P2019':
        // Input error
        return ApiError.badRequest('Invalid input data');
      
      case 'P2020':
        // Value out of range
        return ApiError.badRequest('Value out of range');
      
      case 'P2021':
        // Table does not exist
        return ApiError.internalServerError('Database schema error');
      
      case 'P2022':
        // Column does not exist
        return ApiError.internalServerError('Database schema error');
      
      case 'P2023':
        // Inconsistent column data
        return ApiError.badRequest('Inconsistent data provided');
      
      case 'P2024':
        // Connection timeout
        return ApiError.serviceUnavailable('Database connection timeout');
      
      case 'P2027':
        // Multiple errors
        return ApiError.badRequest('Multiple validation errors occurred');
      
      default:
        dbLogger.error('Unhandled Prisma error', {
          code: error.code,
          message: error.message,
          meta: error.meta,
        });
        return ApiError.databaseError('Database operation failed');
    }
  }

  /**
   * Get database metrics
   */
  public async getMetrics(): Promise<{
    activeConnections: number;
    totalQueries: number;
    avgQueryTime: number;
  }> {
    try {
      // This is a simplified metrics implementation
      // In production, you might want to use Prisma metrics or external monitoring
      const metrics = await this.prisma.$queryRaw<Array<{
        active_connections: number;
      }>>`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;

      return {
        activeConnections: metrics[0]?.active_connections || 0,
        totalQueries: 0, // Would need to implement query counting
        avgQueryTime: 0, // Would need to implement query time tracking
      };
    } catch (error) {
      dbLogger.error('Failed to get database metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.databaseError('Failed to get database metrics');
    }
  }

  /**
   * Execute raw query with error handling
   */
  public async executeRaw<T = any>(query: string, params?: any[]): Promise<T> {
    try {
      const result = await this.prisma.$queryRawUnsafe<T>(query, ...(params || []));
      dbLogger.debug('Raw query executed successfully', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      });
      return result;
    } catch (error) {
      dbLogger.error('Raw query execution failed', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw this.handlePrismaError(error);
      }
      
      throw ApiError.databaseError('Query execution failed');
    }
  }

  /**
   * Batch operations with transaction
   */
  public async batchOperation<T>(
    operations: Array<Promise<T>>
  ): Promise<T[]> {
    try {
      const results = await this.prisma.$transaction(operations, {
        maxWait: 10000, // 10 seconds
        timeout: 30000, // 30 seconds
      });
      
      dbLogger.debug('Batch operation completed successfully', {
        operationCount: operations.length,
      });
      
      return results;
    } catch (error) {
      dbLogger.error('Batch operation failed', {
        operationCount: operations.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw this.handlePrismaError(error);
      }
      
      throw ApiError.databaseError('Batch operation failed');
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
export default databaseService;