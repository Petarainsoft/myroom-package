import React, { useRef, useState } from 'react';
import { MyRoom, ConfigurationPanel } from '../lib';
import type { MyRoomRef, RoomConfig, SceneConfig } from '../lib/types';
import { AvatarConfig } from '../shared/types/AvatarTypes';
import { toast } from 'sonner';

/**
 * BasicExample Component
 * 
 * This example demonstrates the basic usage of the MyRoom library.
 * It shows how to integrate the main MyRoom component with a configuration panel.
 */
export const BasicExample: React.FC = () => {
  const myRoomRef = useRef<MyRoomRef>(null);
  
  // State for configurations
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({
    id: 'living-room',
    category: 'living',
    url: '/assets/rooms/living-room.glb',
    background: '#87CEEB',
    lighting: {
      intensity: 1.0,
      color: '#ffffff',
      shadows: true,
      ambientIntensity: 0.3
    },
    materials: {
      floor: 'wood',
      walls: 'paint',
      ceiling: 'white'
    }
  });
  
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({
    gender: 'female',
    url: '/assets/avatars/female-avatar.glb',
    outfitId: 'casual-1',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });
  
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>({
    background: '#87CEEB',
    camera: {
      type: 'arcRotate',
      position: { x: 0, y: 5, z: -10 },
      target: { x: 0, y: 0, z: 0 },
      fov: 45,
      near: 0.1,
      far: 1000
    },
    lighting: {
      ambient: { intensity: 0.3, color: '#ffffff' },
      directional: { intensity: 1.0, color: '#ffffff', direction: { x: -1, y: -1, z: 1 } }
    },
    physics: {
      enabled: true,
      gravity: { x: 0, y: -9.81, z: 0 }
    },
    shadows: true,
    fog: {
      enabled: false,
      color: '#ffffff',
      density: 0.01
    }
  });
  
  // Event handlers
  const handleSceneReady = (scene: any) => {
    console.log('Scene is ready:', scene);
    toast.success('3D Scene loaded successfully!');
  };
  
  const handleRoomChanged = (roomId: string) => {
    console.log('Room changed to:', roomId);
    toast.info(`Room changed to: ${roomId}`);
  };
  
  const handleAvatarLoaded = (avatar: any) => {
    console.log('Avatar loaded:', avatar);
    toast.success('Avatar loaded successfully!');
  };
  
  const handleError = (error: Error) => {
    console.error('MyRoom error:', error);
    toast.error(`Error: ${error.message}`);
  };
  
  // Configuration change handlers
  const handleRoomConfigChange = (updates: Partial<RoomConfig>) => {
    const newConfig = { ...roomConfig, ...updates };
    setRoomConfig(newConfig);
    
    // Apply changes to MyRoom component
    if (myRoomRef.current) {
      myRoomRef.current.updateRoom(newConfig);
    }
  };
  
  const handleAvatarConfigChange = (updates: Partial<AvatarConfig>) => {
    const newConfig = { ...avatarConfig, ...updates };
    setAvatarConfig(newConfig);
    
    // Apply changes to MyRoom component
    if (myRoomRef.current) {
      myRoomRef.current.updateAvatar(newConfig);
    }
  };
  
  const handleSceneConfigChange = (updates: Partial<SceneConfig>) => {
    const newConfig = { ...sceneConfig, ...updates };
    setSceneConfig(newConfig);
    
    // Apply changes to MyRoom component
    if (myRoomRef.current) {
      myRoomRef.current.updateScene(newConfig);
    }
  };
  
  // Action handlers
  const handleTakeScreenshot = async () => {
    if (myRoomRef.current) {
      try {
        const screenshot = await myRoomRef.current.takeScreenshot();
        if (screenshot) {
          // Create download link
          const link = document.createElement('a');
          link.href = screenshot;
          link.download = `myroom-screenshot-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Screenshot saved!');
        }
      } catch (error) {
        toast.error('Failed to take screenshot');
      }
    }
  };
  
  const handleExportConfig = () => {
    if (myRoomRef.current) {
      try {
        const config = myRoomRef.current.exportConfig();
        console.log('Exported config:', config);
        toast.success('Configuration exported to console');
      } catch (error) {
        toast.error('Failed to export configuration');
      }
    }
  };
  
  const handleAddSampleItem = async () => {
    if (myRoomRef.current) {
      try {
        await myRoomRef.current.addItem({
          name: 'Sample Chair',
          category: 'furniture',
          url: '/assets/items/chair.glb',
          format: 'glb',
          position: { x: Math.random() * 4 - 2, y: 0, z: Math.random() * 4 - 2 },
          rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        });
        toast.success('Sample item added!');
      } catch (error) {
        toast.error('Failed to add sample item');
      }
    }
  };
  
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Main 3D View */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MyRoom
          ref={myRoomRef}
          roomId={roomConfig.id}
          roomConfig={roomConfig}
          avatarConfig={avatarConfig}
          sceneConfig={sceneConfig}
          onSceneReady={handleSceneReady}
          onRoomChanged={handleRoomChanged}
          onAvatarLoaded={handleAvatarLoaded}
          onError={handleError}
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Action Buttons Overlay */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleTakeScreenshot}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📸 Screenshot
          </button>
          
          <button
            onClick={handleExportConfig}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            💾 Export Config
          </button>
          
          <button
            onClick={handleAddSampleItem}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ➕ Add Item
          </button>
        </div>
        
        {/* Info Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '12px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <div>MyRoom Library Demo</div>
          <div>Room: {roomConfig.id}</div>
          <div>Avatar: {avatarConfig.gender}</div>
          <div>Use the configuration panel to customize settings</div>
        </div>
      </div>
      
      {/* Configuration Panel */}
      <div style={{ width: '350px', borderLeft: '1px solid #ddd', overflow: 'auto' }}>
        <ConfigurationPanel
          roomConfig={roomConfig}
          avatarConfig={avatarConfig}
          sceneConfig={sceneConfig}
          onRoomConfigChange={handleRoomConfigChange}
          onAvatarConfigChange={handleAvatarConfigChange}
          onSceneConfigChange={handleSceneConfigChange}
          onError={handleError}
          title="MyRoom Configuration"
          style={{ height: '100%', border: 'none', borderRadius: 0 }}
        />
      </div>
    </div>
  );
};

export default BasicExample;