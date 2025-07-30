/**
 * MyRoom Library Components
 * 
 * This module exports all the React components for the MyRoom library.
 * These components provide ready-to-use interfaces for different aspects
 * of the 3D room system.
 */

// Main component
export { MyRoom } from './MyRoom';
export type { MyRoomProps, MyRoomRef } from '../types';

// System components
export { AvatarSystem } from './AvatarSystem';
export type { AvatarSystemProps, AvatarSystemRef } from './AvatarSystem';

export { RoomManager } from './RoomManager';
export type { RoomManagerProps, RoomManagerRef } from './RoomManager';

export { ItemController } from './ItemController';
export type { ItemControllerProps, ItemControllerRef } from './ItemController';

export { ConfigurationPanel } from './ConfigurationPanel';
export type { ConfigurationPanelProps } from './ConfigurationPanel';

export { OverlayUI } from './OverlayUI';
export type { OverlayUIProps } from './OverlayUI';

/**
 * Component Usage Examples:
 * 
 * ```tsx
 * import { MyRoom, AvatarSystem, RoomManager, ItemController, ConfigurationPanel } from '@myroom/react';
 * 
 * // Main component - provides complete 3D room functionality
 * <MyRoom
 *   roomId="living-room"
 *   avatarConfig={{ gender: 'female' }}
 *   onSceneReady={(scene) => console.log('Scene ready', scene)}
 * />
 * 
 * // Individual system components for granular control
 * <AvatarSystem
 *   config={{ gender: 'male' }}
 *   onAvatarLoaded={(avatar) => console.log('Avatar loaded', avatar)}
 * />
 * 
 * <RoomManager
 *   roomId="bedroom"
 *   onRoomLoaded={(room) => console.log('Room loaded', room)}
 * />
 * 
 * <ItemController
 *   initialItems={[{ name: 'Chair', category: 'furniture' }]}
 *   onItemAdded={(item) => console.log('Item added', item)}
 * />
 * 
 * <ConfigurationPanel
 *   roomConfig={roomConfig}
 *   avatarConfig={avatarConfig}
 *   onRoomConfigChange={(config) => setRoomConfig(config)}
 * />
 * ```
 */