// ManifestService - Service for loading manifest data
import { domainConfig } from '../config/appConfig';
import { PresetConfig } from '../types/PresetConfig';

interface Room {
  id?: string;
  name: string;
  resourceId: string;
  path: string;
}

interface Item {
  id: string;
  name: string;
  resourceId: string;
  path: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}

interface RoomsManifest {
  rooms: Room[];
}

interface ItemsManifest {
  items: Item[];
}

class ManifestService {
  private static instance: ManifestService;
  private roomsCache: RoomsManifest | null = null;
  private itemsCache: ItemsManifest | null = null;
  private presetCache: PresetConfig | null = null;
  private apiBaseUrl: string;
  private apiKey: string;
  private projectId: string;

  private constructor() {
    // Configuration for API access
    // These can be set via window.MYROOM_CONFIG or environment variables
    this.apiBaseUrl = this.getConfigValue('apiBaseUrl', domainConfig.backendDomain);
    this.apiKey = this.getConfigValue('apiKey', domainConfig.apiKey);
    this.projectId = this.getConfigValue('projectId', '');
  }

  private getConfigValue(key: string, defaultValue: string): string {
    // Check window.MYROOM_CONFIG first
    if (typeof window !== 'undefined' && (window as any).MYROOM_CONFIG && (window as any).MYROOM_CONFIG[key]) {
      return (window as any).MYROOM_CONFIG[key];
    }
    
    // Check environment variables (for build-time configuration)
    // Only check process.env if it exists (build-time)
    if (typeof process !== 'undefined' && process.env) {
      const envKey = `REACT_APP_${key.toUpperCase()}`;
      if (process.env[envKey]) {
        return process.env[envKey] as string;
      }
    }
    
    return defaultValue;
  }

  public static getInstance(): ManifestService {
    if (!ManifestService.instance) {
      ManifestService.instance = new ManifestService();
    }
    return ManifestService.instance;
  }

  /**
   * Configure API settings for backend communication
   */
  public configure(apiBaseUrl: string, apiKey: string, projectId: string): void {
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
    this.projectId = projectId;
    this.clearCache(); // Clear cache when configuration changes
  }

  /**
   * Load preset configuration from backend API or fallback to local file
   */
  private async loadPresetConfig(presetName: string = 'default-preset'): Promise<PresetConfig> {
    if (this.presetCache) {
      return this.presetCache;
    }

    try {
      // Import domain config to check useResourceId setting
      const { domainConfig } = await import('../config/appConfig');
      
      // Only try to load from backend API if useResourceId is enabled
      if (domainConfig.useResourceId && this.apiKey && this.projectId) {
        const response = await fetch(
          `${this.apiBaseUrl}/api/manifest/projects/${this.projectId}/presets/${presetName}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.config) {
            this.presetCache = result.data.config;
            console.log('✅ Loaded preset from backend API:', presetName);
            return this.presetCache;
          }
        } else if (response.status === 404) {
          console.warn(`⚠️  Preset '${presetName}' not found in backend, falling back to local file`);
        } else {
          console.warn('⚠️  Failed to load preset from backend, falling back to local file');
        }
      }

      // Load from local file (when useResourceId is false or as fallback)
      console.log('📁 Loading preset from local file...');
      const response = await fetch('/preset/default-preset.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.presetCache = data;
      return data;
      
    } catch (error) {
      console.error('❌ Failed to load preset configuration:', error);
      
      // Return a minimal default configuration
      const fallbackConfig: PresetConfig = {
        version: '1.0',
        timestamp: Date.now(),
        room: {
          name: 'Default Room',
          path: '',
          resourceId: ''
        },
        avatar: {
          gender: 'male'
        },
        items: []
      };
      
      return fallbackConfig;
    }
  }

  /**
   * Load rooms manifest from backend API or local file
   */
  public async loadRoomsManifest(presetName: string = 'default-preset'): Promise<RoomsManifest> {
    if (this.roomsCache) {
      return this.roomsCache;
    }

    try {
      // Import domain config to check useResourceId setting
      const { domainConfig } = await import('../config/appConfig');
      
      // If useResourceId is false, load directly from room-manifest.json like myroom-systemc
      if (!domainConfig.useResourceId) {
        console.log('📁 Loading rooms from local manifest file...');
        const response = await fetch('/manifest/room/room-manifest.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform the data to match expected format
        const rooms: Room[] = data.rooms.map((room: any) => ({
          id: room.id,
          name: room.name,
          resourceId: room.id, // Use id as resourceId for backward compatibility
          path: room.modelPath
        }));
        
        const roomsManifest: RoomsManifest = { rooms };
        this.roomsCache = roomsManifest;
        return roomsManifest;
      }
      
      // Otherwise, load from preset (for useResourceId = true)
      const presetConfig = await this.loadPresetConfig(presetName);
      
      // Extract room data from the preset
      const rooms: Room[] = [];
      if (presetConfig.room) {
        rooms.push({
          id: presetConfig.room.resourceId || 'default-room',
          name: presetConfig.room.name || 'Default Room',
          resourceId: presetConfig.room.resourceId || '',
          path: presetConfig.room.path || ''
        });
      }
      
      const roomsManifest: RoomsManifest = {
        rooms
      };
      
      this.roomsCache = roomsManifest;
      return roomsManifest;
    } catch (error) {
      console.error('Failed to load rooms manifest:', error);
      return { rooms: [] };
    }
  }

  /**
   * Load items manifest from backend API or local file
   */
  public async loadItemsManifest(presetName: string = 'default-preset'): Promise<ItemsManifest> {
    if (this.itemsCache) {
      return this.itemsCache;
    }

    try {
      // Import domain config to check useResourceId setting
      const { domainConfig } = await import('../config/appConfig');
      
      // If useResourceId is false, load directly from items-manifest.json like myroom-systemc
      if (!domainConfig.useResourceId) {
        console.log('📁 Loading items from local manifest file...');
        const response = await fetch('/manifest/item/items-manifest.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform the data to match expected format
        const items: Item[] = data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          resourceId: item.id, // Use id as resourceId for backward compatibility
          path: item.modelPath
        }));
        
        const itemsManifest: ItemsManifest = { items };
        this.itemsCache = itemsManifest;
        return itemsManifest;
      }
      
      // Otherwise, load from preset (for useResourceId = true)
      const presetConfig = await this.loadPresetConfig(presetName);
      
      // Extract items data from the preset
      const items: Item[] = presetConfig.items || [];
      
      const itemsManifest: ItemsManifest = {
        items
      };
      
      this.itemsCache = itemsManifest;
      return itemsManifest;
    } catch (error) {
      console.error('Failed to load items manifest:', error);
      return { items: [] };
    }
  }

  /**
   * Load complete preset configuration
   */
  public async loadPreset(presetName: string = 'default-preset'): Promise<PresetConfig> {
    return await this.loadPresetConfig(presetName);
  }

  /**
   * Load avatar configuration from preset
   */
  public async loadAvatarConfig(presetName: string = 'default-preset'): Promise<any> {
    try {
      const presetConfig = await this.loadPresetConfig(presetName);
      return presetConfig.avatar || { gender: 'male' };
    } catch (error) {
      console.error('Failed to load avatar config:', error);
      return { gender: 'male' };
    }
  }

  /**
   * Load room configuration from preset
   */
  public async loadRoomConfig(presetName: string = 'default-preset'): Promise<any> {
    try {
      const presetConfig = await this.loadPresetConfig(presetName);
      return presetConfig.room || { name: 'Default Room', path: '', resourceId: '' };
    } catch (error) {
      console.error('Failed to load room config:', error);
      return { name: 'Default Room', path: '', resourceId: '' };
    }
  }

  /**
   * Create a new preset configuration via API
   */
  public async createPreset(name: string, config: PresetConfig, description?: string): Promise<boolean> {
    if (!this.apiKey || !this.projectId) {
      console.error('❌ API key and project ID are required to create presets');
      return false;
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/manifest/projects/${this.projectId}/presets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description: description || `Preset configuration: ${name}`,
            config,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Preset created successfully:', result.data);
        this.clearCache(); // Clear cache to force reload
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Failed to create preset:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error creating preset:', error);
      return false;
    }
  }

  /**
   * List all presets for the current project
   */
  public async listPresets(): Promise<any[]> {
    if (!this.apiKey || !this.projectId) {
      console.error('❌ API key and project ID are required to list presets');
      return [];
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/manifest/projects/${this.projectId}/presets?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.data?.presets || [];
      } else {
        console.error('❌ Failed to list presets');
        return [];
      }
    } catch (error) {
      console.error('❌ Error listing presets:', error);
      return [];
    }
  }

  /**
   * Update an existing preset configuration via API
   */
  public async updatePreset(presetId: string, name: string, config: PresetConfig, description?: string): Promise<boolean> {
    if (!this.apiKey || !this.projectId) {
      console.error('❌ API key and project ID are required to update presets');
      return false;
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/manifest/${presetId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description: description || `Updated preset configuration: ${name}`,
            manifestData: config,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Preset updated successfully:', result.data);
        this.clearCache(); // Clear cache to force reload
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Failed to update preset:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating preset:', error);
      return false;
    }
  }

  /**
   * Delete a preset via API
   */
  public async deletePreset(presetId: string): Promise<boolean> {
    if (!this.apiKey || !this.projectId) {
      console.error('❌ API key and project ID are required to delete presets');
      return false;
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/manifest/${presetId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        console.log('✅ Preset deleted successfully');
        this.clearCache(); // Clear cache to force reload
        return true;
      } else {
        const error = await response.json();
        console.error('❌ Failed to delete preset:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting preset:', error);
      return false;
    }
  }

  /**
   * Get a specific preset by ID
   */
  public async getPreset(presetId: string): Promise<PresetConfig | null> {
    if (!this.apiKey || !this.projectId) {
      console.error('❌ API key and project ID are required to get preset');
      return null;
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/manifest/${presetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.data?.config || null;
      } else {
        console.error('❌ Failed to get preset');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting preset:', error);
      return null;
    }
  }

  /**
   * Get a specific preset by ID (alias for getPreset)
   */
  public async getPresetById(presetId: string): Promise<PresetConfig | null> {
    return this.getPreset(presetId);
  }

  /**
   * Apply a preset configuration to the scene
   */
  public async applyPreset(presetName: string): Promise<PresetConfig | null> {
    try {
      const config = await this.loadPresetConfig(presetName);
      this.clearCache(); // Clear cache to ensure fresh data
      return config;
    } catch (error) {
      console.error('❌ Error applying preset:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.roomsCache = null;
    this.itemsCache = null;
    this.presetCache = null;
  }
}

// Export singleton instance
export const manifestService = ManifestService.getInstance();
export default manifestService;
export type { Room, Item, RoomsManifest, ItemsManifest };