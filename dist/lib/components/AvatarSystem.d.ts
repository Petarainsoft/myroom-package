import { default as React } from 'react';
import { AvatarConfig } from '../../shared/types/AvatarTypes';
export interface AvatarSystemProps {
    /** Initial avatar configuration */
    config?: Partial<AvatarConfig>;
    /** Callback when avatar is loaded */
    onAvatarLoaded?: (avatar: any) => void;
    /** Callback when animation changes */
    onAnimationChanged?: (animation: string) => void;
    /** Callback when avatar configuration updates */
    onConfigChanged?: (config: AvatarConfig) => void;
    /** Callback for errors */
    onError?: (error: Error) => void;
    /** Whether to auto-load the avatar on mount */
    autoLoad?: boolean;
    /** CSS class name for styling */
    className?: string;
    /** Custom styles */
    style?: React.CSSProperties;
}
export interface AvatarSystemRef {
    /** Load avatar with configuration */
    loadAvatar: (config: Partial<AvatarConfig>) => Promise<void>;
    /** Update avatar configuration */
    updateConfig: (updates: Partial<AvatarConfig>) => Promise<void>;
    /** Play animation */
    playAnimation: (animationName: string, loop?: boolean) => Promise<void>;
    /** Stop current animation */
    stopAnimation: () => void;
    /** Change avatar gender */
    changeGender: (gender: 'male' | 'female') => Promise<void>;
    /** Change avatar outfit */
    changeOutfit: (outfitId: string) => Promise<void>;
    /** Set avatar position */
    setPosition: (x: number, y: number, z: number) => void;
    /** Set avatar rotation */
    setRotation: (x: number, y: number, z: number) => void;
    /** Reset avatar to default state */
    reset: () => void;
    /** Get current avatar configuration */
    getConfig: () => AvatarConfig;
    /** Get available animations */
    getAvailableAnimations: () => string[];
    /** Get current animation */
    getCurrentAnimation: () => string | null;
    /** Check if avatar is loading */
    isLoading: () => boolean;
    /** Get current error */
    getError: () => Error | null;
}
/**
 * AvatarSystem Component
 *
 * A React component that provides avatar management functionality.
 * This component wraps the useAvatar hook and provides a clean interface
 * for managing 3D avatars in the MyRoom system.
 */
export declare const AvatarSystem: React.ForwardRefExoticComponent<AvatarSystemProps & React.RefAttributes<AvatarSystemRef>>;
export default AvatarSystem;
