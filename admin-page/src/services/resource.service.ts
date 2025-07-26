import api from './api';

export interface ItemCategory {
  id: string;
  name: string;
  description?: string;
  isPremium: boolean;
  path?: string;
  level?: number;
  parentId?: string;
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
  s3Url: string;
  s3Key: string;
  fileSize: number;
  fileType: string;
  mimeType?: string;
  categoryId: string;
  category?: ItemCategory;
  resourceId: string;
  ownerProjectId?: string;
  ownerProject?: { id: string; name: string };
  uploadedByAdminId?: string;
  uploadedBy?: { id: string; name: string; email: string };
  accessPolicy: 'PUBLIC' | 'PRIVATE' | 'PROJECT_ONLY' | 'CUSTOMERS_ONLY';
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  version?: string;
  tags?: string[];
  keywords?: string[];
  metadata?: any;
  slug?: string;
  checksum?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  isPremium: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const ResourceService = {
  async getResources(page = 1, limit = 20, search = '', categoryId?: string): Promise<PaginatedResponse<Resource>> {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    
    console.group('🔍 ResourceService.getResources');
    console.log('📋 Input parameters:', {
      page,
      limit,
      search,
      categoryId,
      categoryIdType: typeof categoryId,
      categoryIdLength: categoryId?.length,
      isCategoryIdEmpty: !categoryId,
      finalParams: params
    });
    
    try {
      console.log('🌐 Making API call to /admin/resources with params:', params);
      const res = await api.get('/admin/resources', { params });
      
      console.log('✅ Raw API response:', {
        status: res.status,
        success: res.data.success,
        dataKeys: Object.keys(res.data.data || {}),
        hasResources: !!res.data.data?.resources,
        resourcesLength: res.data.data?.resources?.length,
        hasPagination: !!res.data.data?.pagination,
        pagination: res.data.data?.pagination
      });
      
      // Handle the correct response structure from ResourceManagementService
      const responseData = res.data.data;
      
      // Transform resources to handle BigInt values and ensure compatibility
      const transformedResources = (responseData.resources || []).map((resource: any) => ({
        ...resource,
        // Convert BigInt fileSize to number for frontend compatibility
        fileSize: typeof resource.fileSize === 'bigint' ? Number(resource.fileSize) : resource.fileSize,
        // Ensure categoryId is available
        categoryId: resource.categoryId || resource.category?.id
      }));
      
      console.log('🔄 After transformation:', {
        originalCount: responseData.resources?.length || 0,
        transformedCount: transformedResources.length,
        firstResourceCategories: transformedResources.slice(0, 3).map((r: any) => ({
          id: r.id,
          name: r.name,
          categoryId: r.categoryId,
          categoryName: r.category?.name
        })),
        appliedFilter: categoryId,
        totalFromAPI: responseData.pagination?.total
      });
      
      const result = {
        data: transformedResources,
        total: responseData.pagination?.total || 0,
        page: responseData.pagination?.page || page,
        limit: responseData.pagination?.limit || limit,
      };
      
      console.log('📊 Final result:', {
        returnedCount: result.data.length,
        total: result.total,
        page: result.page,
        limit: result.limit,
        filterEffective: categoryId ? `Filtering by: ${categoryId}` : 'No filter applied'
      });
      console.groupEnd();
      
      return result;
    } catch (error: any) {
      console.error('❌ ResourceService.getResources failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        params,
        url: error.config?.url,
        method: error.config?.method
      });
      console.groupEnd();
      throw error;
    }
  },

  async uploadResource(file: File, name: string, type: string, categoryId?: string, isPremium?: boolean) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    // formData.append('fileType', file.type);
    formData.append('fileType', 'mode/gltf-binary');
    
    // Only append categoryId if it's actually provided and not undefined/empty
    if (categoryId && categoryId.trim() !== '') {
      formData.append('categoryId', categoryId);
    }
    
    // Append isPremium flag - using JSON.stringify to convert boolean to "true"/"false"
    formData.append('isPremium', JSON.stringify(isPremium || false));

    // Log what we're sending for debugging
    console.log('📤 Uploading resource:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      name,
      type,
      categoryId,
      hasToken: !!localStorage.getItem('adminToken')
    });

    try {
      // FormData will be handled automatically by the interceptor
      const res = await api.post('/admin/resource/upload', formData);
      console.log('✅ Upload successful:', res.data);
      return res.data;
    } catch (error: any) {
      console.error('❌ Upload failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  async deleteResource(id: string) {
    await api.delete(`/admin/resource/${id}`);
  },

  async getResource(id: string): Promise<Resource> {
    const res = await api.get(`/admin/resources/${id}`);
    return res.data.data;
  },

  async updateResource(id: string, data: Partial<Resource>): Promise<Resource> {
    const res = await api.put(`/admin/resources/${id}`, data);
    return res.data.data;
  },

  async getPreviewUrl(id: string): Promise<{ downloadUrl: string; expiresAt: string }> {
    const res = await api.get(`/admin/resources/${id}/preview`);
    return res.data.data;
  },

  async downloadResource(id: string): Promise<{downloadUrl: string; filename: string; expiresAt: string}> {
    const res = await api.get(`/admin/resources/${id}/download`);
    return res.data.data;
  },
};