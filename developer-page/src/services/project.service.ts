import api from './api';

export interface Project {
  id: string;
  name: string;
  description: string;
  developerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  key: string;
  projectId: string;
  name: string; // Changed from label to name to match backend
  scopes: string[];
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

const ProjectService = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/developer/my/projects');
    return response.data.data || [];  // Backend returns array directly in data, not data.projects
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await api.get(`/developer/my/projects/${id}`);
    return response.data.data;
  },

  createProject: async (projectData: { name: string; description: string }): Promise<Project> => {
    const response = await api.post('/developer/my/projects', projectData);
    return response.data.data;
  },

  updateProject: async (id: string, projectData: { name: string; description: string }): Promise<Project> => {
    const response = await api.put(`/developer/my/projects/${id}`, projectData);
    return response.data.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/developer/my/projects/${id}`);
  },

  // API Key management - Fixed to use correct backend endpoints
  getApiKeys: async (projectId?: string): Promise<ApiKey[]> => {
    // Backend endpoint is /developer/api-keys and filters by developer, not project
    const response = await api.get('/developer/api-keys', {
      params: { 
        page: 1, 
        limit: 100, // Get all keys for now
        ...(projectId && { projectId }) // Add projectId filter if provided
      }
    });
    return response.data.data.apiKeys || []; // ✅ Correct path: response.data.data.apiKeys
  },

  createApiKey: async (projectId: string, data: { 
    name: string;
    description?: string;
    scopes?: string[];
    expiresAt?: string;
  }): Promise<ApiKey> => {
    const response = await api.post('/developer/api-keys', {
      name: data.name,
      projectId,
      scopes: data.scopes || ['read', 'write'], // Default scopes matching backend validation
      ...(data.expiresAt && { expiresAt: data.expiresAt })
    });
    return response.data.data;
  },

  revokeApiKey: async (projectId: string, apiKeyId: string): Promise<void> => {
    await api.delete(`/developer/api-keys/${apiKeyId}`);
  },

  // Additional methods that might be useful
  updateApiKey: async (apiKeyId: string, data: { 
    name?: string; 
    scopes?: string[];
  }): Promise<ApiKey> => {
    try {
      const response = await api.put(`/developer/api-keys/${apiKeyId}`, data);
      return response.data.data;
    } catch (error) {
      console.warn('API key update endpoint not implemented yet');
      throw new Error('API key update not available yet');
    }
  },

  setActiveApiKey: async (apiKey: string): Promise<void> => {
    localStorage.setItem('apiKey', apiKey);
  },

  getActiveApiKey: (): string | null => {
    return localStorage.getItem('apiKey');
  },
};

export default ProjectService;