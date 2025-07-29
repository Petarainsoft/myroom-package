// PresetConfig type definitions for manifest data structure

export interface PresetConfig {
  version: string;
  timestamp: number;
  room: {
    name: string;
    path: string;
    resourceId: string;
  };
  avatar: {
    gender: 'male' | 'female';
    parts?: {
      body?: {
        path: string;
        resourceId: string;
      };
      hair?: {
        path: string;
        resourceId: string;
      };
      top?: {
        path: string;
        resourceId: string;
      };
      bottom?: {
        path: string;
        resourceId: string;
      };
      shoes?: {
        path: string;
        resourceId: string;
      };
      fullset?: {
        path: string;
        resourceId: string;
      } | null;
      accessory?: {
        path: string;
        resourceId: string;
      } | null;
    };
    colors?: {
      hair?: string;
      top?: string;
      bottom?: string;
      shoes?: string;
    };
  };
  items: Array<{
    id: string;
    name: string;
    path: string;
    resourceId: string;
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
  }>;
  usage?: {
    description: string;
    instructions?: string[];
    when_using_backend?: string;
    when_using_local?: string;
  };
}

export default PresetConfig;