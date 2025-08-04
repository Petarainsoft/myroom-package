import { RoomConfig, AvatarConfigProps, SceneConfig, MyRoomExportConfig } from '../types';
import { ERROR_CODES } from '../constants';
/**
 * Deep merge two configuration objects
 */
export declare function mergeConfigs<T extends Record<string, any>>(defaultConfig: T, userConfig: Partial<T>): T;
/**
 * Create default configuration for MyRoom component
 */
export declare function createDefaultConfig(): {
    roomConfig: {
        id?: string;
        defaultRoom?: string;
        availableRooms?: string[];
        autoLoad?: boolean;
        enableRoomSwitching?: boolean;
        roomAssetPath?: string;
        category?: string;
        url?: string;
        background?: string;
        lighting?: {
            intensity?: number;
            color?: string;
            shadows?: boolean;
        };
        materials?: {
            floor?: string;
            walls?: string;
            ceiling?: string;
        };
    };
    avatarConfig: {
        gender: import('../../shared/types/AvatarTypes').Gender;
        parts: import('../../shared/types/AvatarTypes').AvatarPartPaths;
        colors: import('../../shared/types/AvatarTypes').AvatarColors;
        resourceIds?: import('../../shared/types/AvatarTypes').AvatarPartPaths;
        url?: string;
        outfitId?: string;
    };
    sceneConfig: {
        enablePostProcessing?: boolean;
        enableSkybox?: boolean;
        enableShadows?: boolean;
        enableLighting?: boolean;
        background?: string;
        physics?: {
            enabled?: boolean;
            gravity?: number;
        };
        shadows?: boolean;
        cameraSettings?: import('../types').CameraConfig;
        renderSettings?: import('../types').RenderConfig;
    };
};
/**
 * Validate room configuration
 */
export declare function validateRoomConfig(config: RoomConfig): {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate avatar configuration
 */
export declare function validateAvatarConfig(config: AvatarConfigProps): {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate scene configuration
 */
export declare function validateSceneConfig(config: SceneConfig): {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate complete configuration
 */
export declare function validateConfig(config: {
    roomConfig?: RoomConfig;
    avatarConfig?: AvatarConfigProps;
    sceneConfig?: SceneConfig;
}): {
    isValid: boolean;
    errors: string[];
};
/**
 * Generate unique ID for items
 */
export declare function generateId(prefix?: string): string;
/**
 * Format file size in human readable format
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Check if a URL is valid
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Check if a file extension is supported
 */
export declare function isSupportedFormat(filename: string, type: 'models' | 'textures' | 'animations'): boolean;
/**
 * Create error object with code and message
 */
export declare function createError(code: keyof typeof ERROR_CODES, message: string, details?: any): Error;
/**
 * Debounce function for performance optimization
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Throttle function for performance optimization
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Convert degrees to radians
 */
export declare function degreesToRadians(degrees: number): number;
/**
 * Convert radians to degrees
 */
export declare function radiansToDegrees(radians: number): number;
/**
 * Clamp a value between min and max
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * Linear interpolation between two values
 */
export declare function lerp(start: number, end: number, factor: number): number;
/**
 * Export configuration to JSON string
 */
export declare function exportConfigToJson(config: MyRoomExportConfig): string;
/**
 * Import configuration from JSON string
 */
export declare function importConfigFromJson(jsonString: string): MyRoomExportConfig;
/**
 * Get asset URL with proper domain handling
 */
export declare function getAssetUrl(path: string, customDomain?: string): string;
/**
 * Log with timestamp for debugging
 */
export declare function debugLog(message: string, data?: any): void;
