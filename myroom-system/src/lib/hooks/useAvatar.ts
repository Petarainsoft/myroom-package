import { useState, useCallback, useRef, useEffect } from 'react';
import { AvatarConfig } from '../../shared/types/AvatarTypes';
import { UseAvatarReturn } from '../types';
import { createError, debugLog, isValidUrl } from '../utils';
import { DEFAULT_AVATAR_CONFIG } from '../constants';

/**
 * Hook for avatar management functionality
 * Provides methods to load, configure, and animate avatars
 */
export function useAvatar(initialConfig?: Partial<AvatarConfig>): UseAvatarReturn {
  // State management
  const [config, setConfig] = useState<AvatarConfig>({
    ...DEFAULT_AVATAR_CONFIG,
    ...initialConfig
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  
  // Refs for stable references
  const avatarRef = useRef<any>(null);
  const animationGroupsRef = useRef<any[]>([]);
  const callbacksRef = useRef<{
    onAvatarLoaded?: (avatar: any) => void;
    onAnimationChanged?: (animation: string) => void;
    onError?: (error: Error) => void;
  }>({});
  
  // Load avatar
  const loadAvatar = useCallback(async (avatarConfig: Partial<AvatarConfig>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newConfig = { ...config, ...avatarConfig };
      
      debugLog('Loading avatar', { config: newConfig });
      
      // Validate avatar URL
      if (newConfig.url && !isValidUrl(newConfig.url)) {
        throw new Error('Invalid avatar URL');
      }
      
      // Here you would implement the actual avatar loading logic
      // This would interact with the Babylon.js scene to load the avatar model
      
      setConfig(newConfig);
      
      // Simulate loading animations list
      const animations = [
        'idle',
        'walk',
        'run',
        'wave',
        'dance',
        'sit',
        'jump'
      ];
      setAvailableAnimations(animations);
      setCurrentAnimation('idle');
      
      debugLog('Avatar loaded successfully', { config: newConfig, animations });
      callbacksRef.current.onAvatarLoaded?.(avatarRef.current);
    } catch (err) {
      const error = createError('AVATAR_LOAD_FAILED', 'Failed to load avatar', err);
      setError(error);
      debugLog('Avatar loading failed', { config: avatarConfig, error });
      callbacksRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [config]);
  
  // Update avatar configuration
  const updateConfig = useCallback(async (updates: Partial<AvatarConfig>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newConfig = { ...config, ...updates };
      
      debugLog('Updating avatar config', { updates, newConfig });
      
      // Here you would implement the actual avatar configuration update logic
      // This might involve changing materials, textures, or other properties
      
      setConfig(newConfig);
      
      debugLog('Avatar config updated successfully', { newConfig });
    } catch (err) {
      const error = createError('AVATAR_UPDATE_FAILED', 'Failed to update avatar configuration', err);
      setError(error);
      debugLog('Avatar config update failed', { updates, error });
      callbacksRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [config]);
  
  // Play animation
  const playAnimation = useCallback(async (animationName: string, loop: boolean = true) => {
    try {
      setError(null);
      
      if (!availableAnimations.includes(animationName)) {
        throw new Error(`Animation '${animationName}' not available`);
      }
      
      debugLog('Playing animation', { animationName, loop });
      
      // Here you would implement the actual animation playing logic
      // This would interact with Babylon.js animation groups
      
      setCurrentAnimation(animationName);
      
      debugLog('Animation started successfully', { animationName });
      callbacksRef.current.onAnimationChanged?.(animationName);
    } catch (err) {
      const error = createError('ANIMATION_FAILED', `Failed to play animation: ${animationName}`, err);
      setError(error);
      debugLog('Animation play failed', { animationName, error });
      callbacksRef.current.onError?.(error);
    }
  }, [availableAnimations]);
  
  // Stop current animation
  const stopAnimation = useCallback(() => {
    try {
      debugLog('Stopping current animation', { currentAnimation });
      
      // Here you would implement the actual animation stopping logic
      
      setCurrentAnimation('');
      
      debugLog('Animation stopped successfully');
    } catch (err) {
      const error = createError('ANIMATION_FAILED', 'Failed to stop animation', err);
      setError(error);
      debugLog('Animation stop failed', { error });
      callbacksRef.current.onError?.(error);
    }
  }, [currentAnimation]);
  
  // Change avatar gender
  const changeGender = useCallback(async (gender: 'male' | 'female') => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Changing avatar gender', { from: config.gender, to: gender });
      
      const newConfig = { ...config, gender };
      
      // Here you would implement the actual gender change logic
      // This might involve loading different models or changing materials
      
      setConfig(newConfig);
      
      debugLog('Avatar gender changed successfully', { gender });
    } catch (err) {
      const error = createError('AVATAR_UPDATE_FAILED', `Failed to change gender to: ${gender}`, err);
      setError(error);
      debugLog('Gender change failed', { gender, error });
      callbacksRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [config]);
  
  // Change avatar outfit
  const changeOutfit = useCallback(async (outfitId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Changing avatar outfit', { from: config.outfitId, to: outfitId });
      
      const newConfig = { ...config, outfitId };
      
      // Here you would implement the actual outfit change logic
      // This might involve changing textures or materials
      
      setConfig(newConfig);
      
      debugLog('Avatar outfit changed successfully', { outfitId });
    } catch (err) {
      const error = createError('AVATAR_UPDATE_FAILED', `Failed to change outfit to: ${outfitId}`, err);
      setError(error);
      debugLog('Outfit change failed', { outfitId, error });
      callbacksRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [config]);
  
  // Set avatar position
  const setPosition = useCallback((x: number, y: number, z: number) => {
    try {
      debugLog('Setting avatar position', { x, y, z });
      
      // Here you would implement the actual position setting logic
      // This would move the avatar in the 3D scene
      
      const newConfig = {
        ...config,
        position: { x, y, z }
      };
      
      setConfig(newConfig);
      
      debugLog('Avatar position set successfully', { x, y, z });
    } catch (err) {
      const error = createError('AVATAR_UPDATE_FAILED', 'Failed to set avatar position', err);
      setError(error);
      debugLog('Position setting failed', { x, y, z, error });
      callbacksRef.current.onError?.(error);
    }
  }, [config]);
  
  // Set avatar rotation
  const setRotation = useCallback((x: number, y: number, z: number) => {
    try {
      debugLog('Setting avatar rotation', { x, y, z });
      
      // Here you would implement the actual rotation setting logic
      
      const newConfig = {
        ...config,
        rotation: { x, y, z }
      };
      
      setConfig(newConfig);
      
      debugLog('Avatar rotation set successfully', { x, y, z });
    } catch (err) {
      const error = createError('AVATAR_UPDATE_FAILED', 'Failed to set avatar rotation', err);
      setError(error);
      debugLog('Rotation setting failed', { x, y, z, error });
      callbacksRef.current.onError?.(error);
    }
  }, [config]);
  
  // Set callbacks
  const setCallbacks = useCallback((callbacks: {
    onAvatarLoaded?: (avatar: any) => void;
    onAnimationChanged?: (animation: string) => void;
    onError?: (error: Error) => void;
  }) => {
    callbacksRef.current = callbacks;
  }, []);
  
  // Reset avatar to default state
  const reset = useCallback(() => {
    try {
      debugLog('Resetting avatar to default state');
      
      setConfig(DEFAULT_AVATAR_CONFIG);
      setCurrentAnimation('idle');
      setError(null);
      
      debugLog('Avatar reset successfully');
    } catch (err) {
      const error = createError('AVATAR_UPDATE_FAILED', 'Failed to reset avatar', err);
      setError(error);
      debugLog('Avatar reset failed', { error });
      callbacksRef.current.onError?.(error);
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avatarRef.current) {
        debugLog('Cleaning up avatar resources');
        // Cleanup avatar resources if needed
      }
    };
  }, []);
  
  return {
    // State
    config,
    isLoading,
    error,
    currentAnimation,
    availableAnimations,
    
    // Methods
    loadAvatar,
    updateConfig,
    playAnimation,
    stopAnimation,
    changeGender,
    changeOutfit,
    setPosition,
    setRotation,
    setCallbacks,
    reset
  };
}