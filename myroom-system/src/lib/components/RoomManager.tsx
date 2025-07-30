import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useRoom } from '../hooks/useRoom';
import { RoomConfig } from '../types';
import { debugLog } from '../utils';

export interface RoomManagerProps {
  /** Initial room configuration */
  config?: Partial<RoomConfig>;
  
  /** Initial room ID to load */
  roomId?: string;
  
  /** Callback when room is loaded */
  onRoomLoaded?: (room: any) => void;
  
  /** Callback when room changes */
  onRoomChanged?: (roomId: string) => void;
  
  /** Callback when room configuration updates */
  onConfigChanged?: (config: RoomConfig) => void;
  
  /** Callback for errors */
  onError?: (error: Error) => void;
  
  /** Whether to auto-load the room on mount */
  autoLoad?: boolean;
  
  /** CSS class name for styling */
  className?: string;
  
  /** Custom styles */
  style?: React.CSSProperties;
}

export interface RoomManagerRef {
  /** Load room with configuration */
  loadRoom: (roomId: string, config?: Partial<RoomConfig>) => Promise<void>;
  
  /** Change to a different room */
  changeRoom: (roomId: string) => Promise<void>;
  
  /** Update room configuration */
  updateConfig: (updates: Partial<RoomConfig>) => Promise<void>;
  
  /** Set room lighting */
  setLighting: (lightingConfig: {
    intensity?: number;
    color?: string;
    shadows?: boolean;
    ambientIntensity?: number;
  }) => Promise<void>;
  
  /** Set room materials */
  setMaterials: (materialsConfig: {
    floor?: string;
    walls?: string;
    ceiling?: string;
  }) => Promise<void>;
  
  /** Get room bounds */
  getRoomBounds: () => {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
    center: { x: number; y: number; z: number };
    size: { width: number; height: number; depth: number };
  } | null;
  
  /** Check if position is valid within room */
  isValidPosition: (x: number, y: number, z: number) => boolean;
  
  /** Get available rooms */
  getAvailableRooms: () => Promise<string[]>;
  
  /** Reset room to default state */
  reset: () => void;
  
  /** Get current room configuration */
  getConfig: () => RoomConfig;
  
  /** Get current room ID */
  getCurrentRoom: () => string;
  
  /** Get available rooms list */
  getAvailableRoomsList: () => string[];
  
  /** Get room metadata */
  getRoomMetadata: () => any;
  
  /** Check if room is loading */
  isLoading: () => boolean;
  
  /** Get current error */
  getError: () => Error | null;
}

/**
 * RoomManager Component
 * 
 * A React component that provides room management functionality.
 * This component wraps the useRoom hook and provides a clean interface
 * for managing 3D rooms in the MyRoom system.
 */
export const RoomManager = forwardRef<RoomManagerRef, RoomManagerProps>((
  {
    config,
    roomId,
    onRoomLoaded,
    onRoomChanged,
    onConfigChanged,
    onError,
    autoLoad = true,
    className,
    style
  },
  ref
) => {
  const room = useRoom(config);
  
  // Set up callbacks
  useEffect(() => {
    room.setCallbacks({
      onRoomLoaded,
      onRoomChanged,
      onError
    });
  }, [room, onRoomLoaded, onRoomChanged, onError]);
  
  // Auto-load room if enabled and roomId is provided
  useEffect(() => {
    if (autoLoad && roomId) {
      debugLog('Auto-loading room', { roomId, config });
      room.loadRoom(roomId, config).catch(error => {
        debugLog('Auto-load failed', { error });
        onError?.(error);
      });
    }
  }, [autoLoad, roomId, config, room, onError]);
  
  // Notify parent of config changes
  useEffect(() => {
    onConfigChanged?.(room.config);
  }, [room.config, onConfigChanged]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    loadRoom: room.loadRoom,
    changeRoom: room.changeRoom,
    updateConfig: room.updateConfig,
    setLighting: room.setLighting,
    setMaterials: room.setMaterials,
    getRoomBounds: room.getRoomBounds,
    isValidPosition: room.isValidPosition,
    getAvailableRooms: room.getAvailableRooms,
    reset: room.reset,
    getConfig: () => room.config,
    getCurrentRoom: () => room.currentRoom,
    getAvailableRoomsList: () => room.availableRooms,
    getRoomMetadata: () => room.roomMetadata,
    isLoading: () => room.isLoading,
    getError: () => room.error
  }), [room]);
  
  // This component doesn't render anything visible by itself
  // It's a logical component that manages room state
  return (
    <div 
      className={className}
      style={{
        display: 'none', // Hidden by default as it's a logical component
        ...style
      }}
      data-component="room-manager"
      data-loading={room.isLoading}
      data-error={!!room.error}
      data-current-room={room.currentRoom}
      data-available-rooms={room.availableRooms.length}
    >
      {/* Debug information in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div>Room Manager Status:</div>
          <div>Loading: {room.isLoading ? 'Yes' : 'No'}</div>
          <div>Error: {room.error?.message || 'None'}</div>
          <div>Current Room: {room.currentRoom || 'None'}</div>
          <div>Available Rooms: {room.availableRooms.length}</div>
          <div>Room Metadata: {room.roomMetadata ? 'Loaded' : 'None'}</div>
          <div>Lighting Intensity: {room.config.lighting?.intensity || 'Default'}</div>
          <div>Materials: {room.config.materials ? 'Custom' : 'Default'}</div>
        </div>
      )}
    </div>
  );
});

RoomManager.displayName = 'RoomManager';

export default RoomManager;