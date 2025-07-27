import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ResourceAccessCheck {
  hasAccess: boolean;
  reason: 'free' | 'permission' | 'denied';
  permission?: any;
  resource?: any;
}

export interface AccessibleResourcesOptions {
  categoryId?: string;
  search?: string;
  fileType?: string;
  uniquePath?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DeveloperPermissionsSummary {
  totalResources: number;
  freeResources: number;
  paidResources: number;
  accessibleResources: number;
  grantedPermissions: number;
  expiredPermissions: number;
}

/**
 * Check if a developer has access to a specific resource (item or avatar)
 */
export async function checkResourceAccess(
  developerId: string,
  resourceId: string
): Promise<ResourceAccessCheck> {
  try {
    console.log(`[DEBUG] Checking access for developerId: ${developerId}, resourceId: ${resourceId}`);
    
    // First try to find resource in items table
    let resource = await prisma.item.findFirst({
      where: { resourceId: resourceId },
      select: {
        id: true,
        isPremium: true,
        name: true,
        status: true,
        resourceId: true,
      },
    });
    
    console.log(`[DEBUG] Found resource in items table:`, resource);



    let resourceType = 'item';
    let permissionTable = 'developerResourcePermission';

    // If not found in items, try avatars table
    if (!resource) {
      const avatarResource = await prisma.avatar.findFirst({
        where: {
          resourceId: resourceId,
          deletedAt: null,
        },
        select: {
          id: true,
          isPremium: true,
          name: true,
          resourceId: true,
        },
      });



      if (avatarResource) {
        resource = {
          id: avatarResource.id,
          isPremium: avatarResource.isPremium,
          name: avatarResource.name,
          status: 'ACTIVE', // Avatars don't have status field, assume active if not deleted
          resourceId: avatarResource.resourceId,
        };
        resourceType = 'avatar';
        permissionTable = 'developerAvatarPermission';
      }
    }

    if (!resource) {
      console.log(`[DEBUG] Resource not found in both items and avatars tables`);
      return { hasAccess: false, reason: 'denied' };
    }

    console.log(`[DEBUG] Resource found - Type: ${resourceType}, Status: ${resource.status}, isPremium: ${resource.isPremium}`);

    // Check if resource is active (only for items)
    if (resourceType === 'item' && resource.status !== 'ACTIVE') {
      console.log(`[DEBUG] Resource is not ACTIVE, status: ${resource.status}`);
      return { hasAccess: false, reason: 'denied' };
    }

    // If resource is not premium (free), all developers have access
    if (!resource.isPremium) {
      console.log(`[DEBUG] Resource is free, granting access`);
      return { hasAccess: true, reason: 'free', resource };
    }

    // For avatars, also check is_free field
    if (resourceType === 'avatar') {
      const avatarRecord = await prisma.avatar.findFirst({
        where: { resourceId: resourceId },
        select: { isFree: true },
      });
      
      if (avatarRecord && avatarRecord.isFree) {
        return { hasAccess: true, reason: 'free', resource };
      }
    }

    // Check if developer has permission for this specific resource
    let permission;
    if (resourceType === 'item') {
      permission = await prisma.developerResourcePermission.findFirst({
        where: {
          developerId,
          resourceId,
          OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }],
        },
      });

    } else {
      // For avatars, check avatar permissions
      const avatarRecord = await prisma.avatar.findFirst({
        where: { resourceId: resourceId },
        select: { id: true },
      });
      
      if (avatarRecord) {
        permission = await prisma.developerAvatarPermission.findUnique({
          where: {
            developerId_avatarResourceId: {
              developerId,
              avatarResourceId: avatarRecord.id,
            },
          },
        });
        
        // Check if permission is expired
        if (permission && permission.expiresAt && permission.expiresAt < new Date()) {
          permission = null;
        }
      }
    }

    if (permission) {
      return { hasAccess: true, reason: 'permission', permission, resource };
    }

    return { hasAccess: false, reason: 'denied', resource };
  } catch (error) {
    console.error('Error checking resource access:', error);
    return { hasAccess: false, reason: 'denied' };
  }
}

/**
 * Get all resources that a developer has access to
 */
export async function getAccessibleResources(
  developerId: string,
  options: AccessibleResourcesOptions = {}
): Promise<{
  resources: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const {
    categoryId,
    search,
    fileType,
    uniquePath,
    tags,
    page = 1,
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc',
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause for accessible resources
  const where: any = {
    status: 'ACTIVE',
    OR: [
      // Non-premium (free) resources
      { isPremium: false },
      // Premium resources with valid permissions
      {
        isPremium: true,
        permissions: {
          some: {
            developerId,
            OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }],
          },
        },
      },
    ],
  };

  // Add filters
  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  if (fileType) {
    where.fileType = fileType;
  }

  if (uniquePath) {
    where.uniquePath = uniquePath;
  }

  if (tags && tags.length > 0) {
    where.tags = {
      contains: tags.join(','),
    };
  }

  const [resources, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        description: true,
        fileType: true,
        fileSize: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.item.count({ where }),
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
}

/**
 * Grant permission to a developer for a specific resource
 */
export async function grantResourcePermission(
  developerId: string,
  resourceId: string,
  options: {
    isPaid?: boolean;
    paidAmount?: number;
    expiredAt?: Date;
    grantedBy?: string;
    reason?: string;
  } = {}
): Promise<any> {
  const {
    isPaid = false,
    paidAmount = null,
    expiredAt = null,
    grantedBy = null,
    reason = 'Manual grant',
  } = options;

  try {
    const permission = await prisma.developerResourcePermission.create({
      data: {
        developerId,
        resourceId,
        isPaid,
        paidAmount: paidAmount === null ? undefined : paidAmount,
        expiredAt: expiredAt ?? undefined,
        grantedBy: grantedBy ?? undefined,
        reason,
        grantedAt: new Date(),
      },
    });

    console.log(`✅ Granted permission for resource ${resourceId} to developer ${developerId}`);
    return permission;
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Permission already exists, update it
      console.log(`⚠️ Permission already exists, updating...`);
      return await prisma.developerResourcePermission.update({
        where: {
          developerId_resourceId: {
            developerId,
            resourceId,
          },
        },
        data: {
          isPaid,
          paidAmount: paidAmount === null ? undefined : paidAmount,
          expiredAt: expiredAt ?? undefined,
          grantedBy: grantedBy ?? undefined,
          reason,
          updatedAt: new Date(),
        },
      });
    }
    throw error;
  }
}

/**
 * Revoke permission from a developer for a specific resource
 */
export async function revokeResourcePermission(
  developerId: string,
  resourceId: string
): Promise<any> {
  try {
    const result = await prisma.developerResourcePermission.delete({
      where: {
        developerId_resourceId: {
          developerId,
          resourceId,
        },
      },
    });

    console.log(`✅ Revoked permission for resource ${resourceId} from developer ${developerId}`);
    return result;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`⚠️ Permission not found for resource ${resourceId} and developer ${developerId}`);
      return null;
    }
    throw error;
  }
}

/**
 * Get developer's resource permissions summary
 */
export async function getDeveloperPermissionsSummary(
  developerId: string
): Promise<DeveloperPermissionsSummary> {
  const [totalResources, freeResources, paidResources, grantedPermissions, expiredPermissions] =
    await Promise.all([
      prisma.item.count({ where: { status: 'ACTIVE' } }),
      prisma.item.count({ where: { status: 'ACTIVE', isPremium: false } }),
      prisma.item.count({ where: { status: 'ACTIVE', isPremium: true } }),
      prisma.developerResourcePermission.count({
        where: {
          developerId,
          OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }],
        },
      }),
      prisma.developerResourcePermission.count({
        where: {
          developerId,
          expiredAt: { lte: new Date() },
        },
      }),
    ]);

  return {
    totalResources,
    freeResources,
    paidResources,
    accessibleResources: freeResources + grantedPermissions,
    grantedPermissions,
    expiredPermissions,
  };
}

/**
 * Bulk grant permissions for multiple resources to a developer
 */
export async function bulkGrantPermissions(
  developerId: string,
  resourceIds: string[],
  options: {
    isPaid?: boolean;
    paidAmount?: number;
    expiredAt?: Date;
    grantedBy?: string;
    reason?: string;
  } = {}
): Promise<{ success: number; failed: number; errors: string[] }> {
  const {
    isPaid = false,
    paidAmount = null,
    expiredAt = null,
    grantedBy = null,
    reason = 'Bulk grant',
  } = options;

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const resourceId of resourceIds) {
    try {
      await grantResourcePermission(developerId, resourceId, {
        isPaid,
        paidAmount: paidAmount ?? undefined,
        expiredAt: expiredAt ?? undefined,
        grantedBy: grantedBy ?? undefined,
        reason,
      });
      success++;
    } catch (error: any) {
      failed++;
      errors.push(`Resource ${resourceId}: ${error.message}`);
    }
  }

  console.log(`📊 Bulk grant completed: ${success} success, ${failed} failed`);
  return { success, failed, errors };
}

/**
 * Get all permissions for a developer
 */
export async function getDeveloperPermissions(
  developerId: string,
  options: {
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  permissions: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const { activeOnly = true, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const where: any = { developerId };

  if (activeOnly) {
    where.OR = [{ expiredAt: null }, { expiredAt: { gt: new Date() } }];
  }

  const [permissions, total] = await Promise.all([
    prisma.developerResourcePermission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            fileType: true,
            isPremium: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.developerResourcePermission.count({ where }),
  ]);

  return {
    permissions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
