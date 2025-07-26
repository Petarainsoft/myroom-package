import api from './api';

export interface RoomResource {
  id: string;
  name: string;
  description?: string;
  s3Url: string;
  s3Key: string;
  fileSize: number;
  fileType: string;
  category: string;
  roomTypeId: string;
  version: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium: boolean;
  isFree: boolean;
  price?: number;
  status: string;
  metadata: Record<string, any>;
  tags: string[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  resourcePath?: string; // Add resourcePath to include room type's resource_path
}

export interface RoomResourceQuery {
  category?: string;
  roomTypeId?: string;
  status?: string;
  isPremium?: boolean;
  isFree?: boolean;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'category' | 'roomTypeId';
  sortOrder?: 'asc' | 'desc';
  includeUsage?: boolean;
  includePermissions?: boolean;
  includeUploadedBy?: boolean;
}

export interface CreateRoomResourceRequest {
  name: string;
  description?: string;
  roomTypeId: string;
  version?: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium?: boolean;
  isFree?: boolean;
  price?: number;
  metadata?: Record<string, any>;
  tags?: string[];
  keywords?: string[];
}

export interface UpdateRoomResourceRequest {
  name?: string;
  description?: string;
  category?: string;
  roomTypeId?: string;
  version?: string;
  uniquePath?: string;
  resourceId?: string;
  isPremium?: boolean;
  isFree?: boolean;
  price?: number;
  status?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  keywords?: string[];
}

export interface RoomResourceStats {
  totalResources: number;
  totalByCategory: Record<string, number>;
  totalByRoomType: Record<string, number>;
  totalByStatus: Record<string, number>;
  premiumResources: number;
  freeResources: number;
  totalUsage: number;
  totalPermissions: number;
}

export interface FormDataObject {
  [key: string]: string | number | boolean | any[] | null | undefined;
}

class RoomService {
  // Room Resources
  async getRoomResources(query: RoomResourceQuery = {}): Promise<{
    data: RoomResource[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
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

    const response = await api.get(`/rooms?${params.toString()}`);
    return response.data;
  }

  async getRoomResourceById(id: string): Promise<RoomResource> {
    const response = await api.get(`/rooms/${id}`);
    return response.data.data;
  }



  async processFormData(data: FormDataObject): FormData {
    const formData = new FormData();
    console.log('Processing form data fields...');

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        console.log(`Skipping undefined/null field: ${key}`);
        return;
      }

      if (Array.isArray(value)) {
        console.log(`Processing array field: ${key}, items: ${value.length}`);
        value.forEach((v, index) => {
          console.log(`  - Adding ${key}[${index}]: ${v}`);
          formData.append(`${key}[]`, v.toString());
        });
      } else if (typeof value === 'boolean') {
        console.log(`Adding boolean field: ${key}=${value}`);
        formData.append(key, value.toString());
      } else if (typeof value === 'object') {
        console.log(`Adding object field: ${key}`);
        formData.append(key, JSON.stringify(value));
      } else {
        console.log(`Adding field: ${key}=${value}`);
        formData.append(key, value.toString());
      }
    });

    return formData;
  }

  async createRoomResource(data: CreateRoomResourceRequest, file: File): Promise<RoomResource> {
    console.log('=== START createRoomResource ===');
    console.log('Input data:', JSON.stringify(data, null, 2));
    
    const formData = new FormData();
    
    // Log file info before MIME type check
    console.log('Validating file:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Kiểm tra MIME type
    if (file.type !== 'model/gltf-binary' && !file.name.toLowerCase().endsWith('.glb')) {
      console.error('MIME type validation failed:', { 
        fileType: file.type, 
        fileName: file.name,
        expectedType: 'model/gltf-binary',
        hasGlbExtension: file.name.toLowerCase().endsWith('.glb')
      });
      throw new Error('Only GLB files are allowed');
    }
    console.log('MIME type validation passed');
    
    // Thêm file vào formData
    formData.append('file', file);
    console.log('File added to FormData');
    
    // Log file details for debugging
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Ensure all required fields are present
    console.log('Checking required fields...');
    if (!data.name) {
      const derivedName = file.name.substring(0, file.name.lastIndexOf('.'));
      console.log(`Name not provided, using derived name: ${derivedName}`);
      data.name = derivedName;
    }
    
    if (!data.roomTypeId) {
      console.error('Room type ID is missing');
      throw new Error('Room type ID is required');
    }
    console.log('Required fields validation passed');
    
    // Set default values for optional fields if not provided
    console.log('Setting default values for optional fields...');
    if (data.isPremium === undefined) {
      console.log('isPremium not provided, setting to false');
      data.isPremium = false;
    }
    if (data.isFree === undefined) {
      console.log('isFree not provided, setting to true');
      data.isFree = true;
    }
    if (!data.version) {
      console.log('version not provided, setting to 1.0.0');
      data.version = '1.0.0';
    }
    
    // Xử lý các trường dữ liệu khác
    console.log('Processing form data fields...');
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Xử lý mảng đúng cách cho backend
          console.log(`Processing array field: ${key}, items: ${value.length}`);
          value.forEach((v, index) => {
            console.log(`  - Adding ${key}[${index}]: ${v}`);
            // Sử dụng đúng định dạng mảng mà backend mong đợi
            formData.append(`${key}[]`, v.toString());
          });
        } else if (typeof value === 'boolean') {
          console.log(`Adding boolean field: ${key}=${value}`);
          // FormData tự động chuyển đổi tất cả thành chuỗi, nhưng backend cần boolean thực sự
          // Sử dụng JSON.stringify để chuyển đổi boolean thành "true"/"false" mà backend có thể phân tích
          formData.append(key, value.toString());
        } else {
          console.log(`Adding field: ${key}=${value}`);
          formData.append(key, value.toString());
        }
      } else {
        console.log(`Skipping undefined/null field: ${key}`);
      }
    });
    
    // Log form data for debugging
    console.log('=== Form data entries ===');
    const formDataEntries = [];
    for (const pair of formData.entries()) {
      const entryValue = typeof pair[1] === 'string' ? pair[1] : '[File or complex data]';
      console.log(`${pair[0]}: ${entryValue}`);
      formDataEntries.push({ key: pair[0], value: entryValue });
    }
    console.log('Form data summary:', formDataEntries);

    try {
      console.log('Sending POST request to /rooms...');
      console.time('API request duration');
      const response = await api.post('/rooms', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.timeEnd('API request duration');
      
      console.log('Request successful, response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data structure:', Object.keys(response.data));
      console.log('=== END createRoomResource (Success) ===');
      
      return response.data.data;
    } catch (error) {
      console.error('=== ERROR in createRoomResource ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.response) {
        console.error('Response error details:');
        console.error('- Status:', error.response.status);
        console.error('- Status text:', error.response.statusText);
        console.error('- Headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
        
        // Detailed validation errors if available
        if (error.response.data && error.response.data.details) {
          console.error('Validation errors:');
          console.table(error.response.data.details);
        }
      } else if (error.request) {
        console.error('Request error (no response received):');
        console.error('- Request details:', error.request);
        console.error('- Request method:', error.config?.method);
        console.error('- Request URL:', error.config?.url);
        console.error('- Request headers:', error.config?.headers);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      console.error('=== END createRoomResource (Error) ===');
      throw error;
    }
  }

  async updateRoomResource(id: string, data: UpdateRoomResourceRequest): Promise<RoomResource> {
    console.log('=== START updateRoomResource ===');
    console.log('Resource ID:', id);
    console.log('Update data:', JSON.stringify(data, null, 2));
    
    try {
      console.log('Sending PUT request to /rooms/' + id);
      console.time('Update API request duration');
      const response = await api.put(`/rooms/${id}`, data);
      console.timeEnd('Update API request duration');
      
      console.log('Update successful, response status:', response.status);
      console.log('Response data structure:', Object.keys(response.data));
      console.log('=== END updateRoomResource (Success) ===');
      
      return response.data.data;
    } catch (error) {
      console.error('=== ERROR in updateRoomResource ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response error details:');
        console.error('- Status:', error.response.status);
        console.error('- Status text:', error.response.statusText);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
        
        // Detailed validation errors if available
        if (error.response.data && error.response.data.details) {
          console.error('Validation errors:');
          console.table(error.response.data.details);
        }
      } else if (error.request) {
        console.error('Request error (no response received)');
        console.error('- Request method:', error.config?.method);
        console.error('- Request URL:', error.config?.url);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      console.error('=== END updateRoomResource (Error) ===');
      throw error;
    }
  }

  async deleteRoomResource(id: string): Promise<void> {
    console.log('=== START deleteRoomResource ===');
    console.log('Deleting resource with ID:', id);
    
    try {
      console.log('Sending DELETE request to /rooms/' + id);
      console.time('Delete API request duration');
      const response = await api.delete(`/rooms/${id}`);
      console.timeEnd('Delete API request duration');
      
      console.log('Delete successful, response status:', response.status);
      console.log('=== END deleteRoomResource (Success) ===');
    } catch (error) {
      console.error('=== ERROR in deleteRoomResource ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response error details:');
        console.error('- Status:', error.response.status);
        console.error('- Status text:', error.response.statusText);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Request error (no response received)');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      console.error('=== END deleteRoomResource (Error) ===');
      throw error;
    }
  }

  async downloadRoomResource(id: string): Promise<{downloadUrl: string; filename: string; expiresAt: string}> {
    console.log('=== START downloadRoomResource ===');
    console.log('Requesting download for resource ID:', id);
    
    try {
      console.log('Sending GET request to /rooms/' + id + '/download');
      console.time('Download API request duration');
      const response = await api.get(`/rooms/${id}/download`);
      console.timeEnd('Download API request duration');
      
      console.log('Download request successful, response status:', response.status);
      console.log('Download URL info:', {
        hasUrl: !!response.data.data.downloadUrl,
        filename: response.data.data.filename,
        expiresAt: response.data.data.expiresAt
      });
      console.log('=== END downloadRoomResource (Success) ===');
      
      return response.data.data;
    } catch (error) {
      console.error('=== ERROR in downloadRoomResource ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response error details:');
        console.error('- Status:', error.response.status);
        console.error('- Status text:', error.response.statusText);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Request error (no response received)');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      console.error('=== END downloadRoomResource (Error) ===');
      throw error;
    }
  }

  async getRoomResourcesByCategory(category: string): Promise<RoomResource[]> {
    console.log('=== START getRoomResourcesByCategory ===');
    console.log('Fetching resources for category:', category);
    
    try {
      console.log('Sending GET request to /rooms/category/' + category);
      console.time('Category API request duration');
      const response = await api.get(`/rooms/category/${category}`);
      console.timeEnd('Category API request duration');
      
      const resources = response.data.data;
      console.log(`Retrieved ${resources.length} resources for category ${category}`);
      console.log('=== END getRoomResourcesByCategory (Success) ===');
      
      return resources;
    } catch (error) {
      console.error('=== ERROR in getRoomResourcesByCategory ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response error details:');
        console.error('- Status:', error.response.status);
        console.error('- Status text:', error.response.statusText);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Request error (no response received)');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      console.error('=== END getRoomResourcesByCategory (Error) ===');
      throw error;
    }
  }

  async getRoomResourcesByRoomType(roomTypeId: string): Promise<RoomResource[]> {
    console.log('=== START getRoomResourcesByRoomType ===');
    console.log('Fetching resources for room type ID:', roomTypeId);
    
    try {
      console.log('Sending GET request to /rooms/type/' + roomTypeId);
      console.time('Room type API request duration');
      const response = await api.get(`/rooms/type/${roomTypeId}`);
      console.timeEnd('Room type API request duration');
      
      const resources = response.data.data;
      console.log(`Retrieved ${resources.length} resources for room type ${roomTypeId}`);
      console.log('=== END getRoomResourcesByRoomType (Success) ===');
      
      return resources;
    } catch (error) {
      console.error('=== ERROR in getRoomResourcesByRoomType ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response error details:');
        console.error('- Status:', error.response.status);
        console.error('- Status text:', error.response.statusText);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Request error (no response received)');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      console.error('=== END getRoomResourcesByRoomType (Error) ===');
      throw error;
    }
  }

  async getRoomResourceStats(): Promise<RoomResourceStats> {
    console.log('=== START getRoomResourceStats ===');
    
    try {
      console.log('Sending GET request to /rooms/stats');
      console.time('Stats API request duration');
      const response = await api.get('/rooms/stats');
      console.timeEnd('Stats API request duration');
      
      console.log('Stats retrieved successfully');
      console.log('Stats data:', JSON.stringify(response.data.data, null, 2));
      console.log('=== END getRoomResourceStats (Success) ===');
      
      return response.data.data;
    } catch (error) {
      console.error('=== ERROR in getRoomResourceStats ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response error details:');
        console.error('- Status:', error.response.status);
        console.error('- Status text:', error.response.statusText);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Request error (no response received)');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      console.error('=== END getRoomResourceStats (Error) ===');
      throw error;
    }
  }

  // Helper methods for categories and room types
  getAvailableCategories(): string[] {
    return [
      'Furniture',
      'Decoration',
      'Lighting',
      'Electronics',
      'Plants',
      'Artwork',
      'Textiles',
      'Storage',
      'Appliances',
      'Other'
    ];
  }

  getAvailableRoomTypes(): Promise<{ id: string; name: string; label: string; resource_path: string }[]> {
    return this.getRoomTypes();
  }

  async getRoomTypes(): Promise<{ id: string; name: string; label: string; resource_path: string }[]> {
    const response = await api.get('/rooms/types');
    return response.data.data;
  }

  async createRoomType(data: { name: string; label: string; description?: string; resource_path: string }): Promise<{ id: string; name: string; label: string; resource_path: string }> {
    const response = await api.post('/rooms/types', data);
    return response.data.data;
  }

  async updateRoomType(id: string, data: { name?: string; label?: string; description?: string; resource_path?: string }): Promise<{ id: string; name: string; label: string; resource_path: string }> {
    const response = await api.put(`/rooms/types/${id}`, data);
    return response.data.data;
  }

  async deleteRoomType(id: string): Promise<void> {
    await api.delete(`/rooms/types/${id}`);
  }
}

export default new RoomService();