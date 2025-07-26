import { Request, Response, NextFunction } from 'express';
import { apiLogger } from '@/utils/logger';
import { config } from '@/config/config';
import crypto from 'crypto';

/**
 * Extended Request interface to include timing and request ID
 */
export interface LoggedRequest extends Request {
  startTime?: number;
  requestId?: string;
}

/**
 * Request logging middleware
 * Logs incoming requests with detailed information
 */
export const logRequest = (
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  req.requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  
  // Record start time for performance measurement
  req.startTime = Date.now();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  // Extract request information
  const requestInfo: {
    requestId: string;
    method: string;
    url: string;
    path: string;
    query: any;
    ip: string;
    userAgent?: string;
    referer?: string;
    contentType?: string;
    contentLength?: string;
    acceptLanguage?: string;
    timestamp: string;
    body?: any;
  } = {
    requestId: req.requestId!,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: getClientIP(req),
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    acceptLanguage: req.get('Accept-Language'),
    timestamp: new Date().toISOString(),
  };
  
  // Log request body for non-GET requests (excluding sensitive data)
  if (req.method !== 'GET' && req.body) {
    requestInfo.body = sanitizeRequestBody(req.body, req.path);
  }
  
  // Log the incoming request
  apiLogger.info('Incoming request', requestInfo);
  
  // Log response when it finishes
  const originalSend = res.send;
  res.send = function(body: any) {
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    const responseInfo = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      message: res.statusMessage,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length'),
      ip: getClientIP(req),
    };
    
    // Log response based on status code
    if (res.statusCode >= 500) {
      apiLogger.error('Request completed with server error', responseInfo);
    } else if (res.statusCode >= 400) {
      apiLogger.warn('Request completed with client error', {
        ...responseInfo,
        error: body?.error || 'Unknown client error',
        code: body?.code,
        message: body?.message,
        module: body?.module || 'unknown',
        endpoint: req.path
      });
    } else {
      apiLogger.info('Request completed successfully', responseInfo);
    }
    
    // Log performance metrics for slow requests
    if (responseTime > config.SLOW_REQUEST_THRESHOLD) {
      apiLogger.warn('Slow request detected', {
        ...responseInfo,
        threshold: config.SLOW_REQUEST_THRESHOLD,
        userAgent: req.get('User-Agent'),
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Get client IP address from request
 */
function getClientIP(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body: any, path: string): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'auth',
    'credential',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
  ];
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Additional sanitization for specific endpoints
  if (path.includes('/auth/') || path.includes('/login')) {
    if (sanitized.email) {
      sanitized.email = maskEmail(sanitized.email);
    }
  }
  
  // Limit body size in logs
  const bodyString = JSON.stringify(sanitized);
  if (bodyString.length > 1000) {
    return {
      ...sanitized,
      _note: `Body truncated (original size: ${bodyString.length} chars)`,
    };
  }
  
  return sanitized;
}

/**
 * Mask email address for logging
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '[MASKED]';
  }
  
  const [username, domain] = email.split('@');
  if (!username) return '[MASKED]';
  const maskedUsername = username.length > 2 
    ? username.substring(0, 2) + '*'.repeat(username.length - 2)
    : '*'.repeat(username.length);
  
  return `${maskedUsername}@${domain ?? ''}`;
}

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    const performanceData = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
    
    // Log performance data
    if (duration > config.SLOW_REQUEST_THRESHOLD) {
      apiLogger.warn('Performance: Slow request', performanceData);
    } else {
      apiLogger.debug('Performance: Request completed', performanceData);
    }
  });
  
  next();
};

/**
 * Security logging middleware
 */
export const securityLogger = (
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void => {
  const securityHeaders = {
    'x-forwarded-for': req.get('X-Forwarded-For'),
    'x-real-ip': req.get('X-Real-IP'),
    'x-forwarded-proto': req.get('X-Forwarded-Proto'),
    'user-agent': req.get('User-Agent'),
    'origin': req.get('Origin'),
    'referer': req.get('Referer'),
  };
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript injection
    /data:.*base64/i,  // Data URI schemes
  ];
  
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(fullUrl) || 
    pattern.test(JSON.stringify(req.body || {})) ||
    pattern.test(JSON.stringify(req.query || {}))
  );
  
  if (isSuspicious) {
    apiLogger.warn('Suspicious request detected', {
      requestId: req.requestId,
      method: req.method,
      url: fullUrl,
      ip: getClientIP(req),
      headers: securityHeaders,
      body: sanitizeRequestBody(req.body, req.path),
      query: req.query,
    });
  }
  
  next();
};

/**
 * API usage tracking middleware
 */
export const apiUsageTracker = (
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers.authorization;
  
  res.on('finish', () => {
    const usageData = {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      endpoint: req.path,
      statusCode: res.statusCode,
      ip: getClientIP(req),
      userAgent: req.get('User-Agent'),
      responseTime: Date.now() - (req.startTime || Date.now()),
      ...(apiKey && { hasApiKey: true }),
      ...(authHeader && { hasAuthToken: true }),
    };
    
    apiLogger.info('API usage tracked', usageData);
  });
  
  next();
};

/**
 * Request size limiter with logging
 */
export const requestSizeLogger = (
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void => {
  const contentLength = parseInt(req.get('Content-Length') || '0', 10);
  
  if (contentLength > config.MAX_REQUEST_SIZE) {
    apiLogger.warn('Large request detected', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      contentLength,
      maxAllowed: config.MAX_REQUEST_SIZE,
      ip: getClientIP(req),
    });
  }
  
  next();
};

/**
 * Error boundary for request logging
 */
export const requestLoggerErrorHandler = (
  error: any,
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void => {
  apiLogger.error('Request logging error', {
    requestId: req.requestId,
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
  });
  
  // Continue with the request even if logging fails
  next();
};

export default logRequest;