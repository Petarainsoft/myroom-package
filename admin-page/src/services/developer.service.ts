import api from './api';

export interface Developer {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isPremium: boolean;
  price?: number;
}

export interface DeveloperPermission {
  id: string;
  developerId: string;
  categoryId: string;
  isPaid: boolean;
  paidAmount?: number;
  grantedAt: string;
  expiredAt?: string;
  category: Category;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const DeveloperService = {
  async getDevelopers(page = 1, limit = 20, search = ''): Promise<PaginatedResponse<Developer>> {
    const res = await api.get('/admin/developers', {
      params: { page, limit, search },
    });
    
    // Backend returns: { success, data, pagination: { total, page, limit, pages } }
    // Convert to frontend format: { data, total, page, limit }
    return {
      data: res.data.data,
      total: res.data.pagination.total,
      page: res.data.pagination.page,
      limit: res.data.pagination.limit,
    };
  },

  async suspendDeveloper(id: string) {
    await api.post(`/admin/developers/${id}/suspend`, { reason: 'Suspended by admin' });
  },

  async activateDeveloper(id: string) {
    await api.post(`/admin/developers/${id}/activate`);
  },

  // Permission management methods
  async getDeveloperPermissions(developerId: string): Promise<{ developer: Developer; permissions: DeveloperPermission[] }> {
    const res = await api.get(`/admin/developers/${developerId}/category-permissions`);
    return res.data.data;
  },

  async grantPermission(developerId: string, data: {
    categoryId: string;
    isPaid?: boolean;
    paidAmount?: number;
    expiredAt?: string;
  }): Promise<DeveloperPermission> {
    const res = await api.post(`/admin/developers/${developerId}/category-permissions`, data);
    return res.data.data;
  },

  async revokePermission(developerId: string, categoryId: string) {
    await api.delete(`/admin/developers/${developerId}/category-permissions/${categoryId}`);
  },

  async getAvailableCategories(): Promise<Category[]> {
    const res = await api.get('/admin/categories');
    return res.data.data;
  },
};