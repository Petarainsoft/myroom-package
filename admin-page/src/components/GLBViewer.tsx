import React, { useRef, useEffect, useState } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, SceneLoader } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Box, Typography, CircularProgress } from '@mui/material';

interface GLBViewerProps {
  file: File;
}

interface GLBViewerUrlProps {
  url: string;
}

const GLBViewer: React.FC<GLBViewerProps> = ({ file }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !canvasRef.current) return;

    let isMounted = true;
    let objectUrl: string | null = null;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🚀 Loading GLB:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');

        // Validate file type
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.glb') && !fileName.endsWith('.gltf')) {
          throw new Error('File must be a .glb or .gltf file');
        }

        // Cleanup previous instances
        if (sceneRef.current && !sceneRef.current.isDisposed) {
          console.log('🧹 Disposing previous scene');
          sceneRef.current.dispose();
          sceneRef.current = null;
        }
        if (engineRef.current && !engineRef.current.isDisposed) {
          console.log('🧹 Disposing previous engine');
          engineRef.current.dispose();
          engineRef.current = null;
        }

        if (!isMounted) return;

        console.log('⚙️ Creating Babylon.js engine...');

        // Create engine with basic settings
        const engine = new Engine(canvasRef.current!, true, {
          antialias: true,
          adaptToDeviceRatio: true,
          preserveDrawingBuffer: false,
          stencil: false
        });
        
        if (!isMounted) {
          engine.dispose();
          return;
        }

        engineRef.current = engine;

        // Create scene
        console.log('🎬 Creating scene...');
        const scene = new Scene(engine);
        sceneRef.current = scene;

        // Setup camera
        console.log('📷 Setting up camera...');
        const camera = new ArcRotateCamera(
          'camera', 
          -Math.PI / 2, 
          Math.PI / 2.5, 
          10, 
          Vector3.Zero(), 
          scene
        );
        
        // Cấu hình camera để trải nghiệm người dùng tốt hơn
        camera.wheelPrecision = 50; // Điều chỉnh độ nhạy của chuột
        camera.panningSensibility = 1000; // Giảm độ nhạy khi pan
        camera.lowerRadiusLimit = 0.1; // Cho phép zoom gần hơn
        camera.upperRadiusLimit = 100; // Giới hạn zoom xa
        
        scene.activeCamera = camera;

        // Attach camera controls with error handling
        try {
          camera.attachControl(canvasRef.current, true);
          console.log('✅ Camera controls attached');
        } catch (controlError) {
          console.warn('⚠️ Camera controls failed, model will be viewable but not interactive:', controlError);
        }

        // Setup lighting
        console.log('💡 Setting up lighting...');
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // Additional lighting for better model visibility
        const light2 = new HemisphericLight('light2', new Vector3(0, -1, 0), scene);
        light2.intensity = 0.3;

        if (!isMounted) return;

        // Create object URL with explicit extension
        objectUrl = URL.createObjectURL(file);
        const fileExtension = fileName.endsWith('.glb') ? '.glb' : '.gltf';
        
        console.log('📦 Loading model with extension:', fileExtension);

        // Method 1: Try with explicit plugin extension (most reliable)
        let result;
        try {
          result = await SceneLoader.ImportMeshAsync(
            null,           // meshNames - load all
            '',             // rootUrl - empty for object URL
            objectUrl,      // sceneFilename - the object URL
            scene,          // scene
            undefined,      // onProgress - skip for now
            fileExtension   // pluginExtension - force GLB/GLTF loader
          );
        } catch (method1Error) {
          console.warn('⚠️ Method 1 failed, trying method 2:', method1Error);
          
          // Method 2: Try with rootUrl approach
          try {
            result = await SceneLoader.ImportMeshAsync(
              null,
              objectUrl + '#',  // Add hash to force extension detection
              fileName,         // Use original filename
              scene
            );
          } catch (method2Error) {
            console.warn('⚠️ Method 2 failed, trying method 3:', method2Error);
            
            // Method 3: Convert to ArrayBuffer and load directly
            const arrayBuffer = await file.arrayBuffer();
            const blob = new Blob([arrayBuffer], { 
              type: fileName.endsWith('.glb') ? 'model/gltf-binary' : 'model/gltf+json' 
            });
            const dataUrl = URL.createObjectURL(blob);
            
            try {
              result = await SceneLoader.ImportMeshAsync(
                null,
                '',
                dataUrl,
                scene,
                undefined,
                fileExtension
              );
              URL.revokeObjectURL(dataUrl);
            } catch (method3Error) {
              console.error('❌ All methods failed');
              throw method3Error;
            }
          }
        }

        if (!isMounted) return;

        if (!result || !result.meshes) {
          throw new Error('No meshes loaded from file');
        }

        console.log('✅ Model loaded successfully!', {
          meshes: result.meshes.length,
          materials: result.materials?.length || 0,
          skeletons: result.skeletons?.length || 0,
          animations: result.animationGroups?.length || 0
        });

        // Filter valid meshes
        const validMeshes = result.meshes.filter(mesh => mesh && mesh.getTotalVertices && mesh.getTotalVertices() > 0);
        
        if (validMeshes.length === 0) {
          console.warn('⚠️ No valid meshes with geometry found');
          // Set default camera position
          camera.setTarget(Vector3.Zero());
          camera.radius = 10;
        } else {
          console.log('📐 Fitting camera to', validMeshes.length, 'meshes...');
          
          // Calculate bounding box manually
          try {
            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            
            validMeshes.forEach(mesh => {
              if (mesh.getBoundingInfo) {
                const boundingInfo = mesh.getBoundingInfo();
                const min = boundingInfo.minimum;
                const max = boundingInfo.maximum;
                
                minX = Math.min(minX, min.x);
                minY = Math.min(minY, min.y);
                minZ = Math.min(minZ, min.z);
                maxX = Math.max(maxX, max.x);
                maxY = Math.max(maxY, max.y);
                maxZ = Math.max(maxZ, max.z);
              }
            });

            if (minX !== Infinity && maxX !== -Infinity) {
              const center = new Vector3(
                (minX + maxX) / 2,
                (minY + maxY) / 2,
                (minZ + maxZ) / 2
              );
              
              const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
              const radius = size * 1.5; // Add some padding
              
              camera.setTarget(center);
              camera.radius = Math.max(radius, 1); // Ensure minimum radius
              
              console.log('📐 Camera positioned:', {
                center: center.toString(),
                radius: radius.toFixed(2),
                boundingBox: {
                  min: { x: minX.toFixed(2), y: minY.toFixed(2), z: minZ.toFixed(2) },
                  max: { x: maxX.toFixed(2), y: maxY.toFixed(2), z: maxZ.toFixed(2) }
                }
              });
            }
          } catch (boundingError) {
            console.warn('⚠️ Failed to calculate bounding box:', boundingError);
            camera.setTarget(Vector3.Zero());
            camera.radius = 10;
          }
        }

        // Start render loop
        if (isMounted) {
          engine.runRenderLoop(() => {
            if (scene && !scene.isDisposed) {
              scene.render();
            }
          });
        }

        setIsLoading(false);
        console.log('🎉 GLB Viewer setup complete!');

      } catch (err) {
        console.error('❌ Failed to load GLB:', err);
        setError(err instanceof Error ? err.message : 'Failed to load model');
        setIsLoading(false);
      }
    };

    loadModel();

    // Cleanup function
    return () => {
      isMounted = false;
      
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      
      if (sceneRef.current && !sceneRef.current.isDisposed) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
      
      if (engineRef.current && !engineRef.current.isDisposed) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [file]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && !engineRef.current.isDisposed) {
        engineRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'grey.100',
        borderRadius: 1
      }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error Loading Model
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {isLoading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1
        }}>
          <CircularProgress />
        </Box>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          outline: 'none',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </Box>
  );
};

// URL-based GLB Viewer component
export const GLBViewerUrl: React.FC<GLBViewerUrlProps> = ({ url }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !canvasRef.current) return;

    let isMounted = true;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🚀 Loading GLB from URL:', url);

        // Cleanup previous instances
        if (sceneRef.current && !sceneRef.current.isDisposed) {
          console.log('🧹 Disposing previous scene');
          sceneRef.current.dispose();
          sceneRef.current = null;
        }
        if (engineRef.current && !engineRef.current.isDisposed) {
          console.log('🧹 Disposing previous engine');
          engineRef.current.dispose();
          engineRef.current = null;
        }

        if (!isMounted) return;

        console.log('⚙️ Creating Babylon.js engine...');

        // Create engine with basic settings
        const engine = new Engine(canvasRef.current!, true, {
          antialias: true,
          adaptToDeviceRatio: true,
          preserveDrawingBuffer: false,
          stencil: false
        });
        
        if (!isMounted) {
          engine.dispose();
          return;
        }

        engineRef.current = engine;

        // Create scene
        console.log('🎬 Creating scene...');
        const scene = new Scene(engine);
        sceneRef.current = scene;

        // Setup camera
        console.log('📷 Setting up camera...');
        const camera = new ArcRotateCamera(
          'camera', 
          -Math.PI / 2, 
          Math.PI / 2.5, 
          10, 
          Vector3.Zero(), 
          scene
        );
        
        // Cấu hình camera để trải nghiệm người dùng tốt hơn
        camera.wheelPrecision = 50; // Điều chỉnh độ nhạy của chuột
        camera.panningSensibility = 1000; // Giảm độ nhạy khi pan
        camera.lowerRadiusLimit = 0.1; // Cho phép zoom gần hơn
        camera.upperRadiusLimit = 100; // Giới hạn zoom xa
        
        scene.activeCamera = camera;

        // Attach camera controls
        try {
          camera.attachControl(canvasRef.current, true);
          console.log('✅ Camera controls attached');
        } catch (controlError) {
          console.warn('⚠️ Camera controls failed:', controlError);
        }

        // Setup lighting
        console.log('💡 Setting up lighting...');
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        const light2 = new HemisphericLight('light2', new Vector3(0, -1, 0), scene);
        light2.intensity = 0.3;

        if (!isMounted) return;

        // Load model from URL
        console.log('📦 Loading model from URL...');
        const result = await SceneLoader.ImportMeshAsync(
          null,
          '',
          url,
          scene,
          undefined,
          '.glb'
        );

        if (!isMounted) return;

        if (!result || !result.meshes) {
          throw new Error('No meshes loaded from URL');
        }

        console.log('✅ Model loaded successfully!', {
          meshes: result.meshes.length,
          materials: result.materials?.length || 0,
          skeletons: result.skeletons?.length || 0,
          animations: result.animationGroups?.length || 0
        });

        // Filter valid meshes and fit camera
        const validMeshes = result.meshes.filter(mesh => mesh && mesh.getTotalVertices && mesh.getTotalVertices() > 0);
        
        if (validMeshes.length === 0) {
          console.warn('⚠️ No valid meshes with geometry found');
          camera.setTarget(Vector3.Zero());
          camera.radius = 10;
        } else {
          console.log('📐 Fitting camera to', validMeshes.length, 'meshes...');
          
          try {
            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            
            validMeshes.forEach(mesh => {
              if (mesh.getBoundingInfo) {
                const boundingInfo = mesh.getBoundingInfo();
                const min = boundingInfo.minimum;
                const max = boundingInfo.maximum;
                
                minX = Math.min(minX, min.x);
                minY = Math.min(minY, min.y);
                minZ = Math.min(minZ, min.z);
                maxX = Math.max(maxX, max.x);
                maxY = Math.max(maxY, max.y);
                maxZ = Math.max(maxZ, max.z);
              }
            });

            if (minX !== Infinity && maxX !== -Infinity) {
              const center = new Vector3(
                (minX + maxX) / 2,
                (minY + maxY) / 2,
                (minZ + maxZ) / 2
              );
              
              const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
              const radius = size * 1.5;
              
              camera.setTarget(center);
              camera.radius = Math.max(radius, 1);
              
              console.log('📐 Camera positioned:', {
                center: center.toString(),
                radius: radius.toFixed(2)
              });
            }
          } catch (boundingError) {
            console.warn('⚠️ Failed to calculate bounding box:', boundingError);
            camera.setTarget(Vector3.Zero());
            camera.radius = 10;
          }
        }

        // Start render loop
        if (isMounted) {
          engine.runRenderLoop(() => {
            if (scene && !scene.isDisposed) {
              scene.render();
            }
          });
        }

        setIsLoading(false);
        console.log('🎉 GLB Viewer URL setup complete!');

      } catch (err) {
        console.error('❌ Failed to load GLB from URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load model');
        setIsLoading(false);
      }
    };

    loadModel();

    // Cleanup function
    return () => {
      isMounted = false;
      
      if (sceneRef.current && !sceneRef.current.isDisposed) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
      
      if (engineRef.current && !engineRef.current.isDisposed) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [url]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && !engineRef.current.isDisposed) {
        engineRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'grey.100',
        borderRadius: 1
      }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error Loading Model
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {isLoading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1
        }}>
          <CircularProgress />
        </Box>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          outline: 'none',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </Box>
  );
};

export default GLBViewer;
