import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { AvatarConfig } from '../../shared/types/AvatarTypes';
import { useAvatar } from '../hooks/useAvatar';
import { debugLog } from '../utils';

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
  getCurrentAnimation: () => string;
  
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
export const AvatarSystem = forwardRef<AvatarSystemRef, AvatarSystemProps>((
  {
    config,
    onAvatarLoaded,
    onAnimationChanged,
    onConfigChanged,
    onError,
    autoLoad = true,
    className,
    style
  },
  ref
) => {
  const avatar = useAvatar(config);
  
  // Set up callbacks
  useEffect(() => {
    avatar.setCallbacks({
      onAvatarLoaded,
      onAnimationChanged,
      onError
    });
  }, [avatar, onAvatarLoaded, onAnimationChanged, onError]);
  
  // Auto-load avatar if enabled
  useEffect(() => {
    if (autoLoad && config) {
      debugLog('Auto-loading avatar', { config });
      avatar.loadAvatar(config).catch(error => {
        debugLog('Auto-load failed', { error });
        onError?.(error);
      });
    }
  }, [autoLoad, config, avatar, onError]);
  
  // Notify parent of config changes
  useEffect(() => {
    onConfigChanged?.(avatar.config);
  }, [avatar.config, onConfigChanged]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    loadAvatar: avatar.loadAvatar,
    updateConfig: avatar.updateConfig,
    playAnimation: avatar.playAnimation,
    stopAnimation: avatar.stopAnimation,
    changeGender: avatar.changeGender,
    changeOutfit: avatar.changeOutfit,
    setPosition: avatar.setPosition,
    setRotation: avatar.setRotation,
    reset: avatar.reset,
    getConfig: () => avatar.config,
    getAvailableAnimations: () => avatar.availableAnimations,
    getCurrentAnimation: () => avatar.currentAnimation,
    isLoading: () => avatar.isLoading,
    getError: () => avatar.error
  }), [avatar]);
  
  // This component doesn't render anything visible by itself
  // It's a logical component that manages avatar state
  return (
    <div 
      className={className}
      style={{
        display: 'none', // Hidden by default as it's a logical component
        ...style
      }}
      data-component="avatar-system"
      data-loading={avatar.isLoading}
      data-error={!!avatar.error}
      data-current-animation={avatar.currentAnimation}
      data-gender={avatar.config.gender}
    >
      {/* Debug information in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div>Avatar System Status:</div>
          <div>Loading: {avatar.isLoading ? 'Yes' : 'No'}</div>
          <div>Error: {avatar.error?.message || 'None'}</div>
          <div>Animation: {avatar.currentAnimation || 'None'}</div>
          <div>Gender: {avatar.config.gender}</div>
          <div>Available Animations: {avatar.availableAnimations.length}</div>
        </div>
      )}
    </div>
  );
});

AvatarSystem.displayName = 'AvatarSystem';

export default AvatarSystem;