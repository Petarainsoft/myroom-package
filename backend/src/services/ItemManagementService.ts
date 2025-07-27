import {
  PrismaClient,
  Item,
  ItemCategory,
  ResourceStatus,
  ResourceAccessPolicy,
} from '@prisma/client';
import { S3Service } from './S3Service';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import crypto from 'crypto';
import path from 'path';
import slugify from 'slugify';

export interface CreateItemInput {
  name: string;
  description?: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  categoryId?: string;
  ownerProjectId?: string;
  uploadedByAdminId: string;
  accessPolicy?: ResourceAccessPolicy;
  tags?: string;
  keywords?: string;
  metadata?: any;
  isPremium?: boolean;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  categoryId?: string;
  accessPolicy?: ResourceAccessPolicy;
  status?: ResourceStatus;
  tags?: string;
  keywords?: string;
  metadata?: any;
  isPremium?: boolean;
}

export interface ItemSearchFilter {
  categoryId?: string;
  ownerProjectId?: string;
  accessPolicy?: ResourceAccessPolicy;
  status?: ResourceStatus;
  tags?: string;
  keywords?: string;
  mimeType?: string;
  uploadedByAdminId?: string;
  search?: string;
}

export interface ItemWithPermissions extends Item {
  category: ItemCategory;
  hasAccess: boolean;
  accessReason?: string;
}

export class ItemManagementService {
  private prisma: PrismaClient;
  private s3Service: S3Service;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.s3Service = S3Service.getInstance();
  }

  /**
   * Compute uniquePath from a relative file path.
   * Rule: remove leading slashes, remove extension, drop the first two segments,
   * then join remaining parts with '/'.
   * Example: a/b/c/d/e/filename.glb  ->  c/d/e/filename
   */
  private computeUniquePath(relativePath: string): string {
    const cleaned = relativePath.replace(/^\/+/, '');
    const withoutExt = cleaned.replace(/\.[^/.]+$/, '');
    const segments = withoutExt.split('/');
    const trimmed = segments.slice(2).join('/');
    return trimmed;
  }

  /**
   * Ensure category hierarchy exists based on an array of category segment names.
   * Returns the ID of the deepest (last) category.
   */
  private async ensureCategoryHierarchy(segments: string[]): Promise<string> {
    let parentId: string | null = null;
    let pathAccum: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const name = segments[i];
      if (!name) continue; // Skip empty segments

      pathAccum.push(name);
      // Check if category with this name & parent exists
      let category: any = await this.prisma.itemCategory.findFirst({
        where: {
          name: name,
          parentId: parentId,
        },
      });

      if (!category) {
        category = await this.prisma.itemCategory.create({
          data: {
            name: name,
            parentId: parentId,
            level: i + 1,
            path: pathAccum.map(s => s.toLowerCase().replace(/\s+/g, '_')).join('/'),
          },
        });
      }

      parentId = category.id;
    }

    if (!parentId) {
      throw new Error('Failed to create/find category hierarchy');
    }

    return parentId;
  }

  /**
   * Create a new resource with file upload to S3
   */
  async createResource(input: CreateItemInput & { relativePath?: string }): Promise<Item> {
    try {
      // If relativePath is provided, compute uniquePath and category hierarchy automatically
      let categoryId = input.categoryId;
      let uniquePath: string | undefined = undefined;

      if (input.relativePath) {
        uniquePath = this.computeUniquePath(input.relativePath);

        // Derive category path segments (excluding filename)
        const segments = uniquePath.split('/');
        const dirSegments = segments.slice(0, -1); // remove filename part

        if (dirSegments.length === 0) {
          throw ApiError.badRequest(
            'relativePath must contain at least one directory level before file name'
          );
        }

        categoryId = await this.ensureCategoryHierarchy(dirSegments);
      }

      // Validate categoryId (either provided directly or created above)
      if (!categoryId) {
        throw ApiError.badRequest('Category ID is required');
      }

      const category = await this.prisma.itemCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw ApiError.badRequest('Invalid category ID');
      }

      // Generate unique slug
      const baseSlug = slugify(input.name, { lower: true });
      const slug = await this.generateUniqueSlug(baseSlug);

      // Calculate file checksum
      const checksum = crypto.createHash('md5').update(input.fileBuffer).digest('hex');

      // Generate uniquePath from category path
      const categoryForUnique = await this.prisma.itemCategory.findUnique({
        where: { id: categoryId },
      });
      if (!categoryForUnique || !categoryForUnique.path) {
        throw ApiError.badRequest('Category must have a path');
      }
      const hierarchyPath = categoryForUnique.path.toLocaleLowerCase().replace(/\s+/g, '_');
      const processedName = input.name.toLowerCase().replace(/\s+/g, '_');
      const resourceIdGenerated = `${hierarchyPath.replace(/\//g, '-')}-${processedName}`;

      // Upload to S3
      const specificS3Url = `models/items/${hierarchyPath}/${processedName}.glb`;

      logger.info('S3URL Of ITEM ', specificS3Url);

      const uploadResult = await this.s3Service.uploadFile(
        input.fileBuffer,
        input.fileName,
        `${input.uploadedByAdminId}`,
        {
          contentType: input.mimeType,
          metadata: {
            category: categoryId!,
            uploadedBy: 'admin',
            adminId: input.uploadedByAdminId,
            checksum,
            ...input.metadata,
          },
          specificS3Url: specificS3Url,
        }
      );

      if (uploadResult.wasSkipped) {
        logger.info('Upload skipped because file already exists', { specificS3Url });
      }

      if (uploadResult.wasSkipped) {
        logger.info('Upload skipped because file already exists', { specificS3Url });
      }

      // Ensure resourceId is unique by adding suffix if needed
      let finalResourceId = resourceIdGenerated;
      let counter = 1;
      while (true) {
        const existingUnique = await this.prisma.item.findUnique({
          where: { resourceId: finalResourceId },
        });
        if (!existingUnique) {
          break;
        }
        finalResourceId = `${resourceIdGenerated}_${counter}`;
        counter++;
      }

      // Compute and log fileType
      const fileType = path.extname(input.fileName).toLowerCase();
      logger.info('Computed fileType value', { fileType, fileName: input.fileName });

      // Create resource record
      const resource = await this.prisma.item.create({
        data: {
          resourceId: finalResourceId,
          name: input.name,
          description: input.description,
          s3Url: uploadResult.url,
          s3Key: uploadResult.key,
          fileSize: BigInt(uploadResult.size),
          fileType: fileType, // using the computed fileType
          mimeType: input.mimeType,
          categoryId: categoryId!,
          ownerProjectId: input.ownerProjectId,
          uploadedByAdminId: input.uploadedByAdminId,
          accessPolicy: input.accessPolicy || ResourceAccessPolicy.DEVELOPERS_ONLY,
          tags: input.tags || '',
          keywords: input.keywords || '',
          metadata: input.metadata || {},
          checksum,
          slug,
          status: ResourceStatus.ACTIVE,
          isPremium: input.isPremium ?? false,
        },
        include: {
          category: true,
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      logger.info('Resource created successfully', {
        resourceId: resource.id,
        name: resource.name,
        categoryId: categoryId,
        uploadedBy: input.uploadedByAdminId,
        fileSize: uploadResult.size,
      });

      return resource;
    } catch (error) {
      logger.error('Failed to create resource', {
        name: input.name,
        categoryId: input.categoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update resource metadata (not the file itself)
   */
  async updateResource(resourceId: string, input: UpdateItemInput): Promise<Item> {
    try {
      // Check if resource exists
      const existingResource = await this.prisma.item.findUnique({
        where: { id: resourceId, deletedAt: null },
      });

      if (!existingResource) {
        throw ApiError.notFound('Resource not found');
      }

      // Validate category if provided
      if (input.categoryId) {
        const category = await this.prisma.itemCategory.findUnique({
          where: { id: input.categoryId },
        });

        if (!category) {
          throw ApiError.badRequest('Invalid category ID');
        }
      }

      // Generate new slug if name is being updated
      let slug = existingResource.slug;
      if (input.name && input.name !== existingResource.name) {
        const baseSlug = slugify(input.name, { lower: true });
        slug = await this.generateUniqueSlug(baseSlug, resourceId);
      }

      // Update resource
      const updatedResource = await this.prisma.item.update({
        where: { id: resourceId },
        data: {
          ...input,
          slug,
          updatedAt: new Date(),
        },
        include: {
          category: true,
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      logger.info('Resource updated successfully', {
        resourceId,
        updatedFields: Object.keys(input),
      });

      return updatedResource;
    } catch (error) {
      logger.error('Failed to update resource', {
        resourceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Soft delete a resource
   */
  async deleteResource(resourceId: string, adminId: string): Promise<void> {
    try {
      const resource = await this.prisma.item.findUnique({
        where: { id: resourceId, deletedAt: null },
      });

      if (!resource) {
        throw ApiError.notFound('Resource not found');
      }

      // Soft delete
      await this.prisma.item.update({
        where: { id: resourceId },
        data: {
          status: ResourceStatus.ARCHIVED,
          deletedAt: new Date(),
        },
      });

      logger.info('Resource soft deleted', {
        resourceId,
        name: resource.name,
        deletedBy: adminId,
      });
    } catch (error) {
      logger.error('Failed to delete resource', {
        resourceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get resources with filtering and pagination
   */
  async getResources(
    filter: ItemSearchFilter = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    try {
      const skip = (page - 1) * limit;

      const whereClause: any = {
        deletedAt: null,
        ...filter,
      };

      // Remove search from whereClause to handle it separately
      if (whereClause.search) {
        delete whereClause.search;
      }

      // Handle search parameter - search in name, description, keywords
      if (filter.search) {
        const searchConditions = [
          {
            name: {
              contains: filter.search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: filter.search,
              mode: 'insensitive',
            },
          },
          {
            keywords: {
              has: filter.search,
            },
          },
        ];

        // If we have other filters, combine them with AND logic
        if (Object.keys(whereClause).length > 1) {
          // more than just deletedAt
          whereClause.AND = [
            {
              OR: searchConditions,
            },
          ];
        } else {
          // If only search, use OR directly
          whereClause.OR = searchConditions;
        }
      }

      // Handle string filters
      if (filter.tags) {
        whereClause.tags = {
          contains: filter.tags,
        };
      }

      if (filter.keywords) {
        whereClause.keywords = {
          contains: filter.keywords,
        };
      }

      const [resources, total] = await Promise.all([
        this.prisma.item.findMany({
          where: whereClause,
          include: {
            category: true,
            uploadedBy: {
              select: { id: true, name: true, email: true },
            },
            ownerProject: {
              select: { id: true, name: true },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.item.count({ where: whereClause }),
      ]);

      return {
        resources,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get resources', {
        filter,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get accessible resources for a developer based on permissions
   */
  async getAccessibleResources(
    developerId: string,
    projectId?: string,
    filter: ItemSearchFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ resources: ItemWithPermissions[]; pagination: any }> {
    try {
      // No category permissions, all categories are accessible
      const accessibleCategoryIds: string[] = [];

      // Build where clause
      const whereClause: any = {
        deletedAt: null,
        status: ResourceStatus.ACTIVE,
        OR: [
          { accessPolicy: ResourceAccessPolicy.PUBLIC },
          {
            accessPolicy: ResourceAccessPolicy.DEVELOPERS_ONLY,
            categoryId: { in: accessibleCategoryIds },
          },
        ],
        ...filter,
      };

      if (projectId) {
        whereClause.OR.push({
          accessPolicy: ResourceAccessPolicy.PROJECT_ONLY,
          ownerProjectId: projectId,
        });
      }

      const skip = (page - 1) * limit;

      const [resources, total] = await Promise.all([
        this.prisma.item.findMany({
          where: whereClause,
          include: {
            category: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.item.count({ where: whereClause }),
      ]);

      // Add access information
      const resourcesWithPermissions: ItemWithPermissions[] = resources.map((resource) => {
        let hasAccess = false;
        let accessReason = '';

        if (resource.accessPolicy === ResourceAccessPolicy.PUBLIC) {
          hasAccess = true;
          accessReason = 'Public resource';
        } else if (
          resource.accessPolicy === ResourceAccessPolicy.PROJECT_ONLY &&
          resource.ownerProjectId === projectId
        ) {
          hasAccess = true;
          accessReason = 'Project-owned resource';
        } else if (resource.accessPolicy === ResourceAccessPolicy.DEVELOPERS_ONLY) {
          // All developers have access to DEVELOPERS_ONLY resources since category permissions were removed
          hasAccess = true;
          accessReason = 'Developer access';
        }

        return {
          ...resource,
          hasAccess,
          accessReason,
        };
      });

      return {
        resources: resourcesWithPermissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get accessible resources', {
        developerId,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check if a developer has access to a specific resource
   */
  async checkResourceAccess(
    resourceId: string,
    developerId: string,
    projectId?: string
  ): Promise<boolean> {
    try {
      const resource = await this.prisma.item.findUnique({
        where: { id: resourceId, deletedAt: null, status: ResourceStatus.ACTIVE },
        include: { category: true },
      });

      if (!resource) {
        return false;
      }

      // Public resources are accessible to everyone
      if (resource.accessPolicy === ResourceAccessPolicy.PUBLIC) {
        return true;
      }

      // Project-only resources
      if (resource.accessPolicy === ResourceAccessPolicy.PROJECT_ONLY) {
        return resource.ownerProjectId === projectId;
      }

      // Developer-only resources (all developers have access since category permissions were removed)
      if (resource.accessPolicy === ResourceAccessPolicy.DEVELOPERS_ONLY) {
        // All developers have access to developer-only resources
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to check resource access', {
        resourceId,
        developerId,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Generate unique slug for resource
   */
  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 0;

    while (true) {
      const whereClause: any = excludeId ? { slug, NOT: { id: excludeId } } : { slug };
      const existing = await this.prisma.item.findFirst({ where: whereClause });

      if (!existing) {
        return slug;
      }

      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Get resource by ID
   */
  async getResourceById(resourceId: string): Promise<Item | null> {
    try {
      const resource = await this.prisma.item.findUnique({
        where: { id: resourceId, deletedAt: null },
        include: {
          category: true,
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return resource;
    } catch (error) {
      logger.error('Failed to get resource by ID', {
        resourceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get resource statistics
   */
  async getResourceStats(): Promise<any> {
    try {
      const [
        totalResources,
        activeResources,
        resourcesByCategory,
        resourcesByAccessPolicy,
        topCategories,
      ] = await Promise.all([
        this.prisma.item.count({ where: { deletedAt: null } }),
        this.prisma.item.count({ where: { deletedAt: null, status: ResourceStatus.ACTIVE } }),
        this.prisma.item.groupBy({
          by: ['categoryId'],
          where: { deletedAt: null },
          _count: true,
        }),
        this.prisma.item.groupBy({
          by: ['accessPolicy'],
          where: { deletedAt: null },
          _count: true,
        }),
        this.prisma.resourceUsage.groupBy({
          by: ['resourceId'],
          _count: true,
          orderBy: { _count: { resourceId: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        totalResources,
        activeResources,
        resourcesByCategory,
        resourcesByAccessPolicy,
        topCategories,
      };
    } catch (error) {
      logger.error('Failed to get resource statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export default ItemManagementService;
