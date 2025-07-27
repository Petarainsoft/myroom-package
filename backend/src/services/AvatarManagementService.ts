import { PrismaClient } from '@prisma/client';
import {
  Avatar,
  AvatarCategory,
  AvatarGender,
  AvatarPartType,
  AvatarStatus,
  AvatarCategoryType,
  CreateAvatarRequest,
  UpdateAvatarRequest,
  AvatarQuery,
  AvatarResponse,
  AvatarCategoryResponse,
  AvatarLoadOptions,
  AvatarNotFoundError,
  AvatarValidationError,
  AvatarPermissionError,
} from '../types/avatar';
import { S3Service } from './S3Service';
import { logger } from '../utils/logger';

export class AvatarManagementService {
  private prisma: PrismaClient;
  private s3Service: S3Service;
  private logger: any;

  constructor(prisma: PrismaClient, s3Service: S3Service, logger: any) {
    this.prisma = prisma;
    this.s3Service = s3Service;
    this.logger = logger;
  }

  // Avatar Categories Management
  async getAvatarCategories(includeChildren = true): Promise<AvatarCategoryResponse[]> {
    try {
      const categories = await this.prisma.avatarCategory.findMany({
        where: {
          isActive: true,
          parentId: null, // Get top-level categories
        },
        include: {
          children: includeChildren
            ? {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
              }
            : false,
        },
        orderBy: { sortOrder: 'asc' },
      });

      return categories.map((category: any) => this.mapCategoryToResponse(category));
    } catch (error) {
      this.logger.error('Error fetching avatar categories:', error);
      throw error;
    }
  }

  async getAvatarCategoriesByGender(gender: AvatarGender): Promise<AvatarCategoryResponse[]> {
    try {
      const genderCategory = await this.prisma.avatarCategory.findFirst({
        where: {
          name: {
            equals: gender,
            mode: 'insensitive',
          },
          categoryType: AvatarCategoryType.GENDER,
          isActive: true,
        },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!genderCategory) {
        throw new AvatarNotFoundError(gender, 'category');
      }

      return genderCategory.children?.map((child: any) => this.mapCategoryToResponse(child)) || [];
    } catch (error) {
      this.logger.error(`Error fetching avatar categories for gender ${gender}:`, error);
      throw error;
    }
  }

  // Avatar Resources Management
  async createAvatar(request: CreateAvatarRequest, adminId: string): Promise<AvatarResponse> {
    try {
      // Validate request
      this.validateCreateAvatarResourceRequest(request);

      // Check if unique path already exists
      if (request.resourceId) {
        const existing = await this.prisma.avatar.findUnique({
          where: { resourceId: request.resourceId },
        });
        if (existing) {
          throw new AvatarValidationError(
            'Avatar resource with this resourceId already exists',
            'resourceId',
            request.resourceId
          );
        }
      }

      // Generate resourceId using the 'Path' column of avatar_categories and the avatar part name
      const category = await this.prisma.avatarCategory.findUnique({
        where: { id: request.categoryId },
      });
      if (!category || !category.path) {
        throw new AvatarValidationError(
          'Category must have a path',
          'categoryId',
          request.categoryId
        );
      }
      const resourceId = `${category.path.replace(/\//g, '-')}-${request.name}`;
      const modifiedPath = `${category.path.replace(/-/g, '/')}/${request.name}.glb`;
      // Upload file to S3
      const originalName = `${request.name || 'avatar'}.glb`;
      const fileBuffer = Buffer.isBuffer(request.file)
        ? request.file
        : Buffer.from(await request.file.arrayBuffer());

      const specificS3Url = 'models/avatar/' + modifiedPath;

      console.info('S3 URL ', specificS3Url);
      const s3Result = await this.s3Service.uploadFile(fileBuffer, originalName, adminId, {
        contentType: 'model/gltf-binary',
        metadata: {
          category: 'avatar',
          gender: request.gender,
          partType: request.partType,
        },

        specificS3Url: specificS3Url,
      });
      const s3Url = s3Result.url;
      const s3Key = s3Result.key;
      const fileSize = Buffer.isBuffer(request.file) ? request.file.length : request.file.size;

      this.logger.debug('S3 Upload Details:', {
        s3Url,
        s3Key,
        fileSize,
        fileType: 'model/gltf-binary',
        mimeType: 'model/gltf-binary',
        uploadedByAdminId: adminId,
      });

      // Check if resourceId already exists
      const existingResource = await this.prisma.avatar.findUnique({
        where: { resourceId },
      });
      if (existingResource) {
        throw new AvatarValidationError('Resource ID must be unique', 'resourceId', resourceId);
      }

      // Create avatar resource
      const avatarResource = await this.prisma.avatar.create({
        data: {
          name: request.name,
          description: request.description,
          gender: request.gender,
          partType: request.partType,
          categoryId: request.categoryId,
          version: request.version || '1.0.0',
          resourceId: resourceId,
          isPremium: request.isPremium || false,
          isFree: request.isFree !== undefined ? request.isFree : true,
          price: request.price,
          tags: request.tags || '',
          keywords: request.keywords || '',
          metadata: request.metadata || {},
          s3Url,
          s3Key,
          fileSize: BigInt(fileSize),
          fileType: 'model/gltf-binary',
          mimeType: 'model/gltf-binary',
          uploadedByAdminId: adminId,
          status: AvatarStatus.ACTIVE,
        },
        include: {
          category: true,
        },
      });

      this.logger.info(`Avatar resource created: ${avatarResource.id}`);
      return this.mapResourceToResponse(avatarResource);
    } catch (error) {
      this.logger.error('Error creating avatar resource:', error);
      throw error;
    }
  }

  async getAvatars(
    query: AvatarQuery,
    options: AvatarLoadOptions = {}
  ): Promise<{ resources: AvatarResponse[]; total: number; page: number; limit: number }> {
    try {
      const where: any = {
        deletedAt: null,
      };

      // Apply filters
      if (query.gender) where.gender = query.gender;
      if (query.partType) where.partType = query.partType;
      if (query.categoryId) where.categoryId = query.categoryId;
      if (query.status) where.status = query.status;
      if (query.isPremium !== undefined) where.isPremium = query.isPremium;
      if (query.isFree !== undefined) where.isFree = query.isFree;
      if (query.tags) {
        where.tags = { contains: query.tags };
      }
      if (query.keywords) {
        where.keywords = { contains: query.keywords };
      }
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { tags: { contains: query.search } },
        { keywords: { contains: query.search } },
        ];
      }

      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const orderBy: any = {};
      if (query.sortBy) {
        orderBy[query.sortBy] = query.sortOrder || 'asc';
      } else {
        orderBy.createdAt = 'desc';
      }

      const [resources, total] = await Promise.all([
        this.prisma.avatar.findMany({
          where,
          include: {
            category: options.includeCategory,
            usage: options.includeUsage,
            permissions: options.includePermissions,
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.avatar.count({ where }),
      ]);

      return {
        resources: resources.map((resource: any) => this.mapResourceToResponse(resource)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Error fetching avatar resources:', error);
      throw error;
    }
  }

  async getAvatarById(id: string, options: AvatarLoadOptions = {}): Promise<AvatarResponse> {
    try {
      const resource = await this.prisma.avatar.findUnique({
        where: { id, deletedAt: null },
        include: {
          category: options.includeCategory,
          usage: options.includeUsage,
          permissions: options.includePermissions,
        },
      });

      if (!resource) {
        throw new AvatarNotFoundError(id, 'resource');
      }

      return this.mapResourceToResponse(resource);
    } catch (error) {
      this.logger.error(`Error fetching avatar resource ${id}:`, error);
      throw error;
    }
  }

  async updateAvatarResource(
    id: string,
    request: UpdateAvatarRequest,
    adminId: string
  ): Promise<AvatarResponse> {
    try {
      const existing = await this.prisma.avatar.findUnique({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throw new AvatarNotFoundError(id, 'resource');
      }

      const updated = await this.prisma.avatar.update({
        where: { id },
        data: {
          ...request,
          updatedAt: new Date(),
        },
        include: {
          category: true,
        },
      });

      this.logger.info(`Avatar resource updated: ${id}`);
      return this.mapResourceToResponse(updated);
    } catch (error) {
      this.logger.error(`Error updating avatar resource ${id}:`, error);
      throw error;
    }
  }

  async deleteAvatar(id: string, adminId: string): Promise<void> {
    try {
      const existing = await this.prisma.avatar.findUnique({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throw new AvatarNotFoundError(id, 'resource');
      }

      // Soft delete
      await this.prisma.avatar.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: AvatarStatus.ARCHIVED,
        },
      });

      this.logger.info(`Avatar resource deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting avatar resource ${id}:`, error);
      throw error;
    }
  }

  // Utility Methods
  private validateCreateAvatarResourceRequest(request: CreateAvatarRequest): void {
    if (!request.name?.trim()) {
      throw new AvatarValidationError('Name is required', 'name', request.name);
    }
    if (!request.gender) {
      throw new AvatarValidationError('Gender is required', 'gender', request.gender);
    }
    if (!request.partType) {
      throw new AvatarValidationError('Part type is required', 'partType', request.partType);
    }
    if (!request.categoryId) {
      throw new AvatarValidationError('Category ID is required', 'categoryId', request.categoryId);
    }
    if (!request.file) {
      throw new AvatarValidationError('File is required', 'file', request.file);
    }
  }

  private mapResourceToResponse(resource: any): AvatarResponse {
    return {
      id: resource.id,
      name: resource.name,
      description: resource.description,
      s3Url: resource.s3Url,
      s3Key: resource.s3Key,
      fileSize: resource.fileSize.toString(),
      fileType: resource.fileType,
      gender: resource.gender,
      partType: resource.partType,
      version: resource.version,
      // uniquePath removed as it's no longer in schema
      resourceId: resource.resourceId,
      isPremium: resource.isPremium,
      isFree: resource.isFree,
      price: resource.price,
      status: resource.status,
      tags: resource.tags,
      keywords: resource.keywords,
      metadata: resource.metadata,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
      category: resource.category
        ? {
            id: resource.category.id,
            name: resource.category.name,
            path: resource.category.path,
          }
        : undefined,
    };
  }

  private mapCategoryToResponse(category: any): AvatarCategoryResponse {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      categoryType: category.categoryType,
      level: category.level,
      path: category.path,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      children: category.children?.map((child: any) => this.mapCategoryToResponse(child)),
    };
  }
}
