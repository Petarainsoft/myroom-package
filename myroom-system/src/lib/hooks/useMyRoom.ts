import { useState, useEffect, useCallback, useRef } from 'react';
import { AvatarConfig } from '../../shared/types/AvatarTypes';
import { ItemConfig, UseMyRoomReturn, MyRoomExportConfig } from '../types';
import { createError, debugLog } from '../utils';

/**
 * Main hook for MyRoom component functionality
 * Provides centralized state management and methods for room, avatar, and items
 */
export function useMyRoom(initialConfig?: {
  roomId?: string;
  avatarConfig?: AvatarConfig;
  items?: ItemConfig[];
}): UseMyRoomReturn {
  // State management
  const [scene, setScene] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentRoom, setCurrentRoom] = useState(initialConfig?.roomId || '');
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(initialConfig?.avatarConfig || null);
  const [items, setItems] = useState<ItemConfig[]>(initialConfig?.items || []);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for stable references
  const sceneRef = useRef<any>(null);
  const callbacksRef = useRef<{
    onSceneReady?: (scene: any) => void;
    onError?: (error: Error) => void;
  }>({});
  
  // Initialize scene
  const initializeScene = useCallback((sceneInstance: any) => {
    try {
      setScene(sceneInstance);
      sceneRef.current = sceneInstance;
      setIsReady(true);
      setError(null);
      
      debugLog('Scene initialized successfully');
      callbacksRef.current.onSceneReady?.(sceneInstance);
    } catch (err) {
      const error = createError('SCENE_INIT_FAILED', 'Failed to initialize scene', err);
      setError(error);
      callbacksRef.current.onError?.(error);
    }
  }, []);
  
  // Change room
  const changeRoom = useCallback(async (roomId: string) => {
    if (!scene) {
      const error = createError('SCENE_INIT_FAILED', 'Scene not ready');
      setError(error);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Changing room', { from: currentRoom, to: roomId });
      
      // Here you would implement the actual room changing logic
      // This would interact with the Babylon.js scene
      
      setCurrentRoom(roomId);
      debugLog('Room changed successfully', { roomId });
    } catch (err) {
      const error = createError('ROOM_LOAD_FAILED', `Failed to load room: ${roomId}`, err);
      setError(error);
      debugLog('Room change failed', { roomId, error });
    } finally {
      setIsLoading(false);
    }
  }, [scene, currentRoom]);
  
  // Update avatar
  const updateAvatar = useCallback(async (config: Partial<AvatarConfig>) => {
    if (!scene) {
      const error = createError('SCENE_INIT_FAILED', 'Scene not ready');
      setError(error);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const newConfig = { ...avatarConfig, ...config } as AvatarConfig;
      
      debugLog('Updating avatar', { config: newConfig });
      
      // Here you would implement the actual avatar updating logic
      // This would interact with the Babylon.js scene
      
      setAvatarConfig(newConfig);
      debugLog('Avatar updated successfully', { config: newConfig });
    } catch (err) {
      const error = createError('AVATAR_LOAD_FAILED', 'Failed to update avatar', err);
      setError(error);
      debugLog('Avatar update failed', { config, error });
    } finally {
      setIsLoading(false);
    }
  }, [scene, avatarConfig]);
  
  // Add item
  const addItem = useCallback(async (item: ItemConfig) => {
    if (!scene) {
      const error = createError('SCENE_INIT_FAILED', 'Scene not ready');
      setError(error);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Adding item', { item });
      
      // Check if item already exists
      if (items.find(existingItem => existingItem.id === item.id)) {
        throw new Error(`Item with ID ${item.id} already exists`);
      }
      
      // Here you would implement the actual item adding logic
      // This would interact with the Babylon.js scene
      
      setItems(prev => [...prev, item]);
      debugLog('Item added successfully', { item });
    } catch (err) {
      const error = createError('ITEM_LOAD_FAILED', `Failed to add item: ${item.name}`, err);
      setError(error);
      debugLog('Item add failed', { item, error });
    } finally {
      setIsLoading(false);
    }
  }, [scene, items]);
  
  // Remove item
  const removeItem = useCallback(async (itemId: string) => {
    if (!scene) {
      const error = createError('SCENE_INIT_FAILED', 'Scene not ready');
      setError(error);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Removing item', { itemId });
      
      const itemToRemove = items.find(item => item.id === itemId);
      if (!itemToRemove) {
        throw new Error(`Item with ID ${itemId} not found`);
      }
      
      // Here you would implement the actual item removal logic
      // This would interact with the Babylon.js scene
      
      setItems(prev => prev.filter(item => item.id !== itemId));
      debugLog('Item removed successfully', { itemId });
    } catch (err) {
      const error = createError('ITEM_LOAD_FAILED', `Failed to remove item: ${itemId}`, err);
      setError(error);
      debugLog('Item removal failed', { itemId, error });
    } finally {
      setIsLoading(false);
    }
  }, [scene, items]);
  
  // Export current configuration
  const exportConfig = useCallback((): MyRoomExportConfig => {
    return {
      room: currentRoom,
      avatar: avatarConfig!,
      items: items,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }, [currentRoom, avatarConfig, items]);
  
  // Import configuration
  const importConfig = useCallback(async (config: MyRoomExportConfig) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Importing configuration', { config });
      
      if (config.room) {
        await changeRoom(config.room);
      }
      
      if (config.avatar) {
        await updateAvatar(config.avatar);
      }
      
      if (config.items) {
        // Clear existing items first
        setItems([]);
        
        // Add new items
        for (const item of config.items) {
          await addItem(item);
        }
      }
      
      debugLog('Configuration imported successfully');
    } catch (err) {
      const error = createError('INVALID_CONFIGURATION', 'Failed to import configuration', err);
      setError(error);
      debugLog('Configuration import failed', { error });
    } finally {
      setIsLoading(false);
    }
  }, [changeRoom, updateAvatar, addItem]);
  
  // Set callbacks
  const setCallbacks = useCallback((callbacks: {
    onSceneReady?: (scene: any) => void;
    onError?: (error: Error) => void;
  }) => {
    callbacksRef.current = callbacks;
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sceneRef.current) {
        debugLog('Cleaning up scene');
        // Cleanup scene resources if needed
      }
    };
  }, []);
  
  return {
    // State
    scene,
    isReady,
    error,
    
    // Methods
    changeRoom,
    updateAvatar,
    addItem,
    removeItem,
    
    // Utility methods
    exportConfig,
    importConfig,
    setCallbacks,
    initializeScene
  } as UseMyRoomReturn & {
    exportConfig: () => MyRoomExportConfig;
    importConfig: (config: MyRoomExportConfig) => Promise<void>;
    setCallbacks: (callbacks: any) => void;
    initializeScene: (scene: any) => void;
  };
}