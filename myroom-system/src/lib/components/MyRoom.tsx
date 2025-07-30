import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { IntegratedBabylonScene } from '../../shared/components/babylon/IntegratedBabylonScene';
import { AvatarConfig } from '../../shared/types/AvatarTypes';
import { getDefaultConfigForGender } from '../../shared/data/avatarPartsData';
import { MyRoomProps, MyRoomRef } from '../types';
import { DEFAULT_ROOM_CONFIG, DEFAULT_AVATAR_CONFIG } from '../constants';
import { mergeConfigs } from '../utils';
import { Toaster } from 'sonner';

/**
 * MyRoom - Main 3D room and avatar integration component
 * 
 * A comprehensive React component that provides 3D room visualization,
 * avatar customization, and item management capabilities using Babylon.js.
 */
export const MyRoom = forwardRef<MyRoomRef, MyRoomProps>((
  {
    // Room configuration
    roomConfig = DEFAULT_ROOM_CONFIG,
    
    // Avatar configuration
    avatarConfig = DEFAULT_AVATAR_CONFIG,
    
    // Scene configuration
    sceneConfig = {},
    
    // UI configuration
    showControls = true,
    compactMode = false,
    ultraCompactMode = false,
    
    // Event callbacks
    onSceneReady,
    onAvatarChange,
    onRoomChange,
    onItemAdd,
    onItemRemove,
    onError,
    
    // Style
    className = '',
    style = {},
    
    // Advanced options
    enableDebug = false,
    customDomain,
    apiEndpoint
  },
  ref
) => {
  // Internal state
  const [isReady, setIsReady] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(roomConfig.defaultRoom);
  const [currentAvatar, setCurrentAvatar] = useState<AvatarConfig>(
    getDefaultConfigForGender(
      ('defaultGender' in avatarConfig ? avatarConfig.defaultGender : avatarConfig.gender) || 'male'
    )
  );
  const [loadedItems, setLoadedItems] = useState<any[]>([]);
  const [babylonScene, setBabylonScene] = useState<any>(null);
  
  // Refs
  const sceneRef = useRef<any>(null);
  
  // Merge configurations
  const finalRoomConfig = mergeConfigs(DEFAULT_ROOM_CONFIG, roomConfig);
  const finalAvatarConfig = 'defaultGender' in avatarConfig 
    ? mergeConfigs(DEFAULT_AVATAR_CONFIG, getDefaultConfigForGender(avatarConfig.defaultGender || 'male'))
    : mergeConfigs(DEFAULT_AVATAR_CONFIG, avatarConfig as Partial<AvatarConfig>);
  
  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    // Scene control methods
    getScene: () => babylonScene,
    isSceneReady: () => isReady,
    
    // Room methods
    changeRoom: (roomId: string) => {
      setCurrentRoom(roomId);
      onRoomChange?.(roomId);
    },
    getCurrentRoom: () => currentRoom,
    
    // Avatar methods
    updateAvatar: (config: Partial<AvatarConfig>) => {
      const newConfig = { ...currentAvatar, ...config };
      setCurrentAvatar(newConfig);
      onAvatarChange?.(newConfig);
    },
    getCurrentAvatar: () => currentAvatar,
    
    // Item methods
    addItem: (item: any) => {
      setLoadedItems(prev => [...prev, item]);
      onItemAdd?.(item);
    },
    removeItem: (itemId: string) => {
      setLoadedItems(prev => prev.filter(item => item.id !== itemId));
      onItemRemove?.(itemId);
    },
    getItems: () => loadedItems,
    
    // Utility methods
    exportConfig: () => ({
      room: currentRoom,
      avatar: currentAvatar,
      items: loadedItems
    }),
    
    importConfig: (config: any) => {
      if (config.room) setCurrentRoom(config.room);
      if (config.avatar) setCurrentAvatar(config.avatar);
      if (config.items) setLoadedItems(config.items);
    },
    
    // Screenshot/export methods
    takeScreenshot: () => {
      if (babylonScene && babylonScene.getEngine) {
        return babylonScene.getEngine().screenshot();
      }
      return null;
    }
  }), [babylonScene, isReady, currentRoom, currentAvatar, loadedItems]);
  
  // Handle scene ready
  const handleSceneReady = (scene: any) => {
    setBabylonScene(scene);
    setIsReady(true);
    onSceneReady?.(scene);
  };
  
  // Handle errors
  const handleError = (error: Error) => {
    console.error('MyRoom Error:', error);
    onError?.(error);
  };
  
  // Component styles
  const containerStyle = {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden',
    ...style
  };
  
  return (
    <div 
      className={`myroom-container ${className}`}
      style={containerStyle}
    >
      <IntegratedBabylonScene
        ref={sceneRef}
        roomPath={finalRoomConfig.defaultRoom}
        avatarConfig={finalAvatarConfig}
        loadedItems={loadedItems}
        onSceneReady={handleSceneReady}
      />
      
      {/* Toast notifications */}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
      />
    </div>
  );
});

MyRoom.displayName = 'MyRoom';

export default MyRoom;