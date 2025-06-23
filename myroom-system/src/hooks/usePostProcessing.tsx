import { useEffect, useRef } from 'react';
import {
  Scene, Camera, DefaultRenderingPipeline, SSAO2RenderingPipeline,
  Color3, Color4, Vector3, BloomEffect, DepthOfFieldEffect, FxaaPostProcess,
  ImageProcessingPostProcess
} from '@babylonjs/core';

export interface UsePostProcessingProps {
  scene: Scene | null;
  camera: Camera | null;
  isSceneReady: boolean;
  options?: {
    enableFXAA?: boolean;
    enableMSAA?: boolean;
    enableBloom?: boolean;
    bloomIntensity?: number;
    bloomThreshold?: number;
    enableDOF?: boolean;
    enableSSAO?: boolean;
    enableImageProcessing?: boolean;
    contrast?: number;
    exposure?: number;
  };
}

/**
 * Hook để quản lý các hiệu ứng hậu xử lý (post-processing) trong Babylon.js
 */
export const usePostProcessing = ({
  scene,
  camera,
  isSceneReady,
  options = {}
}: UsePostProcessingProps) => {
  const pipelineRef = useRef<DefaultRenderingPipeline | null>(null);
  const ssaoRef = useRef<SSAO2RenderingPipeline | null>(null);
  const optionsRef = useRef(options);
  
  // Update options ref when options change
  optionsRef.current = options;
  
  useEffect(() => {
    if (!isSceneReady || !scene || !camera) return;

    // Dispose existing pipeline if it exists
    if (pipelineRef.current) {
      pipelineRef.current.dispose();
      pipelineRef.current = null;
    }
    if (ssaoRef.current) {
      ssaoRef.current.dispose();
      ssaoRef.current = null;
    }

    // Set default values
    const {
      enableFXAA = true,
      enableMSAA = false,
      enableBloom = false,
      bloomIntensity = 0.15,
      bloomThreshold = 0.1,
      enableDOF = false,
      enableSSAO = false,
      enableImageProcessing = true,
      contrast = 1.1,
      exposure = 1.2
    } = optionsRef.current;

    // Create DefaultRenderingPipeline
    const pipeline = new DefaultRenderingPipeline(
      'defaultPipeline',
      true, // HDR
      scene,
      [camera]
    );
    pipelineRef.current = pipeline;

    // Configure FXAA (Fast Approximate Anti-Aliasing)
    pipeline.fxaaEnabled = enableFXAA;
    if (pipeline.fxaa) {
      pipeline.fxaa.samples = 1;
    }

    // Configure MSAA (Multisample Anti-Aliasing)
    scene.getEngine().setHardwareScalingLevel(1.0);
    if (enableMSAA) {
      const samples = 4; // 4x MSAA
      scene.getEngine().setHardwareScalingLevel(1.0 / Math.sqrt(samples));
    }

    // Configure Bloom
    pipeline.bloomEnabled = enableBloom;
    if (pipeline.bloomEnabled) {
      pipeline.bloomThreshold = bloomThreshold;
      pipeline.bloomWeight = bloomIntensity;
      pipeline.bloomKernel = 12;
      pipeline.bloomScale = 0.5;
    }

    // Configure Depth of Field (DOF)
    pipeline.depthOfFieldEnabled = enableDOF;
    if (pipeline.depthOfFieldEnabled && pipeline.depthOfField) {
      pipeline.depthOfField.focalLength = 150;
      pipeline.depthOfField.fStop = 2.0;
      pipeline.depthOfField.focusDistance = 2000;
      pipeline.depthOfField.lensSize = 50;
    }

    // Configure Image Processing
    pipeline.imageProcessingEnabled = enableImageProcessing;
    if (pipeline.imageProcessing) {
      pipeline.imageProcessing.contrast = contrast;
      pipeline.imageProcessing.exposure = exposure;
      pipeline.imageProcessing.toneMappingEnabled = true;
      pipeline.imageProcessing.toneMappingType = 1; // ACES
      pipeline.imageProcessing.vignetteEnabled = false;
    }

    // Create SSAO (Screen Space Ambient Occlusion)
    if (enableSSAO) {
      const ssao = new SSAO2RenderingPipeline(
        'ssao',
        scene,
        {
          ssaoRatio: 0.5, // SSAO resolution (0.5 = half screen resolution)
      blurRatio: 1.0 // Blur resolution
        },
        [camera]
      );
      ssaoRef.current = ssao;
      
      ssao.radius = 2.0;
      ssao.totalStrength = 0.4;
      ssao.expensiveBlur = true;
      ssao.samples = 16;
      ssao.maxZ = 100;
    }

    // Cleanup khi component unmount
    return () => {
      if (pipelineRef.current) {
        pipelineRef.current.dispose();
        pipelineRef.current = null;
      }
      if (ssaoRef.current) {
        ssaoRef.current.dispose();
        ssaoRef.current = null;
      }
    };
  }, [isSceneReady, scene, camera]); // Removed options from dependency array to prevent flickering
};

export default usePostProcessing;