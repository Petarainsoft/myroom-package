import Redis, { RedisOptions } from 'ioredis';
import { config } from '@/config/config';
import { redisLogger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';

/**
 * Redis Service for caching and session management
 */
export class RedisService {
  private static instance: RedisService;
  private client: Redis;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {
    const redisOptions: RedisOptions = {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      db: config.REDIS_DB,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    this.client = new Redis(redisOptions);
    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Setup Redis event listeners
   */
  private setupEventListeners(): void {
    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      redisLogger.info('Redis connected successfully');
    });

    this.client.on('ready', () => {
      redisLogger.info('Redis is ready to receive commands');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      redisLogger.error('Redis connection error', {
        error: error.message,
        stack: error.stack,
      });
    });

    this.client.on('close', () => {
      this.isConnected = false;
      redisLogger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', (delay) => {
      this.reconnectAttempts++;
      redisLogger.info('Redis reconnecting', {
        attempt: this.reconnectAttempts,
        delay,
      });

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        redisLogger.error('Max Redis reconnection attempts reached');
        this.client.disconnect();
      }
    });

    this.client.on('end', () => {
      this.isConnected = false;
      redisLogger.info('Redis connection ended');
    });
  }

  /**
   * Connect to Redis
   */
  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      redisLogger.info('Redis connection established');
    } catch (error) {
      redisLogger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to connect to Redis');
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      redisLogger.info('Redis disconnected successfully');
    } catch (error) {
      redisLogger.error('Failed to disconnect from Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if Redis is connected
   */
  public isHealthy(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  /**
   * Perform health check
   */
  public async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const pong = await this.client.ping();
      if (pong === 'PONG') {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error('Invalid ping response');
    } catch (error) {
      redisLogger.error('Redis health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Redis health check failed');
    }
  }

  /**
   * Set a key-value pair
   */
  public async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      redisLogger.debug('Redis SET operation completed', {
        key,
        ttl,
        valueSize: serializedValue.length,
      });
    } catch (error) {
      redisLogger.error('Redis SET operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to set cache value');
    }
  }

  /**
   * Set a key-value pair with expiration
   */
  public async setex(key: string, ttl: number, value: any): Promise<void> {
    return this.set(key, value, ttl);
  }

  /**
   * Get a value by key
   */
  public async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      
      if (value === null) {
        redisLogger.debug('Redis GET operation - key not found', { key });
        return null;
      }
      
      const parsedValue = JSON.parse(value);
      redisLogger.debug('Redis GET operation completed', {
        key,
        valueSize: value.length,
      });
      
      return parsedValue;
    } catch (error) {
      redisLogger.error('Redis GET operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to get cache value');
    }
  }

  /**
   * Delete a key
   */
  public async del(key: string): Promise<number> {
    try {
      const result = await this.client.del(key);
      redisLogger.debug('Redis DEL operation completed', {
        key,
        deleted: result,
      });
      return result;
    } catch (error) {
      redisLogger.error('Redis DEL operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to delete cache value');
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      redisLogger.error('Redis EXISTS operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to check key existence');
    }
  }

  /**
   * Set expiration for a key
   */
  public async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      redisLogger.error('Redis EXPIRE operation failed', {
        key,
        ttl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to set key expiration');
    }
  }

  /**
   * Get time to live for a key
   */
  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      redisLogger.error('Redis TTL operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to get key TTL');
    }
  }

  /**
   * Increment a numeric value
   */
  public async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      redisLogger.error('Redis INCR operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to increment value');
    }
  }

  /**
   * Increment a numeric value by amount
   */
  public async incrby(key: string, amount: number): Promise<number> {
    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      redisLogger.error('Redis INCRBY operation failed', {
        key,
        amount,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to increment value by amount');
    }
  }

  /**
   * Get multiple keys
   */
  public async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.client.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      redisLogger.error('Redis MGET operation failed', {
        keys,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to get multiple cache values');
    }
  }

  /**
   * Set multiple key-value pairs
   */
  public async mset(keyValuePairs: Record<string, any>): Promise<void> {
    try {
      const serializedPairs: string[] = [];
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs.push(key, JSON.stringify(value));
      }
      
      await this.client.mset(...serializedPairs);
      
      redisLogger.debug('Redis MSET operation completed', {
        keyCount: Object.keys(keyValuePairs).length,
      });
    } catch (error) {
      redisLogger.error('Redis MSET operation failed', {
        keyCount: Object.keys(keyValuePairs).length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to set multiple cache values');
    }
  }

  /**
   * Get keys matching a pattern
   */
  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      redisLogger.error('Redis KEYS operation failed', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to get keys by pattern');
    }
  }

  /**
   * Flush all keys in current database
   */
  public async flushdb(): Promise<void> {
    try {
      await this.client.flushdb();
      redisLogger.info('Redis database flushed');
    } catch (error) {
      redisLogger.error('Redis FLUSHDB operation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to flush database');
    }
  }

  /**
   * Get Redis info
   */
  public async info(section?: string): Promise<string> {
    try {
      return await this.client.info(section);
    } catch (error) {
      redisLogger.error('Redis INFO operation failed', {
        section,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to get Redis info');
    }
  }

  /**
   * Execute Redis pipeline
   */
  public async pipeline(commands: Array<[string, ...any[]]>): Promise<any[]> {
    try {
      const pipeline = this.client.pipeline();
      
      commands.forEach(([command, ...args]) => {
        (pipeline as any)[command](...args);
      });
      
      const results = await pipeline.exec();
      
      redisLogger.debug('Redis pipeline executed', {
        commandCount: commands.length,
      });
      
      return results?.map(([error, result]) => {
        if (error) throw error;
        return result;
      }) || [];
    } catch (error) {
      redisLogger.error('Redis pipeline execution failed', {
        commandCount: commands.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to execute Redis pipeline');
    }
  }

  /**
   * Cache helper methods
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
      
      // If not in cache, fetch and cache
      const value = await fetcher();
      await this.set(key, value, ttl);
      
      return value;
    } catch (error) {
      redisLogger.error('Cache getOrSet operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to get or set cache value');
    }
  }

  /**
   * Invalidate cache by pattern
   */
  public async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      const deleted = await this.client.del(...keys);
      
      redisLogger.info('Cache invalidated by pattern', {
        pattern,
        keysDeleted: deleted,
      });
      
      return deleted;
    } catch (error) {
      redisLogger.error('Cache pattern invalidation failed', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.cacheError('Failed to invalidate cache by pattern');
    }
  }
}

// Export singleton instance
export const redisService = RedisService.getInstance();
export default redisService;