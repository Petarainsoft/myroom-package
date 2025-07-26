import api from './api';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  projectId: string;
  scopes: string[];
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface CreateApiKey {
  name: string;
  projectId: string;
  scopes?: string[];
  expiresAt?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const ApiKeyService = {
  async getApiKeys(page = 1, limit = 20): Promise<PaginatedResponse<ApiKey>> {
    const res = await api.get('/developer/api-keys', {
      params: { page, limit },
    });
    return res.data;
  },

  async createApiKey(data: CreateApiKey): Promise<ApiKey> {
    const res = await api.post('/developer/api-keys', {
      name: data.name,
      projectId: data.projectId,
      scopes: data.scopes || ['read', 'write'], // Default scopes
      ...(data.expiresAt && { expiresAt: data.expiresAt })
    });
    return res.data.data;
  },

  async deleteApiKey(id: string): Promise<void> {
    await api.delete(`/developer/api-keys/${id}`);
  },

  async activateApiKey(id: string): Promise<void> {
    await api.post(`/developer/api-keys/${id}/activate`);
  },

  async deactivateApiKey(id: string): Promise<void> {
    await api.post(`/developer/api-keys/${id}/deactivate`);
  },

  async regenerateApiKey(id: string): Promise<{ key: string }> {
    const res = await api.post(`/developer/api-keys/${id}/regenerate`);
    return res.data.data;
  },
};