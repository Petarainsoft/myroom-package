// ApiService - Centralized service for backend API calls
import { domainConfig } from '../config/appConfig';

class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  private apiKey: string;

  private constructor() {
    this.baseUrl = domainConfig.backendDomain;
    this.apiKey = domainConfig.apiKey;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Configure API settings
   */
  public configure(baseUrl: string, apiKey: string): void {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * GET request
   */
  public async get(endpoint: string): Promise<any> {
    const response = await this.makeRequest(endpoint, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`API GET request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * POST request
   */
  public async post(endpoint: string, data?: any): Promise<any> {
    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API POST request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * PUT request
   */
  public async put(endpoint: string, data?: any): Promise<any> {
    const response = await this.makeRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API PUT request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * DELETE request
   */
  public async delete(endpoint: string): Promise<any> {
    const response = await this.makeRequest(endpoint, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`API DELETE request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Fetch rooms from backend
   */
  public async getRooms(): Promise<any> {
    try {
      return await this.get('/api/rooms');
    } catch (error) {
      console.error('Failed to fetch rooms from backend:', error);
      throw error;
    }
  }

  /**
   * Fetch default preset from backend
   */
  public async getDefaultPreset(projectId?: string): Promise<any> {
    try {
      const id = projectId || domainConfig.projectId;
      
      const response = await this.get(`/api/manifest/projects/${id}/presets/default-preset`);
      return response;
    } catch (error) {
      console.error('Failed to fetch default preset from backend:', error);
      throw error;
    }
  }

  /**
   * Fetch room by ID
   */
  public async getRoomById(roomId: string): Promise<any> {
    try {
      return await this.get(`/api/rooms/${roomId}`);
    } catch (error) {
      console.error(`Failed to fetch room ${roomId} from backend:`, error);
      throw error;
    }
  }

  /**
   * Fetch avatar categories from backend
   */
  public async getAvatarCategories(): Promise<any> {
    try {
      return await this.get('/api/avatar/categories');
    } catch (error) {
      console.error('Failed to fetch avatar categories from backend:', error);
      throw error;
    }
  }

  /**
   * Fetch avatars by gender and part type
   */
  public async getAvatars(gender?: string, partType?: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (gender) params.append('gender', gender);
      if (partType) params.append('partType', partType);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      return await this.get(`/api/avatar/resources?${params.toString()}`);
    } catch (error) {
      console.error('Failed to fetch avatars from backend:', error);
      throw error;
    }
  }

  /**
   * Fetch item categories from backend
   */
  public async getItemCategories(page: number = 1, limit: number = 50): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      return await this.get(`/api/resource/categories?${params.toString()}`);
    } catch (error) {
      console.error('Failed to fetch item categories from backend:', error);
      throw error;
    }
  }

  /**
   * Fetch items by category
   */
  public async getItemsByCategory(categoryId: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      return await this.get(`/api/resource/categories/${categoryId}/resources?${params.toString()}`);
    } catch (error) {
      console.error(`Failed to fetch items for category ${categoryId} from backend:`, error);
      throw error;
    }
  }

  /**
   * Search items across categories
   */
  public async searchItems(query: string, categoryId?: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (categoryId) params.append('categoryId', categoryId);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      return await this.get(`/api/resource/search?${params.toString()}`);
    } catch (error) {
      console.error('Failed to search items from backend:', error);
      throw error;
    }
  }
}

export default ApiService;