import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const uuidSchema = z.string().min(1, 'ID is required');
const urlSchema = z.string().url('Invalid URL format');
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// File upload schemas
export const fileUploadSchema = z.object({
  originalname: z.string().min(1, 'Filename is required'),
  mimetype: z.string().min(1, 'MIME type is required'),
  size: z.number().int().min(1, 'File size must be greater than 0'),
  buffer: z.instanceof(Buffer),
});

// Admin schemas
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const adminCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']).default('ADMIN'),
});

export const adminUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters').optional(),
  email: emailSchema.optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const adminChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Developer schemas
export const developerCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: z.string().max(100, 'Company name cannot exceed 100 characters').optional(),
  website: urlSchema.optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']).default('FREE'),
});

export const developerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  company: z.string().max(100, 'Company name cannot exceed 100 characters').optional(),
  website: urlSchema.optional(),
});

export const developerUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters').optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  company: z.string().max(100, 'Company name cannot exceed 100 characters').optional(),
  website: urlSchema.optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
});

export const developerQuerySchema = z.object({
  search: z.string().optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  ...paginationSchema.shape,
});

// Project schemas
export const projectCreateSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100, 'Project name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  developerId: uuidSchema,
});

// For JWT-authenticated developer endpoints the developerId is taken from token.
export const projectCreateJwtSchema = projectCreateSchema.omit({ developerId: true });

export const projectUpdateSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100, 'Project name cannot exceed 100 characters').optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const projectQuerySchema = z.object({
  search: z.string().optional(),
  developerId: uuidSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  ...paginationSchema.shape,
});

// API Key schemas
export const apiKeyCreateSchema = z.object({
  name: z.string().min(2, 'API key name must be at least 2 characters').max(100, 'API key name cannot exceed 100 characters'),
  projectId: uuidSchema,
  scopes: z.array(z.enum(['developer:read', 'developer:write', 'project:read', 'project:write', 'apikey:read', 'resource:read', 'manifest:read', 'resources:read', 'avatar:read', 'manifests:read'])).min(1, 'At least one scope is required'),
  expiresAt: z.string().datetime().optional(),
});

export const apiKeyUpdateSchema = z.object({
  name: z.string().min(2, 'API key name must be at least 2 characters').max(100, 'API key name cannot exceed 100 characters').optional(),
  scopes: z.array(z.enum(['developer:read', 'developer:write', 'project:read', 'project:write', 'apikey:read', 'resource:read', 'manifest:read', 'manifest:write', 'resources:read', 'avatar:read', 'manifests:read'])).min(1, 'At least one scope is required').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'REVOKED']).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const apiKeyQuerySchema = z.object({
  search: z.string().optional(),
  projectId: uuidSchema.optional(),
  developerId: uuidSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'REVOKED']).optional(),
  ...paginationSchema.shape,
});

// Resource Category schemas
export const resourceCategoryCreateSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  isPremium: z.coerce.boolean().default(false),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  metadata: z.record(z.string()).optional(),
  // Hierarchy fields
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0).optional(),
  isActive: z.boolean().default(true).optional(),
});

export const resourceCategoryUpdateSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name cannot exceed 100 characters').optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  isPremium: z.coerce.boolean().optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  metadata: z.record(z.string()).optional(),
  // Hierarchy fields
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const resourceCategoryQuerySchema = z.object({
  search: z.string().optional(),
  isPremium: z.coerce.boolean().optional(),
  // Future hierarchy fields (not in DB yet)
  parentId: z.string().optional(),
  level: z.number().int().min(0).max(10).optional(),
  isActive: z.boolean().optional(),
  includeChildren: z.boolean().default(false).optional(),
  ...paginationSchema.shape,
});

// Resource schemas
export const resourceCreateSchema = z.object({
  name: z.string().min(1, 'Resource name is required').max(255, 'Resource name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  categoryId: uuidSchema,
  ownerProjectId: uuidSchema.optional(),
  accessPolicy: z.enum(['PUBLIC', 'PRIVATE', 'PROJECT_ONLY', 'DEVELOPERS_ONLY']).optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
  version: z.string().optional(),
  isPremium: z.coerce.boolean().optional(),
});

export const resourceUpdateSchema = z.object({
  name: z.string().min(1, 'Resource name is required').max(255, 'Resource name cannot exceed 255 characters').optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const resourceQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: uuidSchema.optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  ...paginationSchema.shape,
});

// Admin-specific: allow includeDescendants flag (string 'true'|'false')
export const adminResourceQuerySchema = resourceQuerySchema.extend({
  includeDescendants: z.string().optional(),
});

export const resourceSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query cannot exceed 100 characters'),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  categoryId: uuidSchema.optional(),
  ...paginationSchema.shape,
});



// Manifest schemas
export const manifestCreateSchema = z.object({
  name: z.string().min(1, 'Manifest name is required').max(255, 'Manifest name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  version: z.string().min(1, 'Version is required').max(50, 'Version cannot exceed 50 characters'),
  projectId: uuidSchema,
  resources: z.array(uuidSchema).min(1, 'At least one resource is required'),
  metadata: z.record(z.string()).optional(),
});

export const manifestUpdateSchema = z.object({
  name: z.string().min(1, 'Manifest name is required').max(255, 'Manifest name cannot exceed 255 characters').optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  version: z.string().min(1, 'Version is required').max(50, 'Version cannot exceed 50 characters').optional(),
  resources: z.array(uuidSchema).min(1, 'At least one resource is required').optional(),
  metadata: z.record(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const manifestQuerySchema = z.object({
  search: z.string().optional(),
  projectId: uuidSchema.optional(),
  version: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  ...paginationSchema.shape,
});

// File upload specific schemas
export const uploadResourceSchema = z.object({
  name: z.string().min(1, 'Resource name is required').max(255, 'Resource name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  categoryId: uuidSchema,
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
});

export const bulkUploadSchema = z.object({
  categoryId: uuidSchema,
  resources: z.array(z.object({
    name: z.string().min(1, 'Resource name is required').max(255, 'Resource name cannot exceed 255 characters'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string()).optional(),
  })).min(1, 'At least one resource is required').max(10, 'Cannot upload more than 10 resources at once'),
});

// Search schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query cannot exceed 100 characters'),
  type: z.enum(['resources', 'manifests', 'developers', 'projects']).optional(),
  filters: z.record(z.string()).optional(),
  ...paginationSchema.shape,
});

// Analytics schemas
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  metrics: z.array(z.enum(['requests', 'downloads', 'uploads', 'storage', 'bandwidth'])).optional(),
  developerId: uuidSchema.optional(),
  projectId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'Start date must be before or equal to end date',
  path: ['endDate'],
});

// Health check schema
export const healthCheckSchema = z.object({
  service: z.enum(['database', 'redis', 's3', 'all']).optional(),
});

// Webhook schemas
export const webhookCreateSchema = z.object({
  url: urlSchema,
  events: z.array(z.enum(['resource.created', 'resource.updated', 'resource.deleted', 'manifest.created', 'manifest.updated'])).min(1, 'At least one event is required'),
  secret: z.string().min(16, 'Webhook secret must be at least 16 characters').optional(),
  active: z.boolean().default(true),
});

export const webhookUpdateSchema = z.object({
  url: urlSchema.optional(),
  events: z.array(z.enum(['resource.created', 'resource.updated', 'resource.deleted', 'manifest.created', 'manifest.updated'])).min(1, 'At least one event is required').optional(),
  secret: z.string().min(16, 'Webhook secret must be at least 16 characters').optional(),
  active: z.boolean().optional(),
});

// Rate limiting schemas
export const rateLimitConfigSchema = z.object({
  windowMs: z.number().int().min(1000, 'Window must be at least 1 second').max(3600000, 'Window cannot exceed 1 hour'),
  maxRequests: z.number().int().min(1, 'Max requests must be at least 1').max(10000, 'Max requests cannot exceed 10000'),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
});

// Export all schemas for easy access
export const schemas = {
  // Common
  pagination: paginationSchema,
  fileUpload: fileUploadSchema,
  search: searchSchema,
  analytics: analyticsQuerySchema,
  healthCheck: healthCheckSchema,
  rateLimitConfig: rateLimitConfigSchema,
  
  // Admin
  adminLogin: adminLoginSchema,
  adminCreate: adminCreateSchema,
  adminUpdate: adminUpdateSchema,
  adminChangePassword: adminChangePasswordSchema,
  
  // Developer
  developerCreate: developerCreateSchema,
  developerRegister: developerRegisterSchema,
  developerLogin: adminLoginSchema, // Same structure as admin login (email + password)
  developerUpdate: developerUpdateSchema,
  developerQuery: developerQuerySchema,
  
  // Project
  projectCreate: projectCreateSchema,
  projectCreateJwt: projectCreateJwtSchema,
  projectUpdate: projectUpdateSchema,
  projectQuery: projectQuerySchema,
  
  // API Key
  apiKeyCreate: apiKeyCreateSchema,
  apiKeyUpdate: apiKeyUpdateSchema,
  apiKeyQuery: apiKeyQuerySchema,
  
  // Resource Category
  resourceCategoryCreate: resourceCategoryCreateSchema,
  resourceCategoryUpdate: resourceCategoryUpdateSchema,
  resourceCategoryQuery: resourceCategoryQuerySchema,
  
  // Resource
  resourceCreate: resourceCreateSchema,
  resourceUpdate: resourceUpdateSchema,
  resourceQuery: resourceQuerySchema,
  adminResourceQuery: adminResourceQuerySchema,
  resourceSearch: resourceSearchSchema,
  uploadResource: uploadResourceSchema,
  bulkUpload: bulkUploadSchema,
  

  
  // Manifest
  manifestCreate: manifestCreateSchema,
  manifestUpdate: manifestUpdateSchema,
  manifestQuery: manifestQuerySchema,
  
  // Webhook
  webhookCreate: webhookCreateSchema,
  webhookUpdate: webhookUpdateSchema,
};

export default schemas;