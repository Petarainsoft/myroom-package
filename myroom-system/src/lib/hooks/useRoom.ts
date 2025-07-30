import { useState, useCallback, useRef, useEffect } from 'react';
import { UseRoomReturn, RoomConfig } from '../types';
import { createError, debugLog, isValidUrl } from '../utils';
import { DEFAULT_ROOM_CONFIG, ROOM_CATEGORIES } from '../constants';

/**
 * Hook for room management functionality
 * Provides methods to load, configure, and manage 3D rooms
 */
export function useRoom(initialConfig?: Partial<RoomConfig>): UseRoomReturn {
  // State management
  const [config, setConfig] = useState<RoomConfig>({
    ...DEFAULT_ROOM_CONFIG,
    ...initialConfig
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [roomMetadata, setRoomMetadata] = useState<any>(null);
  
  // Refs for stable references
  const roomRef = useRef<any>(null);
  const meshesRef = useRef<any[]>([]);
  const callbacksRef = useRef<{
    onRoomLoaded?: (room: any) => void;
    onRoomChanged?: (roomId: string) => void;
    onError?: (error: Error) => void;
  }>({});
  
  // Load room
  const loadRoom = useCallback(async (roomId: string, roomConfig?: Partial<RoomConfig>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newConfig = { ...config, ...roomConfig };
      
      debugLog('Loading room', { roomId, config: newConfig });
      
      // Validate room configuration
      if (newConfig.url && !isValidUrl(newConfig.url)) {
        throw new Error('Invalid room URL');
      }
      
      // Here you would implement the actual room loading logic
      // This would interact with the Babylon.js scene to load the room model
      
      setConfig(newConfig);
      setCurrentRoom(roomId);
      
      // Simulate room metadata
      const metadata = {
        id: roomId,
        name: `Room ${roomId}`,
        category: ROOM_CATEGORIES[0],
        dimensions: {
          width: 10,
          height: 3,
          depth: 8
        },
        loadedAt: new Date().toISOString()
      };
      setRoomMetadata(metadata);
      
      debugLog('Room loaded successfully', { roomId, metadata });
      callbacksRef.current.onRoomLoaded?.(roomRef.current);
      callbacksRef.current.onRoomChanged?.(roomId);
    } catch (err) {
      const error = createError('ROOM_LOAD_FAILED', `Failed to load room: ${roomId}`, err);
      setError(error);
      debugLog('Room loading failed', { roomId, error });
      callbacksRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [config]);
  
  // Change room
  const changeRoom = useCallback(async (roomId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Changing room', { from: currentRoom, to: roomId });
      
      // Here you would implement the actual room changing logic
      // This might involve disposing current room and loading new one
      
      await loadRoom(roomId);
      
      debugLog('Room changed successfully', { roomId });
    } catch (err) {
      const error = createError('ROOM_LOAD_FAILED', `Failed to change room to: ${roomId}`, err);
      setError(error);
      debugLog('Room change failed', { roomId, error });
      callbacksRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentRoom, loadRoom]);
  
  // Update room configuration
  const updateConfig = useCallback(async (updates: Partial<RoomConfig>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newConfig = { ...config, ...updates };
      
      debugLog('Updating room config', { updates, newConfig });
      
      // Here you would implement the actual room configuration update logic
      // This might involve changing lighting, materials, or other properties
      
      setConfig(newConfig);
      
      debugLog('Room config updated successfully', { newConfig });
    } catch (err) {
      const error = createError('ROOM_UPDATE_FAILED', 'Failed to update room configuration', err);
      setError(error);
      debugLog('Room config update failed', { updates, error });
      callbacksRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [config]);
  
  // Set room lighting
  const setLighting = useCallback(async (lightingConfig: {
    intensity?: number;
    color?: string;
    shadows?: boolean;
    ambientIntensity?: number;
  }) => {
    try {
      setError(null);
      
      debugLog('Setting room lighting', { lightingConfig });
      
      // Here you would implement the actual lighting configuration logic
      // This would interact with Babylon.js lighting system
      
      const newConfig = {
        ...config,
        lighting: {
          ...config.lighting,
          ...lightingConfig
        }
      };
      
      setConfig(newConfig);
      
      debugLog('Room lighting set successfully', { lightingConfig });
    } catch (err) {
      const error = createError('ROOM_UPDATE_FAILED', 'Failed to set room lighting', err);
      setError(error);
      debugLog('Lighting setting failed', { lightingConfig, error });
      callbacksRef.current.onError?.(error);
    }
  }, [config]);
  
  // Set room materials
  const setMaterials = useCallback(async (materialsConfig: {
    floor?: string;
    walls?: string;
    ceiling?: string;
  }) => {
    try {
      setError(null);
      
      debugLog('Setting room materials', { materialsConfig });
      
      // Here you would implement the actual materials configuration logic
      // This would change textures and materials in the 3D scene
      
      const newConfig = {
        ...config,
        materials: {
          ...config.materials,
          ...materialsConfig
        }
      };
      
      setConfig(newConfig);
      
      debugLog('Room materials set successfully', { materialsConfig });
    } catch (err) {
      const error = createError('ROOM_UPDATE_FAILED', 'Failed to set room materials', err);
      setError(error);
      debugLog('Materials setting failed', { materialsConfig, error });
      callbacksRef.current.onError?.(error);
    }
  }, [config]);
  
  // Get room bounds
  const getRoomBounds = useCallback(() => {
    try {
      debugLog('Getting room bounds');
      
      // Here you would implement the actual bounds calculation logic
      // This would analyze the room geometry to get boundaries
      
      const bounds = {
        min: { x: -5, y: 0, z: -4 },
        max: { x: 5, y: 3, z: 4 },
        center: { x: 0, y: 1.5, z: 0 },
        size: { width: 10, height: 3, depth: 8 }
      };
      
      debugLog('Room bounds calculated', { bounds });
      return bounds;
    } catch (err) {
      const error = createError('ROOM_UPDATE_FAILED', 'Failed to get room bounds', err);
      setError(error);
      debugLog('Bounds calculation failed', { error });
      callbacksRef.current.onError?.(error);
      return null;
    }
  }, []);
  
  // Check if position is valid within room
  const isValidPosition = useCallback((x: number, y: number, z: number): boolean => {
    try {
      const bounds = getRoomBounds();
      if (!bounds) return false;
      
      const isValid = (
        x >= bounds.min.x && x <= bounds.max.x &&
        y >= bounds.min.y && y <= bounds.max.y &&
        z >= bounds.min.z && z <= bounds.max.z
      );
      
      debugLog('Position validation', { position: { x, y, z }, isValid });
      return isValid;
    } catch (err) {
      debugLog('Position validation failed', { position: { x, y, z }, error: err });
      return false;
    }
  }, [getRoomBounds]);
  
  // Get available rooms list
  const getAvailableRooms = useCallback(async () => {
    try {
      setError(null);
      
      debugLog('Fetching available rooms');
      
      // Here you would implement the actual rooms fetching logic
      // This might involve API calls or reading from a manifest
      
      const rooms = [
        'living-room',
        'bedroom',
        'kitchen',
        'office',
        'bathroom',
        'garden'
      ];
      
      setAvailableRooms(rooms);
      
      debugLog('Available rooms fetched', { rooms });
      return rooms;
    } catch (err) {
      const error = createError('ROOM_LOAD_FAILED', 'Failed to fetch available rooms', err);
      setError(error);
      debugLog('Available rooms fetch failed', { error });
      callbacksRef.current.onError?.(error);
      return [];
    }
  }, []);
  
  // Set callbacks
  const setCallbacks = useCallback((callbacks: {
    onRoomLoaded?: (room: any) => void;
    onRoomChanged?: (roomId: string) => void;
    onError?: (error: Error) => void;
  }) => {
    callbacksRef.current = callbacks;
  }, []);
  
  // Reset room to default state
  const reset = useCallback(() => {
    try {
      debugLog('Resetting room to default state');
      
      setConfig(DEFAULT_ROOM_CONFIG);
      setCurrentRoom('');
      setRoomMetadata(null);
      setError(null);
      
      debugLog('Room reset successfully');
    } catch (err) {
      const error = createError('ROOM_UPDATE_FAILED', 'Failed to reset room', err);
      setError(error);
      debugLog('Room reset failed', { error });
      callbacksRef.current.onError?.(error);
    }
  }, []);
  
  // Initialize available rooms on mount
  useEffect(() => {
    getAvailableRooms();
  }, [getAvailableRooms]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        debugLog('Cleaning up room resources');
        // Cleanup room resources if needed
      }
    };
  }, []);
  
  return {
    // State
    config,
    isLoading,
    error,
    currentRoom,
    availableRooms,
    roomMetadata,
    
    // Methods
    loadRoom,
    changeRoom,
    updateConfig,
    setLighting,
    setMaterials,
    getRoomBounds,
    isValidPosition,
    getAvailableRooms,
    setCallbacks,
    reset
  };
}