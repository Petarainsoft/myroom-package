import { UseSceneReturn, SceneConfig } from '../types';
/**
 * Hook for Babylon.js scene management
 * Provides methods to control scene, camera, lighting, and rendering
 */
export declare function useScene(initialConfig?: Partial<SceneConfig>): UseSceneReturn;
