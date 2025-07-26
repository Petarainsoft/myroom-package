// Avatar System TypeScript Types and Interfaces
// Defines types for the avatar management system

export enum AvatarGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNISEX = 'UNISEX',
}

export enum AvatarPartType {
  BODY = 'BODY',
  HAIR = 'HAIR',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  SHOES = 'SHOES',
  ACCESSORY = 'ACCESSORY',
  FULLSET = 'FULLSET',
}

export enum AvatarStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum AvatarUsageAction {
  LOAD = 'LOAD',
  CUSTOMIZE = 'CUSTOMIZE',
  SAVE = 'SAVE',
  EXPORT = 'EXPORT',
}

export enum AvatarCategoryType {
  GENDER = 'gender',
  PART_TYPE = 'part_type',
}

// Base interfaces
export interface AvatarCategory {
  id: string;
  name: string;
  description?: string;
  categoryType: AvatarCategoryType;
  parentId?: string;
  level: number;
  path?: string;
  sortOrder: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  parent?: AvatarCategory;
  children?: AvatarCategory[];
  avatarResources?: Avatar[];
}

export interface Avatar {
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

  // Avatar specific fields
  gender: AvatarGender;
  partType: AvatarPartType;
  categoryId: string;

  // Versioning and identification
  version: string;
  uniquePath?: string;
  resourceId?: string; // Legacy compatibility

  // Pricing and access
  isPremium: boolean;
  isFree: boolean;
  price?: number;

  // Status and metadata
  status: AvatarStatus;
  metadata?: Record<string, any>;
  tags: string;
  keywords: string;

  // Audit fields
  uploadedByAdminId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Relations
  category?: AvatarCategory;
  uploadedBy?: any; // Admin type
  usage?: AvatarUsage[];
  permissions?: DeveloperAvatarPermission[];
}

export interface AvatarUsage {
  id: string;
  avatarResourceId?: string;
  developerId?: string;
  projectId?: string;
  action: AvatarUsageAction;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  createdAt: Date;

  // Relations
  avatarResource?: Avatar;
  developer?: any; // Developer type
  project?: any; // Project type
}

export interface DeveloperAvatarPermission {
  id: string;
  developerId: string;
  avatarResourceId?: string;
  grantedAt: Date;
  expiresAt?: Date;
  isPaid: boolean;
  paidAmount?: number;
  grantedBy?: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  developer?: any; // Developer type
  avatarResource?: Avatar;
}

// Avatar Configuration Types
export interface AvatarConfiguration {
  body?: string;
  hair?: string;
  top?: string;
  bottom?: string;
  shoes?: string;
  accessory?: string;
  fullset?: string;
  colors?: AvatarColors;
  materials?: AvatarMaterials;
  animations?: string;
}

export interface AvatarColors {
  hair?: string;
  skin?: string;
  top?: string;
  bottom?: string;
  shoes?: string;
  accessory?: string;
  eyes?: string;
}

export interface AvatarMaterials {
  hair?: string;
  skin?: string;
  top?: string;
  bottom?: string;
  shoes?: string;
  accessory?: string;
}

// API Request/Response Types
export interface CreateAvatarRequest {
  name: string;
  description?: string;
  gender: AvatarGender;
  partType: AvatarPartType;
  categoryId: string;
  file: File | Buffer;
  version?: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium?: boolean;
  isFree?: boolean;
  price?: number;
  tags?: string;
  keywords?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAvatarRequest {
  name?: string;
  description?: string;
  categoryId?: string;
  version?: string;
  isPremium?: boolean;
  isFree?: boolean;
  price?: number;
  status?: AvatarStatus;
  tags?: string;
  keywords?: string;
  metadata?: Record<string, any>;
}

export interface AvatarQuery {
  gender?: AvatarGender;
  partType?: AvatarPartType;
  categoryId?: string;
  status?: AvatarStatus;
  isPremium?: boolean;
  isFree?: boolean;
  tags?: string;
  keywords?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

export interface AvatarResponse {
  id: string;
  name: string;
  description?: string;
  s3Url: string;
  s3Key: string;
  fileSize: string; // bigint as string
  fileType: string;
  gender: AvatarGender;
  partType: AvatarPartType;
  version: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium: boolean;
  isFree: boolean;
  price?: number;
  status: AvatarStatus;
  tags: string;
  keywords: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    path?: string;
  };
}

export interface AvatarCategoryResponse {
  id: string;
  name: string;
  description?: string;
  categoryType: AvatarCategoryType;
  level: number;
  path?: string;
  sortOrder: number;
  isActive: boolean;
  children?: AvatarCategoryResponse[];
}

// Utility Types
export type AvatarPartConfig = {
  [K in AvatarPartType]?: {
    resourceId: string;
    config?: Record<string, any>;
  };
};

export interface AvatarCustomizationState {
  gender: AvatarGender;
  parts: AvatarPartConfig;
  colors: AvatarColors;
  materials?: AvatarMaterials;
}

export interface AvatarLoadOptions {
  includeCategory?: boolean;
  includeUsage?: boolean;
  includePermissions?: boolean;
}

// Error Types
export interface AvatarError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class AvatarValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'AvatarValidationError';
  }
}

export class AvatarNotFoundError extends Error {
  constructor(id: string, type: 'resource' | 'category') {
    super(`Avatar ${type} with ID ${id} not found`);
    this.name = 'AvatarNotFoundError';
  }
}

export class AvatarPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvatarPermissionError';
  }
}
