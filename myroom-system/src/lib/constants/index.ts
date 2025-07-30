import { RoomConfig, AvatarConfigProps, SceneConfig } from '../types';
import { AvatarConfig } from '../../shared/types/AvatarTypes';

// Default room configuration - now using resourceIds for backend API
export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  defaultRoom: 'relax-mr_khroom_0001',
  availableRooms: [
    'relax-mr_khroom_0001',
    'relax-mr_khroom_0002',
    'relax-mr_khroom_0003'
  ],
  autoLoad: true,
  enableRoomSwitching: true,
  roomAssetPath: 'rooms/'
};

// Default avatar configuration
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  gender: 'male',
  parts: {
    body: null,
    hair: null,
    top: null,
    bottom: null,
    shoes: null,
    accessory: null
  },
  colors: {
    hair: '#000000',
    top: '#ffffff',
    bottom: '#000000',
    shoes: '#000000',
    accessory: '#ffffff'
  }
};

// Default avatar props configuration
export const DEFAULT_AVATAR_PROPS_CONFIG: AvatarConfigProps = {
  defaultGender: 'male',
  enableCustomization: true,
  enableMovement: true,
  enableAnimations: true,
  avatarAssetPath: 'avatars/'
};

// Default scene configuration
export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  enablePostProcessing: true,
  enableSkybox: true,
  enableShadows: true,
  enableLighting: true,
  cameraSettings: {
    position: { x: 0, y: 5, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    fov: 0.8,
    minDistance: 2,
    maxDistance: 50
  },
  renderSettings: {
    antialias: true,
    adaptToDeviceRatio: true,
    powerPreference: 'high-performance'
  }
};

// Supported file formats
export const SUPPORTED_FORMATS = {
  models: ['.glb', '.gltf', '.babylon'],
  textures: ['.jpg', '.jpeg', '.png', '.dds', '.hdr'],
  animations: ['.glb', '.gltf', '.babylon']
};

// Asset paths - using relative paths for backend API
export const ASSET_PATHS = {
  rooms: 'rooms/',
  avatars: 'avatars/',
  items: 'items/',
  animations: 'animations/',
  textures: 'textures/',
  manifests: 'manifests/'
};

// Animation names
export const AVATAR_ANIMATIONS = {
  idle: 'idle',
  walk: 'walk',
  run: 'run',
  jump: 'jump',
  wave: 'wave',
  dance: 'dance',
  turnLeft: 'turnLeft',
  turnRight: 'turnRight'
};

// Item categories
export const ITEM_CATEGORIES = {
  bedroom: 'Bedroom',
  culinary: 'Culinary',
  decoration: 'Decoration',
  lounge: 'Lounge',
  other: 'Other'
};

// Room categories
export const ROOM_CATEGORIES = ['Exercise', 'Living', 'Relax'];

// Gender options
export const GENDER_OPTIONS = ['male', 'female'] as const;

// Gizmo modes
export const GIZMO_MODES = {
  position: 'position',
  rotation: 'rotation',
  scale: 'scale'
} as const;

// Event types
export const EVENT_TYPES = {
  SCENE_READY: 'scene-ready',
  AVATAR_CHANGE: 'avatar-change',
  ROOM_CHANGE: 'room-change',
  ITEM_ADD: 'item-add',
  ITEM_REMOVE: 'item-remove',
  ITEM_UPDATE: 'item-update',
  ERROR: 'error'
} as const;

// Error codes for the library
export const ERROR_CODES = {
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  
  // Room errors
  ROOM_LOAD_FAILED: 'ROOM_LOAD_FAILED',
  ROOM_UPDATE_FAILED: 'ROOM_UPDATE_FAILED',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  
  // Avatar errors
  AVATAR_LOAD_FAILED: 'AVATAR_LOAD_FAILED',
  AVATAR_UPDATE_FAILED: 'AVATAR_UPDATE_FAILED',
  ANIMATION_FAILED: 'ANIMATION_FAILED',
  
  // Item errors
  ITEM_LOAD_FAILED: 'ITEM_LOAD_FAILED',
  ITEM_UPDATE_FAILED: 'ITEM_UPDATE_FAILED',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  
  // Scene errors
  SCENE_INIT_FAILED: 'SCENE_INIT_FAILED',
  SCENE_UPDATE_FAILED: 'SCENE_UPDATE_FAILED',
  RENDER_FAILED: 'RENDER_FAILED',
  
  // Camera errors
  CAMERA_UPDATE_FAILED: 'CAMERA_UPDATE_FAILED',
  CAMERA_INIT_FAILED: 'CAMERA_INIT_FAILED'
} as const;

// Default dimensions
export const DEFAULT_DIMENSIONS = {
  canvas: {
    width: 800,
    height: 600
  },
  room: {
    width: 20,
    height: 10,
    depth: 20
  }
};

// Performance settings
export const PERFORMANCE_SETTINGS = {
  maxItems: 50,
  maxTextures: 100,
  maxAnimations: 20,
  renderTargetSize: 1024,
  shadowMapSize: 1024
};

// Default camera configuration
export const DEFAULT_CAMERA_CONFIG = {
  type: 'arcRotate' as const,
  position: { x: 0, y: 5, z: 10 },
  target: { x: 0, y: 0, z: 0 },
  fov: 0.8,
  minZ: 0.1,
  maxZ: 1000,
  wheelPrecision: 50,
  pinchPrecision: 200,
  panningSensibility: 1000,
  angularSensibilityX: 1000,
  angularSensibilityY: 1000,
  radius: 10,
  alpha: 0,
  beta: Math.PI / 3,
  lowerRadiusLimit: 2,
  upperRadiusLimit: 50,
  lowerAlphaLimit: null,
  upperAlphaLimit: null,
  lowerBetaLimit: 0.1,
  upperBetaLimit: Math.PI / 2
};

// Library metadata
export const LIBRARY_INFO = {
  name: 'MyRoom System',
  version: '1.0.0',
  description: 'A comprehensive React component library for 3D room and avatar visualization',
  author: 'MyRoom Team',
  license: 'MIT'
};