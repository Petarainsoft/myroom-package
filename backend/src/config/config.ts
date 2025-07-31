import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3579'),
  HOST: z.string().default('localhost'),

  // Database Configuration
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.string().transform(Number).default('5432'),
  DATABASE_NAME: z.string().default('myroom_db'),
  DATABASE_USER: z.string().default('username'),
  DATABASE_PASSWORD: z.string().default('password'),

  // Redis Configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('86400'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // AWS Configuration
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS Access Key ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS Secret Access Key is required'),
  AWS_S3_BUCKET: z.string().min(1, 'AWS S3 Bucket is required'),
  AWS_S3_REGION: z.string().default('us-east-1'),
  AWS_CLOUDFRONT_DOMAIN: z.string().optional(),

  // API Configuration
  API_PREFIX: z.string().default('/api/v1'),
  API_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  API_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // CORS Configuration
  CORS_ORIGIN: z.string().default('http://localhost:5174'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),
  CORS_MAX_AGE: z.string().transform(Number).default('86400'),
  CORS_PREFLIGHT_CONTINUE: z.string().transform(val => val === 'true').default('false'),
  CORS_OPTIONS_SUCCESS_STATUS: z.string().transform(Number).default('204'),

  // File Upload Configuration
  MAX_FILE_SIZE: z.string().transform(Number).default('104857600'), // 100MB
  ALLOWED_FILE_TYPES: z.string().default('.glb,.gltf'),
  ALLOWED_IMAGE_TYPES: z.string().default('.jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff'),
  ALLOWED_TEXTURE_TYPES: z.string().default('.jpg,.jpeg,.png,.webp,.exr,.hdr,.tga,.dds'),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/myroom.log'),
  LOG_MAX_SIZE: z.string().default('10m'),
  LOG_MAX_FILES: z.string().transform(Number).default('5'),

  // Security Configuration
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  API_KEY_LENGTH: z.string().transform(Number).default('32'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),

  // Request/Performance Thresholds
  SLOW_REQUEST_THRESHOLD: z.string().transform(Number).default('1000'), // 1000ms
  MAX_REQUEST_SIZE: z.string().transform(Number).default('10485760'), // 10MB

  // Email Configuration (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().optional(),
  FROM_NAME: z.string().optional(),

  // Monitoring Configuration
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default('30000'),
  METRICS_ENABLED: z.string().transform(val => val === 'true').default('true'),
  METRICS_PORT: z.string().transform(Number).default('9090'),

  // Cache Configuration
  CACHE_TTL_DEFAULT: z.string().transform(Number).default('300'), // 5 minutes
  CACHE_TTL_API_KEY: z.string().transform(Number).default('300'),
  CACHE_TTL_DEVELOPER: z.string().transform(Number).default('60'),
  CACHE_TTL_RESOURCE: z.string().transform(Number).default('3600'), // 1 hour
  CACHE_TTL_PERMISSION: z.string().transform(Number).default('300'),

  // Pagination Configuration
  DEFAULT_PAGE_SIZE: z.string().transform(Number).default('20'),
  MAX_PAGE_SIZE: z.string().transform(Number).default('100'),

  // Feature Flags
  FEATURE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  FEATURE_WEBHOOKS: z.string().transform(val => val === 'true').default('false'),
  FEATURE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
  FEATURE_CACHING: z.string().transform(val => val === 'true').default('true'),

  // Development Configuration
  DEBUG: z.string().optional(),
  DEBUG_SQL: z.string().transform(val => val === 'true').default('false'),
  SWAGGER_ENABLED: z.string().transform(val => val === 'true').default('true'),

  // Production Configuration
  TRUST_PROXY: z.string().transform(val => val === 'true').default('false'),
  SECURE_COOKIES: z.string().transform(val => val === 'true').default('false'),
  HTTPS_ONLY: z.string().transform(val => val === 'true').default('false'),
});

// Validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const config = parseResult.data;

// Derived configurations
export const derivedConfig = {
  // Database
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production',
  isTest: config.NODE_ENV === 'test',

  // File types arrays
  allowedFileTypes: config.ALLOWED_FILE_TYPES.split(',').map(type => type.trim()),
  allowedImageTypes: config.ALLOWED_IMAGE_TYPES.split(',').map(type => type.trim()),
  allowedTextureTypes: config.ALLOWED_TEXTURE_TYPES.split(',').map(type => type.trim()),

  // CORS origins array
  corsOrigins: config.CORS_ORIGIN.split(',').map(origin => origin.trim()),

  // S3 configuration
  s3Config: {
    region: config.AWS_S3_REGION,
    bucket: config.AWS_S3_BUCKET,
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    cloudfrontDomain: config.AWS_CLOUDFRONT_DOMAIN,
  },

  // Redis configuration
  redisConfig: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB,
    url: config.REDIS_URL,
  },

  // JWT configuration
  jwtConfig: {
    secret: config.JWT_SECRET,
    expiresIn: config.JWT_EXPIRES_IN,
    refreshSecret: config.JWT_REFRESH_SECRET,
    refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
  },

  // Cache TTL configuration
  cacheTTL: {
    default: config.CACHE_TTL_DEFAULT,
    apiKey: config.CACHE_TTL_API_KEY,
    developer: config.CACHE_TTL_DEVELOPER,
    resource: config.CACHE_TTL_RESOURCE,
    permission: config.CACHE_TTL_PERMISSION,
  },

  // Pagination configuration
  pagination: {
    defaultPageSize: config.DEFAULT_PAGE_SIZE,
    maxPageSize: config.MAX_PAGE_SIZE,
  },

  // Feature flags
  features: {
    analytics: config.FEATURE_ANALYTICS,
    webhooks: config.FEATURE_WEBHOOKS,
    rateLimiting: config.FEATURE_RATE_LIMITING,
    caching: config.FEATURE_CACHING,
  },

  // Email configuration
  emailConfig: {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
    fromEmail: config.FROM_EMAIL,
    fromName: config.FROM_NAME,
  },
};

// Configuration validation for production
if (config.NODE_ENV === 'production') {
  const requiredProdVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
  ];

  const missingVars = requiredProdVars.filter(varName => {
    const value = config[varName as keyof typeof config];
    return !value || (typeof value === 'string' && value.includes('change-this'));
  });

  if (missingVars.length > 0) {
    console.error('❌ Missing or invalid production environment variables:');
    console.error(missingVars.join(', '));
    process.exit(1);
  }
}

// Log configuration summary
if (config.NODE_ENV === 'development') {
  console.log('🔧 Configuration loaded:');
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Port: ${config.PORT}`);
  console.log(`   Database: ${config.DATABASE_NAME}`);
  console.log(`   Redis: ${config.REDIS_HOST}:${config.REDIS_PORT}`);
  console.log(`   S3 Bucket: ${config.AWS_S3_BUCKET}`);
  console.log(`   Features: ${Object.entries(derivedConfig.features).filter(([, enabled]) => enabled).map(([name]) => name).join(', ')}`);
}

export default config;