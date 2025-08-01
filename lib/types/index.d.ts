import { CSSProperties } from 'react';
import { AvatarConfig } from '../../shared/types/AvatarTypes';
export interface MyRoomProps {
    roomConfig?: RoomConfig;
    avatarConfig?: AvatarConfigProps;
    sceneConfig?: SceneConfig;
    showControls?: boolean;
    compactMode?: boolean;
    ultraCompactMode?: boolean;
    onSceneReady?: (scene: any) => void;
    onAvatarChange?: (config: AvatarConfig) => void;
    onRoomChange?: (roomId: string) => void;
    onItemAdd?: (item: ItemConfig) => void;
    onItemRemove?: (itemId: string) => void;
    onError?: (error: Error) => void;
    className?: string;
    style?: CSSProperties;
    enableDebug?: boolean;
    customDomain?: string;
    apiEndpoint?: string;
}
export interface RoomConfig {
    id?: string;
    defaultRoom?: string;
    availableRooms?: string[];
    autoLoad?: boolean;
    enableRoomSwitching?: boolean;
    roomAssetPath?: string;
    category?: string;
    url?: string;
    background?: string;
    lighting?: {
        intensity?: number;
        color?: string;
        shadows?: boolean;
    };
    materials?: {
        floor?: string;
        walls?: string;
        ceiling?: string;
    };
}
export interface AvatarConfigProps {
    defaultGender?: 'male' | 'female';
    gender?: 'male' | 'female';
    enableCustomization?: boolean;
    enableMovement?: boolean;
    enableAnimations?: boolean;
    avatarAssetPath?: string;
}
export interface SceneConfig {
    enablePostProcessing?: boolean;
    enableSkybox?: boolean;
    enableShadows?: boolean;
    enableLighting?: boolean;
    background?: string;
    physics?: {
        enabled?: boolean;
        gravity?: number;
    };
    shadows?: boolean;
    cameraSettings?: CameraConfig;
    renderSettings?: RenderConfig;
}
export interface CameraConfig {
    position?: {
        x: number;
        y: number;
        z: number;
    };
    target?: {
        x: number;
        y: number;
        z: number;
    };
    fov?: number;
    minDistance?: number;
    maxDistance?: number;
}
export interface RenderConfig {
    antialias?: boolean;
    adaptToDeviceRatio?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
}
export interface ItemConfig {
    id: string;
    name: string;
    resourceId?: string;
    url?: string;
    format?: string;
    path?: string;
    category?: string;
    position?: {
        x: number;
        y: number;
        z: number;
    };
    rotation?: {
        x: number;
        y: number;
        z: number;
    };
    scale?: {
        x: number;
        y: number;
        z: number;
    };
    metadata?: Record<string, any>;
}
export interface MyRoomRef {
    getScene: () => any;
    isSceneReady: () => boolean;
    changeRoom: (roomId: string) => void;
    getCurrentRoom: () => string | undefined;
    updateAvatar: (config: Partial<AvatarConfig>) => void;
    getCurrentAvatar: () => AvatarConfig;
    addItem: (item: ItemConfig) => void;
    removeItem: (itemId: string) => void;
    getItems: () => ItemConfig[];
    exportConfig: () => MyRoomExportConfig;
    importConfig: (config: MyRoomExportConfig) => void;
    takeScreenshot: () => string | null;
}
export interface MyRoomExportConfig {
    room: string | undefined;
    avatar: AvatarConfig;
    items: ItemConfig[];
    metadata?: Record<string, any>;
}
export interface UseMyRoomReturn {
    scene: any;
    isReady: boolean;
    error: Error | null;
    changeRoom: (roomId: string) => void;
    updateAvatar: (config: Partial<AvatarConfig>) => void;
    addItem: (item: ItemConfig) => void;
    removeItem: (itemId: string) => void;
}
export interface UseAvatarReturn {
    config: AvatarConfig;
    isLoading: boolean;
    error: Error | null;
    currentAnimation: string | null;
    availableAnimations: string[];
    loadAvatar: (config: Partial<AvatarConfig>) => Promise<void>;
    updateConfig: (config: Partial<AvatarConfig>) => Promise<void>;
    playAnimation: (animationName: string, loop?: boolean) => Promise<void>;
    stopAnimation: () => void;
    changeGender: (gender: 'male' | 'female') => Promise<void>;
    changeOutfit: (outfitId: string) => Promise<void>;
    setPosition: (x: number, y: number, z: number) => void;
    setRotation: (x: number, y: number, z: number) => void;
    setCallbacks: (callbacks: {
        onAvatarLoaded?: (avatar: any) => void;
        onAnimationChanged?: (animation: string) => void;
        onError?: (error: Error) => void;
    }) => void;
    reset: () => void;
}
export interface UseRoomReturn {
    config: RoomConfig;
    isLoading: boolean;
    error: Error | null;
    currentRoom: string;
    availableRooms: string[];
    roomMetadata: any;
    loadRoom: (roomId: string) => Promise<void>;
    changeRoom: (roomId: string) => Promise<void>;
    updateConfig: (config: Partial<RoomConfig>) => Promise<void>;
    setLighting: (lightingConfig: any) => Promise<void>;
    setMaterials: (materialsConfig: any) => Promise<void>;
    getRoomBounds: () => any;
    isValidPosition: (x: number, y: number, z: number) => boolean;
    getAvailableRooms: () => Promise<string[]>;
    setCallbacks: (callbacks: {
        onRoomLoaded?: (room: any) => void;
        onRoomChanged?: (roomId: string) => void;
        onError?: (error: Error) => void;
    }) => void;
    reset: () => void;
}
export interface UseItemsReturn {
    items: ItemConfig[];
    isLoading: boolean;
    error: Error | null;
    selectedItem: string | null;
    availableItems: ItemConfig[];
    addItem: (item: Omit<ItemConfig, 'id'>) => Promise<ItemConfig>;
    removeItem: (itemId: string) => Promise<void>;
    updateItem: (itemId: string, updates: Partial<ItemConfig>) => Promise<ItemConfig>;
    moveItem: (itemId: string, position: {
        x: number;
        y: number;
        z: number;
    }) => Promise<void>;
    rotateItem: (itemId: string, rotation: {
        x: number;
        y: number;
        z: number;
    }) => Promise<void>;
    scaleItem: (itemId: string, scale: {
        x: number;
        y: number;
        z: number;
    }) => Promise<void>;
    selectItem: (itemId: string | null) => void;
    getItem: (itemId: string) => ItemConfig | null;
    getItemsByCategory: (category: string) => ItemConfig[];
    clearItems: () => Promise<void>;
    getAvailableItems: () => Promise<ItemConfig[]>;
    setCallbacks: (callbacks: {
        onItemAdded?: (item: ItemConfig) => void;
        onItemRemoved?: (itemId: string) => void;
        onItemSelected?: (itemId: string | null) => void;
        onItemMoved?: (itemId: string, position: {
            x: number;
            y: number;
            z: number;
        }) => void;
        onError?: (error: Error) => void;
    }) => void;
}
export interface UseSceneReturn {
    scene: any;
    engine: any;
    canvas: HTMLCanvasElement | null;
    isReady: boolean;
    error: Error | null;
}
export interface MyRoomEvent<T = any> {
    type: string;
    data: T;
    timestamp: number;
}
export interface SceneReadyEvent extends MyRoomEvent {
    type: 'scene-ready';
    data: {
        scene: any;
        engine: any;
        canvas: HTMLCanvasElement;
    };
}
export interface AvatarChangeEvent extends MyRoomEvent {
    type: 'avatar-change';
    data: {
        config: AvatarConfig;
        previousConfig: AvatarConfig;
    };
}
export interface RoomChangeEvent extends MyRoomEvent {
    type: 'room-change';
    data: {
        roomId: string;
        previousRoomId: string;
    };
}
export interface ItemEvent extends MyRoomEvent {
    type: 'item-add' | 'item-remove' | 'item-update';
    data: {
        item: ItemConfig;
        action: 'add' | 'remove' | 'update';
    };
}
