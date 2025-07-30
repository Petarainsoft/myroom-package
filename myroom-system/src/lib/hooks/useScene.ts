import { useState, useCallback, useRef, useEffect } from 'react';
import { UseSceneReturn, SceneConfig, CameraConfig } from '../types';
import { createError, debugLog } from '../utils';
import { DEFAULT_SCENE_CONFIG, DEFAULT_CAMERA_CONFIG } from '../constants';

/**
 * Hook for Babylon.js scene management
 * Provides methods to control scene, camera, lighting, and rendering
 */
export function useScene(initialConfig?: Partial<SceneConfig>): UseSceneReturn {
  // State management
  const [config, setConfig] = useState<SceneConfig>({
    ...DEFAULT_SCENE_CONFIG,
    ...initialConfig
  });
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fps, setFps] = useState(0);
  const [renderStats, setRenderStats] = useState({
    triangles: 0,
    drawCalls: 0,
    meshes: 0
  });
  
  // Refs for stable references
  const sceneRef = useRef<any>(null);
  const engineRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const callbacksRef = useRef<{
    onSceneReady?: (scene: any) => void;
    onRenderLoop?: (scene: any) => void;
    onError?: (error: Error) => void;
  }>({});
  
  // Initialize scene
  const initializeScene = useCallback(async (canvas: HTMLCanvasElement) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Initializing Babylon.js scene', { config });
      
      canvasRef.current = canvas;
      
      // Here you would implement the actual Babylon.js scene initialization
      // This would create the engine, scene, camera, and lighting
      
      // Simulate scene initialization
      const mockScene = {
        id: 'main-scene',
        isReady: true,
        canvas,
        config
      };
      
      sceneRef.current = mockScene;
      setIsReady(true);
      
      debugLog('Scene initialized successfully');
      callbacksRef.current.onSceneReady?.(mockScene);
      
      return mockScene;
    } catch (err) {
      const error = createError('SCENE_INIT_FAILED', 'Failed to initialize scene', err);
      setError(error);
      debugLog('Scene initialization failed', { error });
      callbacksRef.current.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [config]);
  
  // Start render loop
  const startRenderLoop = useCallback(() => {
    try {
      if (!sceneRef.current) {
        throw new Error('Scene not initialized');
      }
      
      debugLog('Starting render loop');
      
      // Here you would implement the actual render loop
      // This would call engine.runRenderLoop()
      
      const renderLoop = () => {
        if (sceneRef.current) {
          // Simulate FPS calculation
          setFps(Math.floor(Math.random() * 10) + 55); // 55-65 FPS
          
          // Simulate render stats
          setRenderStats({
            triangles: Math.floor(Math.random() * 1000) + 5000,
            drawCalls: Math.floor(Math.random() * 50) + 20,
            meshes: Math.floor(Math.random() * 20) + 10
          });
          
          callbacksRef.current.onRenderLoop?.(sceneRef.current);
        }
        
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      };
      
      renderLoop();
      
      debugLog('Render loop started');
    } catch (err) {
      const error = createError('RENDER_FAILED', 'Failed to start render loop', err);
      setError(error);
      debugLog('Render loop start failed', { error });
      callbacksRef.current.onError?.(error);
    }
  }, []);
  
  // Stop render loop
  const stopRenderLoop = useCallback(() => {
    try {
      debugLog('Stopping render loop');
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Here you would implement the actual render loop stopping
      // This would call engine.stopRenderLoop()
      
      debugLog('Render loop stopped');
    } catch (err) {
      const error = createError('RENDER_FAILED', 'Failed to stop render loop', err);
      setError(error);
      debugLog('Render loop stop failed', { error });
      callbacksRef.current.onError?.(error);
    }
  }, []);
  
  // Update scene configuration
  const updateConfig = useCallback(async (updates: Partial<SceneConfig>) => {
    try {
      setError(null);
      
      const newConfig = { ...config, ...updates };
      
      debugLog('Updating scene config', { updates, newConfig });
      
      // Here you would implement the actual scene configuration update
      // This might involve changing background, fog, physics, etc.
      
      setConfig(newConfig);
      
      debugLog('Scene config updated successfully', { newConfig });
    } catch (err) {
      const error = createError('SCENE_UPDATE_FAILED', 'Failed to update scene configuration', err);
      setError(error);
      debugLog('Scene config update failed', { updates, error });
      callbacksRef.current.onError?.(error);
    }
  }, [config]);
  
  // Update camera configuration
  const updateCamera = useCallback(async (cameraConfig: Partial<CameraConfig>) => {
    try {
      setError(null);
      
      debugLog('Updating camera config', { cameraConfig });
      
      // Here you would implement the actual camera configuration update
      // This would modify the Babylon.js camera properties
      
      const newConfig = {
        ...config,
        camera: {
          ...config.camera,
          ...cameraConfig
        }
      };
      
      setConfig(newConfig);
      
      debugLog('Camera config updated successfully', { cameraConfig });
    } catch (err) {
      const error = createError('CAMERA_UPDATE_FAILED', 'Failed to update camera configuration', err);
      setError(error);
      debugLog('Camera config update failed', { cameraConfig, error });
      callbacksRef.current.onError?.(error);
    }
  }, [config]);
  
  // Set camera position
  const setCameraPosition = useCallback((x: number, y: number, z: number) => {
    try {
      debugLog('Setting camera position', { x, y, z });
      
      // Here you would implement the actual camera position setting
      // This would move the Babylon.js camera
      
      updateCamera({ position: { x, y, z } });
      
      debugLog('Camera position set successfully', { x, y, z });
    } catch (err) {
      const error = createError('CAMERA_UPDATE_FAILED', 'Failed to set camera position', err);
      setError(error);
      debugLog('Camera position setting failed', { x, y, z, error });
      callbacksRef.current.onError?.(error);
    }
  }, [updateCamera]);
  
  // Set camera target
  const setCameraTarget = useCallback((x: number, y: number, z: number) => {
    try {
      debugLog('Setting camera target', { x, y, z });
      
      // Here you would implement the actual camera target setting
      // This would set the Babylon.js camera target
      
      updateCamera({ target: { x, y, z } });
      
      debugLog('Camera target set successfully', { x, y, z });
    } catch (err) {
      const error = createError('CAMERA_UPDATE_FAILED', 'Failed to set camera target', err);
      setError(error);
      debugLog('Camera target setting failed', { x, y, z, error });
      callbacksRef.current.onError?.(error);
    }
  }, [updateCamera]);
  
  // Take screenshot
  const takeScreenshot = useCallback(async (width?: number, height?: number): Promise<string | null> => {
    try {
      if (!sceneRef.current || !canvasRef.current) {
        throw new Error('Scene or canvas not ready');
      }
      
      debugLog('Taking screenshot', { width, height });
      
      // Here you would implement the actual screenshot functionality
      // This would use Babylon.js screenshot utilities
      
      // Simulate screenshot data URL
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      
      debugLog('Screenshot taken successfully');
      return dataUrl;
    } catch (err) {
      const error = createError('SCREENSHOT_FAILED', 'Failed to take screenshot', err);
      setError(error);
      debugLog('Screenshot failed', { error });
      callbacksRef.current.onError?.(error);
      return null;
    }
  }, []);
  
  // Resize scene
  const resize = useCallback(() => {
    try {
      if (!engineRef.current) {
        return;
      }
      
      debugLog('Resizing scene');
      
      // Here you would implement the actual scene resizing
      // This would call engine.resize()
      
      debugLog('Scene resized successfully');
    } catch (err) {
      const error = createError('RESIZE_FAILED', 'Failed to resize scene', err);
      setError(error);
      debugLog('Scene resize failed', { error });
      callbacksRef.current.onError?.(error);
    }
  }, []);
  
  // Enable/disable physics
  const setPhysicsEnabled = useCallback(async (enabled: boolean) => {
    try {
      setError(null);
      
      debugLog('Setting physics enabled', { enabled });
      
      // Here you would implement the actual physics enabling/disabling
      // This would configure Babylon.js physics engine
      
      await updateConfig({ physics: { enabled } });
      
      debugLog('Physics setting updated successfully', { enabled });
    } catch (err) {
      const error = createError('PHYSICS_FAILED', 'Failed to set physics enabled', err);
      setError(error);
      debugLog('Physics setting failed', { enabled, error });
      callbacksRef.current.onError?.(error);
    }
  }, [updateConfig]);
  
  // Set callbacks
  const setCallbacks = useCallback((callbacks: {
    onSceneReady?: (scene: any) => void;
    onRenderLoop?: (scene: any) => void;
    onError?: (error: Error) => void;
  }) => {
    callbacksRef.current = callbacks;
  }, []);
  
  // Dispose scene
  const dispose = useCallback(() => {
    try {
      debugLog('Disposing scene');
      
      stopRenderLoop();
      
      // Here you would implement the actual scene disposal
      // This would dispose all Babylon.js resources
      
      setIsReady(false);
      sceneRef.current = null;
      engineRef.current = null;
      cameraRef.current = null;
      canvasRef.current = null;
      
      debugLog('Scene disposed successfully');
    } catch (err) {
      const error = createError('DISPOSE_FAILED', 'Failed to dispose scene', err);
      setError(error);
      debugLog('Scene disposal failed', { error });
      callbacksRef.current.onError?.(error);
    }
  }, [stopRenderLoop]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      resize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [resize]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);
  
  return {
    // State
    config,
    isReady,
    isLoading,
    error,
    fps,
    renderStats,
    
    // Methods
    initializeScene,
    startRenderLoop,
    stopRenderLoop,
    updateConfig,
    updateCamera,
    setCameraPosition,
    setCameraTarget,
    takeScreenshot,
    resize,
    setPhysicsEnabled,
    setCallbacks,
    dispose
  };
}