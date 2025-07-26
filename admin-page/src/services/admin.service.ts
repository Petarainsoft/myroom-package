import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateAdminUser {
  email: string;
  name: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
}

export interface UpdateAdminUser {
  email?: string;
  name?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN';
  isActive?: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const AdminService = {
  async getAdmins(page = 1, limit = 20, search = ''): Promise<PaginatedResponse<AdminUser>> {
    const res = await api.get('/admin/admins', {
      params: { page, limit, search },
    });
    
    // Map backend data to frontend interface
    const mappedAdmins = (res.data.data?.admins || []).map((admin: any) => ({
      ...admin,
      isActive: admin.status === 'ACTIVE'
    }));
    
    return {
      data: mappedAdmins,
      total: res.data.data?.pagination?.total || 0,
      page: res.data.data?.pagination?.page || page,
      limit: res.data.data?.pagination?.limit || limit
    };
  },

  async createAdmin(data: CreateAdminUser): Promise<AdminUser> {
    const res = await api.post('/admin/admins', data);
    const admin = res.data.data;
    return {
      ...admin,
      isActive: admin.status === 'ACTIVE'
    };
  },

  async updateAdmin(id: string, data: UpdateAdminUser): Promise<AdminUser> {
    // Convert isActive to status for backend
    const backendData: any = { ...data };
    if (data.isActive !== undefined) {
      backendData.status = data.isActive ? 'ACTIVE' : 'INACTIVE';
      delete backendData.isActive;
    }
    
    const res = await api.put(`/admin/admins/${id}`, backendData);
    const admin = res.data.data;
    return {
      ...admin,
      isActive: admin.status === 'ACTIVE'
    };
  },

  async deleteAdmin(id: string): Promise<void> {
    await api.delete(`/admin/admins/${id}`);
  },

  async activateAdmin(id: string): Promise<void> {
    await api.post(`/admin/admins/${id}/activate`);
  },

  async deactivateAdmin(id: string): Promise<void> {
    await api.post(`/admin/admins/${id}/deactivate`);
  },

  async resetPassword(id: string): Promise<{ temporaryPassword: string }> {
    const res = await api.post(`/admin/admins/${id}/reset-password`);
    return res.data.data;
  },
}; 