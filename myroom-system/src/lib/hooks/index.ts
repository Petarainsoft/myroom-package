/**
 * MyRoom Library Hooks
 * 
 * This module exports all the custom React hooks for the MyRoom library.
 * These hooks provide easy-to-use interfaces for managing different aspects
 * of the 3D room system.
 */

// Main hook for overall MyRoom functionality
export { useMyRoom } from './useMyRoom';

// Specialized hooks for specific systems
export { useAvatar } from './useAvatar';
export { useRoom } from './useRoom';
export { useItems } from './useItems';
export { useScene } from './useScene';

// Re-export types for convenience
export type {
  UseMyRoomReturn,
  UseAvatarReturn,
  UseRoomReturn,
  UseItemsReturn,
  UseSceneReturn
} from '../types';

/**
 * Hook Usage Examples:
 * 
 * ```tsx
 * import { useMyRoom, useAvatar, useRoom, useItems, useScene } from '@myroom/react';
 * 
 * // Main hook - provides centralized functionality
 * const myRoom = useMyRoom({
 *   roomId: 'living-room',
 *   avatarConfig: { gender: 'female' },
 *   items: []
 * });
 * 
 * // Specialized hooks for specific functionality
 * const avatar = useAvatar({ gender: 'male' });
 * const room = useRoom({ lighting: { intensity: 0.8 } });
 * const items = useItems();
 * const scene = useScene({ background: '#87CEEB' });
 * ```
 */