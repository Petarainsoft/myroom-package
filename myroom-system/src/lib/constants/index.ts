import { RoomConfig, AvatarConfigProps, SceneConfig } from '../types';

// Default room configuration
export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  defaultRoom: '/models/rooms/cate001/MR_KHROOM_0001.glb',
  availableRooms: [
    '/models/rooms/cate001/MR_KHROOM_0001.glb',
    '/models/rooms/cate001/MR_KHROOM_0002.glb',
    '/models/rooms/cate002/MR_KHROOM_0003.glb'
  ],
  autoLoad: true,
  enableRoomSwitching: true,
  roomAssetPath: '/models/rooms/'
};

// Default avatar configuration
export const DEFAULT_AVATAR_CONFIG: AvatarConfigProps = {
  defaultGender: 'male',
  enableCustomization: true,
  enableMovement: true,
  enableAnimations: true,
  avatarAssetPath: '/models/'
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

// Asset paths
export const ASSET_PATHS = {
  rooms: '/models/rooms/',
  avatars: '/models/',
  items: '/models/items/',
  animations: '/animations/',
  textures: '/textures/',
  manifests: '/manifest/'
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
export const ROOM_CATEGORIES = {
  exercise: 'Exercise',
  living: 'Living',
  relax: 'Relax'
};

// Gender options
export const GENDER_OPTIONS = {
  male: 'male',
  female: 'female'
} as const;

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

// Error codes
export const ERROR_CODES = {
  SCENE_INIT_FAILED: 'SCENE_INIT_FAILED',
  ROOM_LOAD_FAILED: 'ROOM_LOAD_FAILED',
  AVATAR_LOAD_FAILED: 'AVATAR_LOAD_FAILED',
  ITEM_LOAD_FAILED: 'ITEM_LOAD_FAILED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  NETWORK_ERROR: 'NETWORK_ERROR'
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

// Library metadata
export const LIBRARY_INFO = {
  name: 'MyRoom System',
  version: '1.0.0',
  description: 'A comprehensive React component library for 3D room and avatar visualization',
  author: 'MyRoom Team',
  license: 'MIT'
};