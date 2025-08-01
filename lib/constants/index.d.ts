import { RoomConfig, AvatarConfigProps, SceneConfig } from '../types';
import { AvatarConfig } from '../../shared/types/AvatarTypes';
export declare const DEFAULT_ROOM_CONFIG: RoomConfig;
export declare const DEFAULT_AVATAR_CONFIG: AvatarConfig;
export declare const DEFAULT_AVATAR_PROPS_CONFIG: AvatarConfigProps;
export declare const DEFAULT_SCENE_CONFIG: SceneConfig;
export declare const SUPPORTED_FORMATS: {
    models: string[];
    textures: string[];
    animations: string[];
};
export declare const ASSET_PATHS: {
    rooms: string;
    avatars: string;
    items: string;
    animations: string;
    textures: string;
    manifests: string;
};
export declare const AVATAR_ANIMATIONS: {
    idle: string;
    walk: string;
    run: string;
    jump: string;
    wave: string;
    dance: string;
    turnLeft: string;
    turnRight: string;
};
export declare const ITEM_CATEGORIES: {
    bedroom: string;
    culinary: string;
    decoration: string;
    lounge: string;
    other: string;
};
export declare const ROOM_CATEGORIES: string[];
export declare const GENDER_OPTIONS: readonly ["male", "female"];
export declare const GIZMO_MODES: {
    readonly position: "position";
    readonly rotation: "rotation";
    readonly scale: "scale";
};
export declare const EVENT_TYPES: {
    readonly SCENE_READY: "scene-ready";
    readonly AVATAR_CHANGE: "avatar-change";
    readonly ROOM_CHANGE: "room-change";
    readonly ITEM_ADD: "item-add";
    readonly ITEM_REMOVE: "item-remove";
    readonly ITEM_UPDATE: "item-update";
    readonly ERROR: "error";
};
export declare const ERROR_CODES: {
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
    readonly INITIALIZATION_FAILED: "INITIALIZATION_FAILED";
    readonly INVALID_CONFIGURATION: "INVALID_CONFIGURATION";
    readonly ROOM_LOAD_FAILED: "ROOM_LOAD_FAILED";
    readonly ROOM_UPDATE_FAILED: "ROOM_UPDATE_FAILED";
    readonly ROOM_NOT_FOUND: "ROOM_NOT_FOUND";
    readonly AVATAR_LOAD_FAILED: "AVATAR_LOAD_FAILED";
    readonly AVATAR_UPDATE_FAILED: "AVATAR_UPDATE_FAILED";
    readonly ANIMATION_FAILED: "ANIMATION_FAILED";
    readonly ITEM_LOAD_FAILED: "ITEM_LOAD_FAILED";
    readonly ITEM_UPDATE_FAILED: "ITEM_UPDATE_FAILED";
    readonly ITEM_NOT_FOUND: "ITEM_NOT_FOUND";
    readonly SCENE_INIT_FAILED: "SCENE_INIT_FAILED";
    readonly SCENE_UPDATE_FAILED: "SCENE_UPDATE_FAILED";
    readonly RENDER_FAILED: "RENDER_FAILED";
    readonly CAMERA_UPDATE_FAILED: "CAMERA_UPDATE_FAILED";
    readonly CAMERA_INIT_FAILED: "CAMERA_INIT_FAILED";
};
export declare const DEFAULT_DIMENSIONS: {
    canvas: {
        width: number;
        height: number;
    };
    room: {
        width: number;
        height: number;
        depth: number;
    };
};
export declare const PERFORMANCE_SETTINGS: {
    maxItems: number;
    maxTextures: number;
    maxAnimations: number;
    renderTargetSize: number;
    shadowMapSize: number;
};
export declare const DEFAULT_CAMERA_CONFIG: {
    type: "arcRotate";
    position: {
        x: number;
        y: number;
        z: number;
    };
    target: {
        x: number;
        y: number;
        z: number;
    };
    fov: number;
    minZ: number;
    maxZ: number;
    wheelPrecision: number;
    pinchPrecision: number;
    panningSensibility: number;
    angularSensibilityX: number;
    angularSensibilityY: number;
    radius: number;
    alpha: number;
    beta: number;
    lowerRadiusLimit: number;
    upperRadiusLimit: number;
    lowerAlphaLimit: null;
    upperAlphaLimit: null;
    lowerBetaLimit: number;
    upperBetaLimit: number;
};
export declare const LIBRARY_INFO: {
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
};
