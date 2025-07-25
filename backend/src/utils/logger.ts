import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '@/config/config';

// Ensure logs directory exists
const logsDir = path.dirname(config.LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport
if (config.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.LOG_LEVEL,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: logFormat,
      level: config.LOG_LEVEL,
    })
  );
}

// File transport for all environments except test
if (config.NODE_ENV !== 'test') {
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: config.LOG_FILE,
      format: logFormat,
      level: config.LOG_LEVEL,
      maxsize: parseSize(config.LOG_MAX_SIZE),
      maxFiles: config.LOG_MAX_FILES,
      tailable: true,
    })
  );

  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: logFormat,
      level: 'error',
      maxsize: parseSize(config.LOG_MAX_SIZE),
      maxFiles: config.LOG_MAX_FILES,
      tailable: true,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Helper function to parse size strings like '10m', '1g'
function parseSize(sizeStr: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    k: 1024,
    m: 1024 * 1024,
    g: 1024 * 1024 * 1024,
  };
  
  const match = sizeStr.toLowerCase().match(/^(\d+)([bkmg]?)$/);
  if (!match) {
    return 10 * 1024 * 1024; // Default 10MB
  }
  
  const [, size, unit] = match;
  return parseInt(size) * (units[unit] || 1);
}

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// Specific loggers for different parts of the application
export const dbLogger = createModuleLogger('database');
export const authLogger = createModuleLogger('auth');
export const apiLogger = createModuleLogger('api');
export const s3Logger = createModuleLogger('s3');
export const redisLogger = createModuleLogger('redis');
export const validationLogger = createModuleLogger('validation');

// Request logging helper
export const logRequest = (req: any, res: any, responseTime?: number) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
  };
  
  if (res.statusCode >= 400) {
    apiLogger.warn('HTTP Request', logData);
  } else {
    apiLogger.info('HTTP Request', logData);
  }
};

// Error logging helper
export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
  });
};

// Database operation logging
export const logDatabaseOperation = (operation: string, table: string, duration?: number, error?: Error) => {
  const logData = {
    operation,
    table,
    duration: duration ? `${duration}ms` : undefined,
  };
  
  if (error) {
    dbLogger.error('Database Operation Failed', {
      ...logData,
      error: error.message,
      stack: error.stack,
    });
  } else {
    dbLogger.info('Database Operation', logData);
  }
};

// Authentication logging
export const logAuthEvent = (event: string, userId?: string, details?: any) => {
  authLogger.info('Auth Event', {
    event,
    userId,
    ...details,
  });
};

// S3 operation logging
export const logS3Operation = (operation: string, bucket: string, key?: string, error?: Error) => {
  const logData = {
    operation,
    bucket,
    key,
  };
  
  if (error) {
    s3Logger.error('S3 Operation Failed', {
      ...logData,
      error: error.message,
    });
  } else {
    s3Logger.info('S3 Operation', logData);
  }
};

// Redis operation logging
export const logRedisOperation = (operation: string, key?: string, error?: Error) => {
  const logData = {
    operation,
    key,
  };
  
  if (error) {
    redisLogger.error('Redis Operation Failed', {
      ...logData,
      error: error.message,
    });
  } else {
    redisLogger.debug('Redis Operation', logData);
  }
};

// Validation error logging
export const logValidationError = (field: string, value: any, rule: string) => {
  validationLogger.warn('Validation Error', {
    field,
    value: typeof value === 'object' ? JSON.stringify(value) : value,
    rule,
  });
};

// Performance logging
export const logPerformance = (operation: string, duration: number, threshold: number = 1000) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    threshold: `${threshold}ms`,
  };
  
  if (duration > threshold) {
    logger.warn('Slow Operation Detected', logData);
  } else {
    logger.debug('Performance Metric', logData);
  }
};

// Security event logging
export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) => {
  const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 
                   severity === 'medium' ? 'warn' : 'info';
  
  logger.log(logLevel, 'Security Event', {
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Business logic logging
export const logBusinessEvent = (event: string, entityType: string, entityId: string, details?: any) => {
  logger.info('Business Event', {
    event,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Export default logger
export default logger;