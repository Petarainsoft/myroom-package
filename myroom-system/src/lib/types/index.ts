import { CSSProperties } from 'react';
import { AvatarConfig } from '../../shared/types/AvatarTypes';

// Main MyRoom component props
export interface MyRoomProps {
  // Room configuration
  roomConfig?: RoomConfig;
  
  // Avatar configuration
  avatarConfig?: AvatarConfigProps;
  
  // Scene configuration
  sceneConfig?: SceneConfig;
  
  // UI configuration
  showControls?: boolean;
  compactMode?: boolean;
  ultraCompactMode?: boolean;
  
  // Event callbacks
  onSceneReady?: (scene: any) => void;
  onAvatarChange?: (config: AvatarConfig) => void;
  onRoomChange?: (roomId: string) => void;
  onItemAdd?: (item: ItemConfig) => void;
  onItemRemove?: (itemId: string) => void;
  onError?: (error: Error) => void;
  
  // Style
  className?: string;
  style?: CSSProperties;
  
  // Advanced options
  enableDebug?: boolean;
  customDomain?: string;
  apiEndpoint?: string;
}

// Room configuration
export interface RoomConfig {
  defaultRoom?: string;
  availableRooms?: string[];
  autoLoad?: boolean;
  enableRoomSwitching?: boolean;
  roomAssetPath?: string;
}

// Avatar configuration for props
export interface AvatarConfigProps {
  defaultGender?: 'male' | 'female';
  enableCustomization?: boolean;
  enableMovement?: boolean;
  enableAnimations?: boolean;
  avatarAssetPath?: string;
}

// Scene configuration
export interface SceneConfig {
  enablePostProcessing?: boolean;
  enableSkybox?: boolean;
  enableShadows?: boolean;
  enableLighting?: boolean;
  cameraSettings?: CameraConfig;
  renderSettings?: RenderConfig;
}

// Camera configuration
export interface CameraConfig {
  position?: { x: number; y: number; z: number };
  target?: { x: number; y: number; z: number };
  fov?: number;
  minDistance?: number;
  maxDistance?: number;
}

// Render configuration
export interface RenderConfig {
  antialias?: boolean;
  adaptToDeviceRatio?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
}

// Item configuration
export interface ItemConfig {
  id: string;
  name: string;
  resourceId: string;
  category?: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  metadata?: Record<string, any>;
}

// MyRoom component ref methods
export interface MyRoomRef {
  // Scene control methods
  getScene: () => any;
  isSceneReady: () => boolean;
  
  // Room methods
  changeRoom: (roomId: string) => void;
  getCurrentRoom: () => string;
  
  // Avatar methods
  updateAvatar: (config: Partial<AvatarConfig>) => void;
  getCurrentAvatar: () => AvatarConfig;
  
  // Item methods
  addItem: (item: ItemConfig) => void;
  removeItem: (itemId: string) => void;
  getItems: () => ItemConfig[];
  
  // Utility methods
  exportConfig: () => MyRoomExportConfig;
  importConfig: (config: MyRoomExportConfig) => void;
  takeScreenshot: () => string | null;
}

// Export configuration
export interface MyRoomExportConfig {
  room: string;
  avatar: AvatarConfig;
  items: ItemConfig[];
  metadata?: Record<string, any>;
}

// Hook return types
export interface UseMyRoomReturn {
  scene: any;
  isReady: boolean;
  error: Error | null;
  changeRoom: (roomId: string) => void;
  updateAvatar: (config: Partial<AvatarConfig>) => void;
  addItem: (item: ItemConfig) => void;
  removeItem: (itemId: string) => void;
}

export interface UseAvatarReturn {
  config: AvatarConfig;
  updateConfig: (config: Partial<AvatarConfig>) => void;
  isLoading: boolean;
  error: Error | null;
}

export interface UseRoomReturn {
  currentRoom: string;
  availableRooms: string[];
  changeRoom: (roomId: string) => void;
  isLoading: boolean;
  error: Error | null;
}

export interface UseItemsReturn {
  items: ItemConfig[];
  availableItems: any[];
  addItem: (item: ItemConfig) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<ItemConfig>) => void;
  isLoading: boolean;
  error: Error | null;
}

export interface UseSceneReturn {
  scene: any;
  engine: any;
  canvas: HTMLCanvasElement | null;
  isReady: boolean;
  error: Error | null;
}

// Event types
export interface MyRoomEvent<T = any> {
  type: string;
  data: T;
  timestamp: number;
}

export interface SceneReadyEvent extends MyRoomEvent {
  type: 'scene-ready';
  data: {
    scene: any;
    engine: any;
    canvas: HTMLCanvasElement;
  };
}

export interface AvatarChangeEvent extends MyRoomEvent {
  type: 'avatar-change';
  data: {
    config: AvatarConfig;
    previousConfig: AvatarConfig;
  };
}

export interface RoomChangeEvent extends MyRoomEvent {
  type: 'room-change';
  data: {
    roomId: string;
    previousRoomId: string;
  };
}

export interface ItemEvent extends MyRoomEvent {
  type: 'item-add' | 'item-remove' | 'item-update';
  data: {
    item: ItemConfig;
    action: 'add' | 'remove' | 'update';
  };
}