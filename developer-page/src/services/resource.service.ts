import api, { resourceApi } from "./api";

export interface Resource {
  id: string;
  name: string;
  // Backend returns `fileType`; keep both for compatibility
  fileType?: string;
  type?: string; // Mapped from fileType for UI convenience
  url?: string;
  ownerProjectId?: string;
  accessPolicy?: "public" | "private" | "project-only" | "customers-only";
  categoryId?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
  price?: number;
}

export interface ItemCategory {
  id: string;
  name: string;
  description?: string;
  isPremium: boolean;
  price?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadInfo {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  expiresIn: number;
}

const ResourceService = {
  // Get resources accessible to the current project
  getAccessibleResources: async (projectId: string): Promise<Resource[]> => {
    // This endpoint doesn't exist - need to use resource search instead
    const response = await resourceApi.get("/resource/search", {
      params: { projectId, page: 1, limit: 100 },
    });
    return (response.data.data.resources || []).map((r: any) => ({
      ...r,
      type: r.type || r.fileType || "other",
    }));
  },

  // Get a specific resource by ID
  getResource: async (id: string): Promise<Resource> => {
    const response = await api.get(`/resource/${id}/basic`);
    const r = response.data.data;
    return { ...r, type: r.type || r.fileType || "other" };
  },

  // Search resources with filters
  searchResources: async (params: {
    category?: string;
    type?: string;
    query?: string;
  }): Promise<Resource[]> => {
    const searchParams = {
      // Use wildcard "*" when no concrete query so backend returns all
      q:
        params.query && params.query.trim().length > 0
          ? params.query.trim()
          : "*",
      page: 1,
      limit: 100,
      ...(params.category && { categoryId: params.category }),
      ...(params.type && { type: params.type }),
    };

    const response = await resourceApi.get("/resource/search", {
      params: searchParams,
    });

    // Map backend's `fileType` to `type` so existing UI works
    const resources: Resource[] = (response.data.data.resources || []).map(
      (r: any) => ({
        ...r,
        type: r.type || r.fileType || "other",
      })
    );

    return resources;
  },

  // Get all categories accessible to the developer
  getCategories: async (): Promise<ItemCategory[]> => {
    const response = await resourceApi.get("/resource/categories", {
      params: { page: 1, limit: 100 },
    });
    return response.data.data.categories || [];
  },

  // Get resources in a specific category
  getCategoryResources: async (categoryId: string): Promise<Resource[]> => {
    const response = await resourceApi.get(
      `/resource/categories/${categoryId}/resources`,
      {
        params: { page: 1, limit: 100 },
      }
    );
    return (response.data.data.resources || []).map((r: any) => ({
      ...r,
      type: r.type || r.fileType || "other",
    }));
  },

  // Get all category permissions for the current developer
  getCategoryPermissions: async (): Promise<any[]> => {
    // This endpoint doesn't exist yet - will be added to backend
    try {
      const response = await api.get("/developer/category-permissions");
      return response.data.data || [];
    } catch (error) {
      console.warn("Category permissions endpoint not implemented yet");
      return [];
    }
  },

  // Get download URL for a resource
  getDownloadUrl: async (resourceId: string): Promise<DownloadInfo> => {
    const response = await resourceApi.get(`/resource/${resourceId}/download`);
    return response.data.data;
  },

  // Get preview URL (JWT based) for viewing model
  getPreviewUrl: async (resourceId: string): Promise<DownloadInfo> => {
    const response = await api.get(`/resource/${resourceId}/preview`);
    return response.data.data;
  },

  // Download a resource directly
  downloadResource: async (resourceId: string): Promise<void> => {
    try {
      const downloadInfo = await ResourceService.getDownloadUrl(resourceId);

      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = downloadInfo.downloadUrl;
      link.download = downloadInfo.fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  },

  // Check if user has download permission for a resource
  checkDownloadPermission: async (
    resourceId: string
  ): Promise<{ canDownload: boolean; reason?: string }> => {
    try {
      const response = await resourceApi.get(
        `/resource/${resourceId}/download-permission`
      );
      return response.data.data;
    } catch (error) {
      // For now, assume user can download if they can access the resource
      try {
        await ResourceService.getResource(resourceId);
        return { canDownload: true };
      } catch {
        return { canDownload: false, reason: "Resource not accessible" };
      }
    }
  },
};

export default ResourceService;
