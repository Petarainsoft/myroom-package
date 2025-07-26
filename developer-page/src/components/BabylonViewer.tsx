import React, { useRef, useEffect } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, SceneLoader, Color3 } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface BabylonViewerProps {
  url: string;
  autoRotate?: boolean;
}

const BabylonViewer: React.FC<BabylonViewerProps> = ({ url, autoRotate = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !url) return;

    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);

    // Camera
    const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2.5, 4, Vector3.Zero(), scene);
    camera.minZ = 0.1;
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 0;
    camera.attachControl(canvasRef.current, true);

    // Light
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;

    // Background
    scene.clearColor = new Color3(1, 1, 1).toColor4(1);

    // Load GLB/GLTF
    SceneLoader.Append('', url, scene, () => {
      if (autoRotate && scene.activeCamera) {
        (scene.activeCamera as ArcRotateCamera).useAutoRotationBehavior = true;
      }
    }, undefined, (sceneError) => {
      console.error('Babylon load error', sceneError);
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const resize = () => engine.resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      engine.dispose();
    };
  }, [url, autoRotate]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default BabylonViewer; 