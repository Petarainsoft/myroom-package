import api from './api';

export interface AvatarCategory {
  id: string;
  name: string;
  description?: string;
  categoryType: 'gender' | 'part_type';
  parentId?: string;
  level: number;
  path?: string;
  sortOrder: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  children?: AvatarCategory[];
}

export interface AvatarResource {
  id: string;
  name: string;
  description?: string;
  s3Url: string;
  fileSize: string;
  fileType: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  partType: 'BODY' | 'HAIR' | 'TOP' | 'BOTTOM' | 'SHOES' | 'ACCESSORY' | 'FULLSET';
  version: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium: boolean;
  isFree: boolean;
  price?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  tags: string[];
  keywords: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  category?: AvatarCategory;
}

export interface AvatarResourceQuery {
  gender?: string;
  partType?: string;
  categoryId?: string;
  status?: string;
  isPremium?: boolean;
  isFree?: boolean;
  tags?: string[];
  keywords?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAvatarResourceRequest {
  name: string;
  description?: string;
  gender: string;
  partType: string;
  categoryId?: string;
  version?: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium?: boolean;
  isFree?: boolean;
  price?: number;
  tags?: string[];
  keywords?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateAvatarResourceRequest {
  name?: string;
  description?: string;
  gender?: string;
  partType?: string;
  categoryId?: string;
  version?: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium?: boolean;
  isFree?: boolean;
  price?: number;
  status?: string;
  tags?: string[];
  keywords?: string[];
  metadata?: Record<string, any>;
}

export interface CreateAvatarCategoryRequest {
  name: string;
  description?: string;
  categoryType: 'gender' | 'part_type';
  parentId?: string;
  sortOrder?: number;
  metadata?: Record<string, any>;
}

export interface UpdateAvatarCategoryRequest {
  name?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

class AvatarService {
  // Avatar Categories
  async getAvatarCategories(): Promise<AvatarCategory[]> {
    const response = await api.get('/admin/avatar/categories');
    return response.data.data;
  }

  async createAvatarCategory(data: CreateAvatarCategoryRequest): Promise<AvatarCategory> {
    const response = await api.post('/admin/avatar/categories', data);
    return response.data.data;
  }

  async updateAvatarCategory(id: string, data: UpdateAvatarCategoryRequest): Promise<AvatarCategory> {
    const response = await api.put(`/admin/avatar/categories/${id}`, data);
    return response.data.data;
  }

  async deleteAvatarCategory(id: string): Promise<void> {
    await api.delete(`/admin/avatar/categories/${id}`);
  }

  // Avatar Resources
  async getAvatarResources(query: AvatarResourceQuery = {}): Promise<{
    resources: AvatarResource[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/admin/avatar/resources?${params.toString()}`);
    return response.data.data;
  }

  async getAvatarResourceById(id: string): Promise<AvatarResource> {
    const response = await api.get(`/admin/avatar/resources/${id}`);
    return response.data.data;
  }

  async createAvatarResource(data: CreateAvatarResourceRequest, file: File): Promise<AvatarResource> {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Xử lý mảng đúng cách cho backend
          value.forEach((v, index) => {
            // Sử dụng đúng định dạng mảng mà backend mong đợi
            formData.append(`${key}[]`, v.toString());
          });
        } else if (typeof value === 'boolean') {
          // Xử lý boolean đúng cách cho backend
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await api.post('/admin/avatar/resources', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async updateAvatarResource(id: string, data: UpdateAvatarResourceRequest): Promise<AvatarResource> {
    const response = await api.put(`/admin/avatar/resources/${id}`, data);
    return response.data.data;
  }

  async deleteAvatarResource(id: string): Promise<void> {
    await api.delete(`/admin/avatar/resources/${id}`);
  }

  async downloadAvatarResource(id: string): Promise<Blob> {
    const response = await api.get(`/admin/avatar/resources/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new AvatarService();