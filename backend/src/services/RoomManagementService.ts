import { PrismaClient, Prisma } from '@prisma/client';
import {
  RoomResource,
  RoomUsage,
  DeveloperRoomPermission,
  RoomStatus,
  RoomUsageAction,
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomQuery,
  RoomResponse,
  RoomResourceListResponse,
  RoomLoadOptions,
  RoomResourceWithRelations,
  CreateRoomUsageRequest,
  RoomUsageQuery,
  GrantRoomPermissionRequest,
  RoomPermissionQuery,
  RoomResourceStats,
  RoomUsageStats,
  S3UploadResult,
} from '../types/room';
import { S3Service } from './S3Service';
import { createHash } from 'crypto';

export class RoomManagementService {
  private prisma: PrismaClient;
  private s3Service: S3Service;

  constructor(prisma: PrismaClient, s3Service: S3Service) {
    this.prisma = prisma;
    this.s3Service = s3Service;
  }

  // Room Resource Management

  /**
   * Create a new room resource
   */
  async createRoomResource(
    data: CreateRoomRequest,
    uploadedByAdminId?: string
  ): Promise<RoomResponse> {
    try {
      // Log input data
      console.log(
        `[createRoomResource] Input data: ${JSON.stringify(
          {
            name: data.name,
            description: data.description,
            fileSize: data.file.size,
            fileType: data.file.mimetype,
            roomTypeId: data.roomTypeId,
            version: data.version,
            uniquePath: data.uniquePath?.toLowerCase().replace(/\s+/g, '_'),
          },
          null,
          2
        )}\n`
      );

      // Upload file to S3
      const uploadResult = await this.uploadRoomFile(
        data.file,
        data.name,
        'system',
        data.roomTypeId
      );
      process.stdout.write(
        `[createRoomResource] Upload result: ${JSON.stringify(uploadResult, null, 2)}\n`
      );

      // Generate checksum
      const checksum = createHash('md5').update(data.file.buffer).digest('hex');
      process.stdout.write(`[createRoomResource] Generated checksum: ${checksum}\n`);

      // Get room type to access resource_path
      const roomType = await this.getRoomTypeById(data.roomTypeId);
      if (!roomType) {
        throw new Error(`Room type with ID ${data.roomTypeId} not found`);
      }

      // Validate roomType and name
      if (!roomType.resource_path) {
        throw new Error(`Room type resource_path is missing for ID ${data.roomTypeId}`);
      }
      if (!data.name || typeof data.name !== 'string') {
        throw new Error(`Invalid room name provided: ${data.name}`);
      }

      // Generate resourceId by combining roomtype's resource_path and room_resource name
      const sanitizedName = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-_]/g, '')
        .replace(/\s+/g, '-');
      const resourceId = `${roomType.resource_path}-${sanitizedName.toLocaleLowerCase()}`.replace(/\/+/g, '-');

      process.stdout.write(`[createRoomResource] Generated resourceId: ${resourceId}\n`);

      // Prepare room resource data
      const roomResourceData = {
        name: data.name,
        description: data.description,
        s3Url: uploadResult.s3Url,
        s3Key: uploadResult.s3Key,
        fileSize: BigInt(uploadResult.fileSize),
        fileType: data.file.mimetype,
        mimeType: data.file.mimetype,
        checksum,
        roomTypeId: data.roomTypeId,
        version: data.version || '1.0.0',
        uniquePath: data.uniquePath,
        resourceId: resourceId, // Use the generated resourceId
        isPremium: data.isPremium || false,
        isFree: data.isFree !== undefined ? data.isFree : true,
        price: data.price || null,
        metadata: data.metadata || {},
        tags: data.tags || '',
        keywords: data.keywords || '',
        uploadedByAdminId,
        status: RoomStatus.ACTIVE,
      };

      process.stdout.write(
        `[createRoomResource] Final roomResourceData: ${JSON.stringify(roomResourceData, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}\n`
      );

      // Create room resource
      const roomResource = await this.prisma.room.create({
        data: roomResourceData,
      });

      process.stdout.write(
        `[createRoomResource] Room resource created with ID: ${roomResource.id}\n`
      );

      return this.formatRoomResourceResponse(roomResource);
    } catch (error) {
      process.stderr.write(`Error creating room resource: ${error}\n`);
      throw new Error('Failed to create room resource');
    }
  }

  /**
   * Get room resources with filtering and pagination
   */
  async getRoomResources(
    query: RoomQuery = {},
    options: RoomLoadOptions = {}
  ): Promise<RoomResourceListResponse> {
    try {
      const {
        roomTypeId,
        status = RoomStatus.ACTIVE,
        isPremium,
        isFree,
        search,
        tags,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      // Build where clause
      const where: Prisma.RoomWhereInput = {
        status,
        deletedAt: null,
      };

      if (roomTypeId) {
        where.roomTypeId = roomTypeId;
      }

      if (isPremium !== undefined) {
        where.isPremium = isPremium;
      }

      if (isFree !== undefined) {
        where.isFree = isFree;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (tags) {
        where.tags = {
          contains: tags,
          mode: 'insensitive'
        };
      }

      // Build include clause
      const include: Prisma.RoomInclude = {
        uploadedBy: options.includeUploadedBy,
        usage: options.includeUsage,
        permissions: options.includePermissions,
      };

      // Calculate pagination
      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

      // Execute queries
      const [roomResources, total] = await Promise.all([
        this.prisma.room.findMany({
          where,
          include,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.room.count({ where }),
      ]);

      return {
        data: roomResources.map((resource) => this.formatRoomResourceResponse(resource)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting room resources:', error);
      throw new Error('Failed to get room resources');
    }
  }

  /**
   * Get room resource by ID
   */
  async getRoomResourceById(
    id: string,
    options: RoomLoadOptions = {}
  ): Promise<RoomResponse | null> {
    try {
      const include: Prisma.RoomInclude = {
        uploadedBy: options.includeUploadedBy,
        usage: options.includeUsage,
        permissions: options.includePermissions,
      };

      const roomResource = await this.prisma.room.findUnique({
        where: { id },
        include,
      });

      if (!roomResource || roomResource.deletedAt) {
        return null;
      }

      return this.formatRoomResourceResponse(roomResource);
    } catch (error) {
      console.error('Error getting room resource by ID:', error);
      throw new Error('Failed to get room resource');
    }
  }

  /**
   * Get room resource by resourceId
   */
  async getRoomResourceByResourceId(
    resourceId: string,
    options: RoomLoadOptions = {}
  ): Promise<RoomResponse | null> {
    try {
      const include: Prisma.RoomInclude = {
        uploadedBy: options.includeUploadedBy,
        usage: options.includeUsage,
        permissions: options.includePermissions,
      };

      const roomResource = await this.prisma.room.findUnique({
        where: { resourceId },
        include,
      });

      if (!roomResource || roomResource.deletedAt) {
        return null;
      }

      return this.formatRoomResourceResponse(roomResource);
    } catch (error) {
      console.error('Error getting room resource by resourceId:', error);
      throw new Error('Failed to get room resource by resourceId');
    }
  }

  /**
   * Update room resource
   */
  async updateRoomResource(id: string, data: UpdateRoomRequest): Promise<RoomResponse | null> {
    try {
      const updateData: Prisma.RoomUpdateInput = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.roomTypeId !== undefined)
        updateData.roomType = data.roomTypeId
          ? { connect: { id: data.roomTypeId } }
          : { disconnect: true };
      if (data.version !== undefined) updateData.version = data.version;
      if (data.resourceId !== undefined) updateData.resourceId = data.resourceId;
      if (data.isPremium !== undefined) updateData.isPremium = data.isPremium;
      if (data.isFree !== undefined) updateData.isFree = data.isFree;
      if (data.price !== undefined) {
        updateData.price = data.price;
      }
      if (data.status !== undefined) updateData.status = data.status;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;
      if (data.tags !== undefined) {
        updateData.tags = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
      }
      if (data.keywords !== undefined) {
        updateData.keywords = Array.isArray(data.keywords) ? data.keywords.join(',') : data.keywords;
      }

      const roomResource = await this.prisma.room.update({
        where: { id },
        data: updateData,
      });

      return this.formatRoomResourceResponse(roomResource);
    } catch (error) {
      console.error('Error updating room resource:', error);
      throw new Error('Failed to update room resource');
    }
  }

  /**
   * Delete room resource (soft delete)
   */
  async deleteRoomResource(id: string): Promise<boolean> {
    try {
      await this.prisma.room.update({
        where: { id },
        data: {
          status: RoomStatus.ARCHIVED,
          deletedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Error deleting room resource:', error);
      throw new Error('Failed to delete room resource');
    }
  }

  // Room Usage Tracking

  /**
   * Track room resource usage
   */
  async trackRoomUsage(data: CreateRoomUsageRequest): Promise<RoomUsage> {
    try {
      const result = await this.prisma.roomUsage.create({
        data: {
          roomResourceId: data.roomResourceId,
          developerId: data.developerId,
          projectId: data.projectId,
          action: data.action,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          metadata: data.metadata || {},
        },
      });

      return {
        ...result,
        roomResourceId: result.roomResourceId ?? undefined,
        developerId: result.developerId ?? undefined,
        projectId: result.projectId ?? undefined,
        userAgent: result.userAgent ?? undefined,
        ipAddress: result.ipAddress ?? undefined,
        action: result.action as RoomUsageAction,
      };
    } catch (error) {
      console.error('Error tracking room usage:', error);
      throw new Error('Failed to track room usage');
    }
  }

  /**
   * Get room usage statistics
   */
  async getRoomUsage(query: RoomUsageQuery = {}): Promise<RoomUsage[]> {
    try {
      const {
        roomResourceId,
        developerId,
        projectId,
        action,
        startDate,
        endDate,
        page = 1,
        limit = 100,
      } = query;

      const where: Prisma.RoomUsageWhereInput = {};

      if (roomResourceId) where.roomResourceId = roomResourceId;
      if (developerId) where.developerId = developerId;
      if (projectId) where.projectId = projectId;
      if (action) where.action = action;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const skip = (page - 1) * limit;

      const results = await this.prisma.roomUsage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return results.map((result) => ({
        ...result,
        roomResourceId: result.roomResourceId ?? undefined,
        developerId: result.developerId ?? undefined,
        projectId: result.projectId ?? undefined,
        userAgent: result.userAgent ?? undefined,
        ipAddress: result.ipAddress ?? undefined,
        action: result.action as RoomUsageAction,
      }));
    } catch (error) {
      console.error('Error getting room usage:', error);
      throw new Error('Failed to get room usage');
    }
  }

  // Permission Management

  /**
   * Grant room resource permission to developer
   */
  async grantRoomPermission(data: GrantRoomPermissionRequest): Promise<DeveloperRoomPermission> {
    try {
      const result = await this.prisma.developerRoomPermission.upsert({
        where: {
          developerId_roomResourceId: {
            developerId: data.developerId,
            roomResourceId: data.roomResourceId,
          },
        },
        update: {
          expiresAt: data.expiresAt,
          isPaid: data.isPaid || false,
          paidAmount: data.paidAmount,
          grantedBy: data.grantedBy,
          reason: data.reason,
          grantedAt: new Date(),
        },
        create: {
          developerId: data.developerId,
          roomResourceId: data.roomResourceId,
          expiresAt: data.expiresAt,
          isPaid: data.isPaid || false,
          paidAmount: data.paidAmount,
          grantedBy: data.grantedBy,
          reason: data.reason,
        },
      });

      return {
        ...result,
        roomResourceId: result.roomResourceId ?? undefined,
        expiresAt: result.expiresAt ?? undefined,
        paidAmount: result.paidAmount ?? undefined,
        grantedBy: result.grantedBy ?? undefined,
        reason: result.reason ?? undefined,
      };
    } catch (error) {
      console.error('Error granting room permission:', error);
      throw new Error('Failed to grant room permission');
    }
  }

  /**
   * Check if developer has permission for room resource
   */
  async hasRoomPermission(developerId: string, roomResourceId: string): Promise<boolean> {
    try {
      const permission = await this.prisma.developerRoomPermission.findUnique({
        where: {
          developerId_roomResourceId: {
            developerId,
            roomResourceId,
          },
        },
      });

      if (!permission) return false;
      if (permission.expiresAt && permission.expiresAt < new Date()) return false;

      return true;
    } catch (error) {
      console.error('Error checking room permission:', error);
      return false;
    }
  }

  /**
   * Get room permissions
   */
  async getRoomPermissions(query: RoomPermissionQuery = {}): Promise<DeveloperRoomPermission[]> {
    try {
      const { developerId, roomResourceId, isPaid, isExpired, page = 1, limit = 100 } = query;

      const where: Prisma.DeveloperRoomPermissionWhereInput = {};

      if (developerId) where.developerId = developerId;
      if (roomResourceId) where.roomResourceId = roomResourceId;
      if (isPaid !== undefined) where.isPaid = isPaid;

      if (isExpired !== undefined) {
        if (isExpired) {
          where.expiresAt = { lt: new Date() };
        } else {
          where.OR = [{ expiresAt: null }, { expiresAt: { gte: new Date() } }];
        }
      }

      const skip = (page - 1) * limit;

      const results = await this.prisma.developerRoomPermission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { grantedAt: 'desc' },
      });

      return results.map((result) => ({
        ...result,
        roomResourceId: result.roomResourceId ?? undefined,
        expiresAt: result.expiresAt ?? undefined,
        paidAmount: result.paidAmount ?? undefined,
        grantedBy: result.grantedBy ?? undefined,
        reason: result.reason ?? undefined,
      }));
    } catch (error) {
      console.error('Error getting room permissions:', error);
      throw new Error('Failed to get room permissions');
    }
  }

  // Statistics and Analytics

  /**
   * Get room resource statistics
   */
  async getRoomResourceStats(): Promise<RoomResourceStats> {
    try {
      const [
        totalResources,
        roomTypeIdStats,
        statusStats,
        premiumCount,
        freeCount,
        usageCount,
        permissionCount,
      ] = await Promise.all([
        this.prisma.room.count({ where: { deletedAt: null } }),
        this.prisma.room.groupBy({
          by: ['roomTypeId'],
          where: { deletedAt: null },
          _count: true,
        }),
        this.prisma.room.groupBy({
          by: ['status'],
          where: { deletedAt: null },
          _count: true,
        }),
        this.prisma.room.count({ where: { isPremium: true, deletedAt: null } }),
        this.prisma.room.count({ where: { isFree: true, deletedAt: null } }),
        this.prisma.roomUsage.count(),
        this.prisma.developerRoomPermission.count(),
      ]);

      return {
        totalResources,
        totalByRoomType: Object.fromEntries(
          roomTypeIdStats.map((stat: any) => [stat.roomTypeId, stat._count])
        ),
        totalByStatus: Object.fromEntries(
          statusStats.map((stat: any) => [stat.status, stat._count])
        ),
        premiumResources: premiumCount,
        freeResources: freeCount,
        totalUsage: usageCount,
        totalPermissions: permissionCount,
      };
    } catch (error) {
      console.error('Error getting room resource stats:', error);
      throw new Error('Failed to get room resource statistics');
    }
  }

  // Helper Methods

  /**
   * Upload room file to S3
   */
  private async uploadRoomFile(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    name: string,
    developerId: string = 'system',
    roomTypeId: string = ''
  ): Promise<S3UploadResult> {
    // const modifiedPath = `rooms/${name}`;
    // const specificS3Url = modifiedPath;

    // const s3Result = await this.s3Service.uploadFile(file.buffer, file.originalname, developerId, {
    //   contentType: file.mimetype,
    //   metadata: {
    //     name: name,
    //   },
    //   specificS3Url: specificS3Url,
    // });

    const roomType = await this.getRoomTypeById(roomTypeId);

    if (!roomType) {
      throw new Error(`Room type with ID ${roomTypeId} not found`);
    }

    const modifiedPath = `models/rooms/${roomType.resource_path.toLowerCase()}/${file.originalname.toLowerCase()}`;
    const specificS3Url = modifiedPath;
    console.log('S3URL ', specificS3Url);

    const s3Result = await this.s3Service.uploadFile(file.buffer, file.originalname, developerId, {
      contentType: file.mimetype,
      metadata: {
        name: name,
      },
      specificS3Url: specificS3Url,
    });

    return {
      s3Url: s3Result.url,
      s3Key: s3Result.key,
      fileSize: s3Result.size,
    };
  }

  /**
   * Format room resource for API response
   */
  private formatRoomResourceResponse(roomResource: any): RoomResponse {
    return {
      id: roomResource.id,
      name: roomResource.name,
      description: roomResource.description,
      s3Url: roomResource.s3Url,
      s3Key: roomResource.s3Key,
      roomTypeId: roomResource.roomTypeId,
      version: roomResource.version,
      uniquePath: roomResource.uniquePath,
      resourceId: roomResource.resourceId,
      isPremium: roomResource.isPremium,
      isFree: roomResource.isFree,
      price: roomResource.price ? Number(roomResource.price) : undefined,
      status: roomResource.status,
      metadata: roomResource.metadata,
      tags: roomResource.tags,
      keywords: roomResource.keywords,
      fileSize: roomResource.fileSize.toString(),
      fileType: roomResource.fileType,
      mimeType: roomResource.mimeType,
      uploadedByAdminId: roomResource.uploadedByAdminId,
      createdAt: roomResource.createdAt.toISOString(),
      updatedAt: roomResource.updatedAt.toISOString(),
    };
  }

  /**
   * Get room resources by category
   */
  /**
   * Get room resources by room type
   */
  async getRoomResourcesByRoomType(roomTypeId: string): Promise<RoomResponse[]> {
    const result = await this.getRoomResources({ roomTypeId, limit: 1000 });
    return result.data;
  }

  async getRoomTypes(): Promise<
    { id: string; name: string; label: string; resource_path: string }[]
  > {
    return this.prisma.roomType.findMany({
      select: { id: true, name: true, label: true, resource_path: true },
    });
  }

  async getRoomTypeById(
    id: string
  ): Promise<{ id: string; name: string; label: string; resource_path: string } | null> {
    return this.prisma.roomType.findUnique({
      where: { id },
      select: { id: true, name: true, label: true, resource_path: true },
    });
  }

  async createRoomType(data: {
    name: string;
    label: string;
    description?: string;
    resource_path: string;
  }): Promise<{ id: string; name: string; label: string; resource_path: string }> {
    if (data.resource_path ) data.resource_path = data.resource_path.toLowerCase();
    return this.prisma.roomType.create({ data });
  }

  async updateRoomType(
    id: string,
    data: { name?: string; label?: string; description?: string; resource_path?: string }
  ): Promise<{ id: string; name: string; label: string; resource_path: string }> {
    return this.prisma.roomType.update({ where: { id }, data });
  }

  async deleteRoomType(id: string): Promise<void> {
    await this.prisma.roomType.delete({ where: { id } });
  }

  /**
   * Get available room categories
   */
  /**
   * Get available room types
   */
  getAvailableRoomTypes(): Promise<
    { id: string; name: string; label: string; resource_path: string }[]
  > {
    return this.getRoomTypes();
  }

  /**
   * Generate download URL for room resource
   */
  async generateDownloadUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    return await this.s3Service.generateDownloadUrl(s3Key, expiresIn);
  }

  async generateDownloadUrlWithFallback(s3Key: string, expiresIn: number = 3600): Promise<{ url: string; isPresigned: boolean }> {
    return await this.s3Service.generateDownloadUrlWithFallback(s3Key, expiresIn);
  }

  /**
   * Generate download URL for room resource by resourceId
   */
  async generateDownloadUrlByResourceId(resourceId: string): Promise<string | null> {
    try {
      const room = await this.getRoomResourceByResourceId(resourceId);
      if (!room || !room.s3Key) {
        return null;
      }

      return await this.s3Service.generateDownloadUrl(room.s3Key);
    } catch (error) {
      console.error('Error generating download URL by resourceId:', error);
      throw error;
    }
  }
}
