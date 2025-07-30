// MyRoom System - React Component Library
// Main entry point for the library

// Import Babylon.js loaders to ensure they are available
import '@babylonjs/loaders';
import '@babylonjs/loaders/glTF';

// Core Components
export { MyRoom } from './components/MyRoom';
export { AvatarSystem } from './components/AvatarSystem';
export { RoomManager } from './components/RoomManager';
export { ItemController } from './components/ItemController';
export { ConfigurationPanel } from './components/ConfigurationPanel';

// Advanced UI Components
export { default as InteractiveRoom } from '../shared/components/babylon/InteractiveRoom';

// Hooks
export { useMyRoom } from './hooks/useMyRoom';
export { useAvatar } from './hooks/useAvatar';
export { useRoom } from './hooks/useRoom';
export { useItems } from './hooks/useItems';
export { useScene } from './hooks/useScene';

// Types
export type {
  MyRoomProps,
  AvatarConfig,
  RoomConfig,
  ItemConfig,
  SceneConfig,
  MyRoomRef
} from './types';

// Utilities
export {
  createDefaultConfig,
  validateConfig,
  mergeConfigs
} from './utils';

// Constants
export {
  DEFAULT_ROOM_CONFIG,
  DEFAULT_AVATAR_CONFIG,
  SUPPORTED_FORMATS
} from './constants';

// Version
export const VERSION = '1.0.0';