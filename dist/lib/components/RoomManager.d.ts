import { default as React } from 'react';
import { RoomConfig } from '../types';
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
        min: {
            x: number;
            y: number;
            z: number;
        };
        max: {
            x: number;
            y: number;
            z: number;
        };
        center: {
            x: number;
            y: number;
            z: number;
        };
        size: {
            width: number;
            height: number;
            depth: number;
        };
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
export declare const RoomManager: React.ForwardRefExoticComponent<RoomManagerProps & React.RefAttributes<RoomManagerRef>>;
export default RoomManager;
