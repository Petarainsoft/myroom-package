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
    // Project ID will be determined from apiKey by backend, no need to store it
    this.projectId = '';
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
  public configure(apiBaseUrl: string, apiKey: string): void {
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
    // Project ID will be determined from apiKey by backend
    this.clearCache(); // Clear cache when configuration changes
  }

  /**
   * Load preset configuration from hardcoded data
   */
  private async loadPresetConfig(presetName: string = 'default-preset'): Promise<PresetConfig> {
    if (this.presetCache) {
      return this.presetCache;
    }

    // Hardcoded default preset configuration - uses resourceId for backend API calls
    console.log('📁 Loading preset from hardcoded configuration...');
    const hardcodedConfig: PresetConfig = {
      version: '1.0',
      timestamp: new Date('2025-07-21T16:30:24.571Z').getTime(),
      room: {
        name: 'Living Room',
        path: '/models/rooms/cate001/MR_KHROOM_0001.glb',
        resourceId: 'relax-mr_khroom_0001'
      },
      avatar: {
        gender: 'male',
        parts: {
          body: {
            path: '/models/male/male_body/male_body.glb',
            resourceId: 'male-male_body-male_body'
          },
          hair: {
            path: '/models/male/male_hair/male_hair_001.glb',
            resourceId: 'male-male_hair-male_hair_001'
          },
          top: {
            path: '/models/male/male_top/male_top_001.glb',
            resourceId: 'male-male_top-male_top_001'
          },
          bottom: {
            path: '/models/male/male_bottom/male_bottom_001.glb',
            resourceId: 'male-male_bottom-male_bottom_001'
          },
          shoes: {
            path: '/models/male/male_shoes/male_shoes_001.glb',
            resourceId: 'male-male_shoes-male_shoes_001'
          },
          fullset: null,
          accessory: null
        },
        colors: {
          hair: '#4A301B',
          top: '#1E90FF'
        }
      },
      items: [],
      usage: {
        description: 'This manifest provides GLB paths and resourceIds for flexible asset loading',
        when_using_backend: 'ResourceIds are automatically used by loaders when backend is configured',
        when_using_local: 'Path properties are used as fallback for local asset loading'
      }
    };
    
    this.presetCache = hardcodedConfig;
    console.log('✅ Loaded hardcoded preset configuration:', hardcodedConfig);
    return hardcodedConfig;
  }

  /**
   * Load rooms manifest from preset configuration
   */
  public async loadRoomsManifest(presetName: string = 'default-preset'): Promise<RoomsManifest> {
    if (this.roomsCache) {
      return this.roomsCache;
    }

    try {
      // Always load from preset configuration
      console.log('📁 Loading rooms from preset configuration...');
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
   * Load items manifest from preset configuration
   */
  public async loadItemsManifest(presetName: string = 'default-preset'): Promise<ItemsManifest> {
    if (this.itemsCache) {
      return this.itemsCache;
    }

    try {
      // Always load from preset configuration
      console.log('📁 Loading items from preset configuration...');
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
    if (!this.apiKey) {
      console.error('❌ API key is required to create presets');
      throw new Error('API key is required to create presets');
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/manifest/presets`,
        {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey,
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
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to create preset:', errorData);
        throw new Error(errorData.message || 'Failed to create preset');
      }
    } catch (error) {
      console.error('❌ Error creating preset:', error);
      throw error;
    }
  }

  /**
   * List all presets for the current project
   */
  public async listPresets(): Promise<any[]> {
    if (!this.apiKey) {
      console.error('❌ API key is required to list presets');
      return [];
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/manifest/presets?limit=100&sortBy=updatedAt&sortOrder=desc`,
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.data?.presets || [];
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to list presets:', errorData.message || response.statusText);
        throw new Error(errorData.message || 'Failed to load manifests');
      }
    } catch (error) {
      console.error('❌ Error listing presets:', error);
      throw error;
    }
  }

  /**
   * Update an existing preset configuration via API
   */
  public async updatePreset(presetId: string, name: string, config: PresetConfig, description?: string): Promise<boolean> {
    if (!this.apiKey) {
      console.error('❌ API key is required to update presets');
      throw new Error('API key is required to update presets');
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/manifest/presets/${presetId}`,
        {
          method: 'PUT',
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description: description || `Updated preset configuration: ${name}`,
            config,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Preset updated successfully:', result.data);
        this.clearCache(); // Clear cache to force reload
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to update preset:', errorData);
        throw new Error(errorData.message || 'Failed to update preset');
      }
    } catch (error) {
      console.error('❌ Error updating preset:', error);
      throw error;
    }
  }

  /**
   * Delete a preset via API
   */
  public async deletePreset(presetId: string): Promise<boolean> {
    if (!this.apiKey) {
      console.error('❌ API key is required to delete presets');
      throw new Error('API key is required to delete presets');
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/manifest/${presetId}`,
        {
          method: 'DELETE',
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        console.log('✅ Preset deleted successfully');
        this.clearCache(); // Clear cache to force reload
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to delete preset:', errorData);
        throw new Error(errorData.message || 'Failed to delete preset');
      }
    } catch (error) {
      console.error('❌ Error deleting preset:', error);
      throw error;
    }
  }

  /**
   * Get a specific preset by ID
   */
  public async getPreset(presetId: string): Promise<PresetConfig | null> {
    if (!this.apiKey) {
      console.error('❌ API key is required to get preset');
      throw new Error('API key is required to get preset');
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/manifest/${presetId}`,
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.data?.config || null;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to get preset:', errorData);
        throw new Error(errorData.message || 'Failed to get preset');
      }
    } catch (error) {
      console.error('❌ Error getting preset:', error);
      throw error;
    }
  }

  /**
   * Get a specific preset by ID (alias for getPreset)
   */
  public async getPresetById(presetId: string): Promise<PresetConfig | null> {
    return this.getPreset(presetId);
  }

  // Removed loadLocalPreset method - all presets now use backend API or hardcoded configuration

  /**
   * Get the latest preset (most recently updated)
   */
  public async getLatestPreset(): Promise<any | null> {
    try {
      const presets = await this.listPresets();
      if (presets.length === 0) {
        return null;
      }
      
      // Presets are already sorted by updatedAt desc from listPresets
      return presets[0];
    } catch (error) {
      console.error('❌ Error getting latest preset:', error);
      return null;
    }
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

// Export class and singleton instance
export { ManifestService };
export const manifestService = ManifestService.getInstance();
export default manifestService;
export type { Room, Item, RoomsManifest, ItemsManifest };