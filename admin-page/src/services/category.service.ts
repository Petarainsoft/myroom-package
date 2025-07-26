import api from './api';

export interface Category {
  id: string;
  name: string;
  isPremium: boolean;
  description?: string;
  createdAt: string;
  parentId?: string | null;
  level?: number;
  path?: string;
  sortOrder?: number;
  isActive?: boolean;
  parent?: {
    id: string;
    name: string;
    path?: string;
  };
  children?: Category[];
  _count?: {
    children: number;
    resources: number;
    permissions?: number;
  };
}

export interface CreateCategoryData {
  name: string;
  isPremium: boolean;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  isPremium?: boolean;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const CategoryService = {
  async getCategories(params?: {
    parentId?: string | null;
    level?: number;
    includeChildren?: boolean;
    search?: string;
    isActive?: boolean;
  }) {
    const res = await api.get('/admin/categories', { params });
    return res.data.data;
  },

  async getCategoryTree() {
    const res = await api.get('/admin/categories', { 
      params: { includeChildren: true, isActive: true } 
    });
    return res.data.data;
  },

  async createCategory(data: CreateCategoryData) {
    const res = await api.post('/admin/categories', data);
    return res.data.data;
  },

  async updateCategory(id: string, data: UpdateCategoryData) {
    const res = await api.put(`/admin/categories/${id}`, data);
    return res.data.data;
  },

  async deleteCategory(id: string) {
    await api.delete(`/admin/categories/${id}`);
  },

  async moveCategory(id: string, newParentId: string | null, newSortOrder?: number) {
    const res = await api.put(`/admin/categories/${id}`, {
      parentId: newParentId,
      sortOrder: newSortOrder
    });
    return res.data.data;
  },
}; 