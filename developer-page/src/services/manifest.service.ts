import api from './api';

export interface Manifest {
  id: string;
  projectId?: string;
  name: string;
  version: string;
  description?: string;
  config?: any; // Additional metadata
  s3Url?: string;
  s3Key?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ManifestListResponse {
  manifests: Manifest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  project: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface ManifestDetail extends Manifest {
  project?: {
    id: string;
    name: string;
    description?: string;
  };
  downloadUrl?: string;
}

export interface DownloadResponse {
  downloadUrl: string;
  filename: string;
  expiresIn: number;
}

export interface ContentResponse {
  id: string;
  name: string;
  version: string;
  downloadUrl: string;
  expiresIn: number;
}

const ManifestService = {
  // Get all manifests for a project
  getManifests: async (projectId: string, options?: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ManifestListResponse> => {
    const params = new URLSearchParams();
    params.append('page', (options?.page || 1).toString());
    params.append('limit', (options?.limit || 20).toString());
    if (options?.status) params.append('status', options.status);
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
    
    const response = await api.get(`/developer/projects/${projectId}/manifests?${params.toString()}`);
    return response.data.data;
  },

  // Get a specific manifest with download URL
  getManifest: async (manifestId: string): Promise<ManifestDetail> => {
    const response = await api.get(`/manifest/${manifestId}`);
    return response.data.data;
  },

  // Create a new manifest (via main manifest API)
  createManifest: async (projectId: string, data: {
    name: string;
    version?: string;
    description?: string;
    manifestData: any; // The manifest JSON content
    metadata?: any; // Additional metadata
  }): Promise<Manifest> => {
    const response = await api.post(`/manifest/projects/${projectId}/manifests`, {
      name: data.name,
      version: data.version || '1.0.0',
      description: data.description,
      manifestData: data.manifestData,
      metadata: data.metadata,
    });
    return response.data.data;
  },

  // Update an existing manifest (via main manifest API)
  updateManifest: async (manifestId: string, data: {
    name?: string;
    description?: string;
    manifestData?: any;
    metadata?: any;
  }): Promise<Manifest> => {
    const response = await api.put(`/manifest/${manifestId}`, data);
    return response.data.data;
  },

  // Delete a manifest (via main manifest API)
  deleteManifest: async (manifestId: string): Promise<void> => {
    await api.delete(`/manifest/${manifestId}`);
  },

  // Download manifest content (via main manifest API)
  downloadManifest: async (manifestId: string): Promise<DownloadResponse> => {
    const response = await api.get(`/manifest/${manifestId}/download`);
    return response.data.data;
  },

  // Get manifest content directly (via main manifest API)
  getManifestContent: async (manifestId: string): Promise<ContentResponse> => {
    const response = await api.get(`/manifest/${manifestId}/content`);
    return response.data.data;
  },

  // Fetch and parse manifest JSON content from download URL
  fetchManifestContent: async (downloadUrl: string): Promise<any> => {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest content: ${response.statusText}`);
    }
    return response.json();
  },

  // Get manifest details from main API (for editing)
  getManifestDetails: async (manifestId: string): Promise<Manifest> => {
    const response = await api.get(`/manifest/${manifestId}`);
    return response.data.data;
  },

  // Convenience method to get manifest with content
  getManifestWithContent: async (manifestId: string): Promise<{
    manifest: ManifestDetail;
    content: any;
  }> => {
    const manifest = await ManifestService.getManifest(manifestId);
    
    let content = null;
    if (manifest.downloadUrl) {
      try {
        content = await ManifestService.fetchManifestContent(manifest.downloadUrl);
      } catch (error) {
        console.warn('Failed to fetch manifest content:', error);
      }
    }

    return {
      manifest,
      content,
    };
  },

  // Validate manifest JSON structure
  validateManifestData: (manifestData: any): boolean => {
    if (!manifestData || typeof manifestData !== 'object') {
      return false;
    }
    
    // Basic validation - can be extended based on your manifest schema
    return true;
  },

  // Helper to format manifest for display
  formatManifestForDisplay: (manifest: Manifest): {
    id: string;
    name: string;
    version: string;
    description: string;
    status: string;
    createdAt: string;
    size: string;
  } => {
    return {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description || 'No description',
      status: manifest.status,
      createdAt: new Date(manifest.createdAt).toLocaleDateString(),
      size: 'Unknown', // Could be calculated from content
    };
  },
};

export default ManifestService;