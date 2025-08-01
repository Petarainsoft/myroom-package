import { AvatarConfig } from '../../shared/types/AvatarTypes';
import { UseAvatarReturn } from '../types';
/**
 * Hook for avatar management functionality
 * Provides methods to load, configure, and animate avatars
 */
export declare function useAvatar(initialConfig?: Partial<AvatarConfig>): UseAvatarReturn;
