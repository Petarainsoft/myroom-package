// Room Management Types
// This file contains TypeScript types for room resource management

import { Prisma } from '@prisma/client';

// Room Resource Types
export interface RoomResource {
  id: string;
  name: string;
  description?: string;

  // File information
  s3Url: string;
  s3Key: string;
  fileSize: bigint;
  fileType: string;
  mimeType?: string;
  checksum?: string;

  // Room specific fields
  roomTypeId: string;

  // Versioning and identification
  version: string;
  uniquePath?: string;
  resourceId?: string;

  // Pricing and access
  isPremium: boolean;
  isFree: boolean;
  price?: number;

  // Status and metadata
  status: RoomStatus;
  metadata?: Prisma.JsonValue;
  tags: string;
  keywords: string;

  // Audit fields
  uploadedByAdminId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Room Usage Types
export interface RoomUsage {
  id: string;
  roomResourceId?: string;
  developerId?: string;
  projectId?: string;
  action: RoomUsageAction;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Prisma.JsonValue;
  createdAt: Date;
}

// Developer Room Permission Types
export interface DeveloperRoomPermission {
  id: string;
  developerId: string;
  roomResourceId?: string;
  grantedAt: Date;
  expiresAt?: Date;
  isPaid: boolean;
  paidAmount?: number;
  grantedBy?: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enums

export enum RoomStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum RoomUsageAction {
  LOAD = 'LOAD',
  DOWNLOAD = 'DOWNLOAD',
  VIEW = 'VIEW',
  CUSTOMIZE = 'CUSTOMIZE',
  PURCHASE = 'PURCHASE',
}

// Request/Response Types
export interface CreateRoomRequest {
  name: string;
  description?: string;
  roomTypeId: string;
  version?: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium?: boolean;
  isFree?: boolean;
  price?: number;
  metadata?: Record<string, any>;
  tags?: string;
  keywords?: string;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  roomTypeId?: string;
  version?: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium?: boolean;
  isFree?: boolean;
  price?: number;
  status?: RoomStatus;
  metadata?: Record<string, any>;
  tags?: string;
  keywords?: string;
}

export interface RoomQuery {
  roomTypeId?: string;
  status?: RoomStatus;
  isPremium?: boolean;
  isFree?: boolean;
  search?: string;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'roomTypeId';
  sortOrder?: 'asc' | 'desc';
}

export interface RoomResponse {
  id: string;
  name: string;
  description?: string;
  s3Url: string;
  s3Key: string;
  roomTypeId: string;
  version: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium: boolean;
  isFree: boolean;
  price?: number;
  status: RoomStatus;
  metadata?: Record<string, any>;
  tags: string;
  keywords: string;
  fileSize: string; // Convert bigint to string for JSON
  fileType: string;
  mimeType?: string;
  uploadedByAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomResourceListResponse {
  data: RoomResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Load Options for including related data
export interface RoomLoadOptions {
  includeUsage?: boolean;
  includePermissions?: boolean;
  includeUploadedBy?: boolean;
}

// Room Resource with Relations
export type RoomResourceWithRelations = RoomResource & {
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
  usage?: RoomUsage[];
  permissions?: DeveloperRoomPermission[];
};

// Usage Tracking Types
export interface CreateRoomUsageRequest {
  roomResourceId?: string;
  developerId?: string;
  projectId?: string;
  action: RoomUsageAction;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface RoomUsageQuery {
  roomResourceId?: string;
  developerId?: string;
  projectId?: string;
  action?: RoomUsageAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// Permission Management Types
export interface GrantRoomPermissionRequest {
  developerId: string;
  roomResourceId: string;
  expiresAt?: Date;
  isPaid?: boolean;
  paidAmount?: number;
  grantedBy?: string;
  reason?: string;
}

export interface RoomPermissionQuery {
  developerId?: string;
  roomResourceId?: string;
  isPaid?: boolean;
  isExpired?: boolean;
  page?: number;
  limit?: number;
}

// Statistics Types
export interface RoomResourceStats {
  totalResources: number;
  totalByRoomType: Record<string, number>;
  totalByStatus: Record<string, number>;
  premiumResources: number;
  freeResources: number;
  totalUsage: number;
  totalPermissions: number;
}

export interface RoomUsageStats {
  totalUsage: number;
  usageByAction: Record<string, number>;
  usageByResource: Array<{
    resourceId: string;
    resourceName: string;
    count: number;
  }>;
  usageByDeveloper: Array<{
    developerId: string;
    developerName: string;
    count: number;
  }>;
}

// Error Types
export interface RoomResourceError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// File Upload Types
export interface RoomResourceFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface S3UploadResult {
  s3Url: string;
  s3Key: string;
  fileSize: number;
  checksum?: string;
}
