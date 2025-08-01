import { AvatarConfig } from '../../shared/types/AvatarTypes';
import { ItemConfig, UseMyRoomReturn } from '../types';
/**
 * Main hook for MyRoom component functionality
 * Provides centralized state management and methods for room, avatar, and items
 */
export declare function useMyRoom(initialConfig?: {
    roomId?: string;
    avatarConfig?: AvatarConfig;
    items?: ItemConfig[];
}): UseMyRoomReturn;
