import { RoomConfig, AvatarConfigProps, SceneConfig, ItemConfig, MyRoomExportConfig } from '../types';
import { DEFAULT_ROOM_CONFIG, DEFAULT_AVATAR_CONFIG, DEFAULT_SCENE_CONFIG, ERROR_CODES } from '../constants';

/**
 * Deep merge two configuration objects
 */
export function mergeConfigs<T extends Record<string, any>>(defaultConfig: T, userConfig: Partial<T>): T {
  const result = { ...defaultConfig };
  
  for (const key in userConfig) {
    if (userConfig.hasOwnProperty(key)) {
      const userValue = userConfig[key];
      const defaultValue = defaultConfig[key];
      
      if (userValue !== undefined) {
        if (typeof userValue === 'object' && userValue !== null && !Array.isArray(userValue) &&
            typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
          result[key] = mergeConfigs(defaultValue, userValue);
        } else {
          result[key] = userValue;
        }
      }
    }
  }
  
  return result;
}

/**
 * Create default configuration for MyRoom component
 */
export function createDefaultConfig() {
  return {
    roomConfig: { ...DEFAULT_ROOM_CONFIG },
    avatarConfig: { ...DEFAULT_AVATAR_CONFIG },
    sceneConfig: { ...DEFAULT_SCENE_CONFIG }
  };
}

/**
 * Validate room configuration
 */
export function validateRoomConfig(config: RoomConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.defaultRoom) {
    errors.push('defaultRoom is required');
  }
  
  if (config.availableRooms && !Array.isArray(config.availableRooms)) {
    errors.push('availableRooms must be an array');
  }
  
  if (config.defaultRoom && config.availableRooms && !config.availableRooms.includes(config.defaultRoom)) {
    errors.push('defaultRoom must be included in availableRooms');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate avatar configuration
 */
export function validateAvatarConfig(config: AvatarConfigProps): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.defaultGender && !['male', 'female'].includes(config.defaultGender)) {
    errors.push('defaultGender must be "male" or "female"');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate scene configuration
 */
export function validateSceneConfig(config: SceneConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.cameraSettings) {
    const { cameraSettings } = config;
    
    if (cameraSettings.fov && (cameraSettings.fov <= 0 || cameraSettings.fov > Math.PI)) {
      errors.push('Camera FOV must be between 0 and π');
    }
    
    if (cameraSettings.minDistance && cameraSettings.maxDistance && 
        cameraSettings.minDistance >= cameraSettings.maxDistance) {
      errors.push('Camera minDistance must be less than maxDistance');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate complete configuration
 */
export function validateConfig(config: {
  roomConfig?: RoomConfig;
  avatarConfig?: AvatarConfigProps;
  sceneConfig?: SceneConfig;
}): { isValid: boolean; errors: string[] } {
  const allErrors: string[] = [];
  
  if (config.roomConfig) {
    const roomValidation = validateRoomConfig(config.roomConfig);
    allErrors.push(...roomValidation.errors.map(err => `Room: ${err}`));
  }
  
  if (config.avatarConfig) {
    const avatarValidation = validateAvatarConfig(config.avatarConfig);
    allErrors.push(...avatarValidation.errors.map(err => `Avatar: ${err}`));
  }
  
  if (config.sceneConfig) {
    const sceneValidation = validateSceneConfig(config.sceneConfig);
    allErrors.push(...sceneValidation.errors.map(err => `Scene: ${err}`));
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Generate unique ID for items
 */
export function generateId(prefix: string = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if a URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file extension is supported
 */
export function isSupportedFormat(filename: string, type: 'models' | 'textures' | 'animations'): boolean {
  const supportedFormats = {
    models: ['.glb', '.gltf', '.babylon'],
    textures: ['.jpg', '.jpeg', '.png', '.dds', '.hdr'],
    animations: ['.glb', '.gltf', '.babylon']
  };
  
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return supportedFormats[type].includes(extension);
}

/**
 * Create error object with code and message
 */
export function createError(code: keyof typeof ERROR_CODES, message: string, details?: any): Error {
  const error = new Error(message) as any;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Export configuration to JSON string
 */
export function exportConfigToJson(config: MyRoomExportConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Import configuration from JSON string
 */
export function importConfigFromJson(jsonString: string): MyRoomExportConfig {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw createError('INVALID_CONFIG', 'Invalid JSON configuration', error);
  }
}

/**
 * Get asset URL with proper domain handling
 */
export function getAssetUrl(path: string, customDomain?: string): string {
  if (isValidUrl(path)) {
    return path;
  }
  
  const baseDomain = customDomain || window.location.origin;
  return `${baseDomain}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Log with timestamp for debugging
 */
export function debugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    console.log(`[MyRoom ${timestamp}] ${message}`, data || '');
  }
}