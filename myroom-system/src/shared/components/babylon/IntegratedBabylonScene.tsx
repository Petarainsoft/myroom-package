import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight, DirectionalLight,
  ShadowGenerator,
  SceneLoader,
  TransformNode,
  PointerEventTypes,
  Color3,
  UtilityLayerRenderer,
  PositionGizmo, RotationGizmo, ScaleGizmo,
  EasingFunction, CubicEase,
  Color4, Matrix,
  Animation,
  Mesh, MeshBuilder, StandardMaterial, AbstractMesh, Quaternion, Axis
} from '@babylonjs/core';
import '@babylonjs/loaders';

import { ActiveMovement, TouchMovement } from '../../types/AvatarTypes';
import { AvatarConfig } from '../../types/AvatarTypes';

import { useRoomLoader } from '../room/RoomLoader';
import { useItemLoader } from '../items/ItemLoader';

import { useSkybox } from '../../hooks/useSkybox';
import { usePostProcessing } from '../../hooks/usePostProcessing';
import { domainConfig } from '../../config/appConfig';

import { LoadedItem } from '../../types/LoadedItem';
import { ItemManipulationControls } from './ItemManipulationControls';
import { useAvatarMovement } from './useAvatarMovement';
import SceneControlButtons from './SceneControlButtons';
// Import the new avatar loader hook
import { useAvatarLoader } from './useAvatarLoader';

// Props cho component IntegratedBabylonScene
interface IntegratedSceneProps {
  roomPath?: string; // Path to room model
  roomResourcePath?: string | null; // Resource path for room API
  avatarConfig?: AvatarConfig; // Avatar configuration (gender, body parts)
  activeMovement?: ActiveMovement; // Current movement state
  touchMovement?: TouchMovement; // Touch control input data
  loadedItems?: LoadedItem[]; // List of items to be loaded
  onSceneReady?: (scene: any) => void; // Callback when scene is ready
  gizmoMode?: 'position' | 'rotation' | 'scale'; // Current gizmo mode
  onGizmoModeChange?: (mode: 'position' | 'rotation' | 'scale') => void; // Callback when gizmo mode changes
  selectedItem?: any; // Currently selected item
  onSelectItem?: (item: any) => void; // Callback when an item is selected
  onItemTransformChange?: (itemId: string, transform: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; scale: { x: number; y: number; z: number } }) => void; // Callback when item transform changes
  onToggleUIOverlay?: () => void; // Callback to toggle UI overlay visibility
}

// Define externally exposed ref interface for the component
interface IntegratedSceneRef {
  resetCamera: () => void; // Function to reset camera to default position
}

// Main component managing Babylon.js scene integration with React
const IntegratedBabylonScene = forwardRef<IntegratedSceneRef, IntegratedSceneProps>(({ ...props }, ref) => {
  // Declare refs for Babylon.js objects
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const roomRef = useRef<TransformNode | null>(null);
  const avatarRef = useRef<TransformNode | null>(null);
  const itemsRef = useRef<TransformNode | null>(null);
  const utilityLayerRef = useRef<UtilityLayerRenderer | null>(null);
  const gizmoRef = useRef<PositionGizmo | RotationGizmo | ScaleGizmo | null>(null);
  const selectedItemRef = useRef<any>(null);
  const loadedItemMeshesRef = useRef<any[]>([]);
  const highlightDiscRef = useRef<Mesh | null>(null);
  const shadowGeneratorRef = useRef<ShadowGenerator | null>(null);
  const targetDiscRef = useRef<Mesh | null>(null);

  // Animation-related refs
  const idleAnimRef = useRef<any>(null);
  const walkAnimRef = useRef<any>(null);
  const currentAnimRef = useRef<any>(null);
  const allIdleAnimationsRef = useRef<any[]>([]);
  const allWalkAnimationsRef = useRef<any[]>([]);
  const allCurrentAnimationsRef = useRef<any[]>([]);

  const [isSceneReady, setIsSceneReady] = useState(false);

  // Use avatar movement hook
  const {
    avatarMovementStateRef,
    cameraFollowStateRef,
    isRightMouseDownRef,
    animationBlendingRef,
    avatarMovementObserverRef,
    moveAvatarToPosition,
    resetAvatarMovement,
    AVATAR_BOUNDARY_LIMIT,
    CAMERA_TARGET_HEAD_OFFSET
  } = useAvatarMovement({
    sceneRef,
    cameraRef,
    avatarRef,
    touchMovement: props.touchMovement,
    isSceneReady,
    idleAnimRef,
    walkAnimRef,
    currentAnimRef,
    allIdleAnimationsRef,
    allWalkAnimationsRef,
    allCurrentAnimationsRef
  });

  // Setup default camera target
  const DEFAULT_CAMERA_TARGET_POSITION = new Vector3(0, 1, 0);

  // --- Avatar Loader Hook ---
  // This hook manages avatar part loading, gender switching, and animation management
  const {
    isAnimationReady,
    loadedAvatarPartsRef
  } = useAvatarLoader({
    sceneRef,
    avatarConfig: props.avatarConfig,
    domainConfig,
    idleAnimRef,
    walkAnimRef,
    currentAnimRef,
    allIdleAnimationsRef,
    allWalkAnimationsRef,
    allCurrentAnimationsRef,
    avatarRef,
    shadowGeneratorRef: shadowGeneratorRef
  });

  // Debug: log trạng thái animation và mesh avatar khi animation ready thay đổi
  useEffect(() => {
    console.log('[DEBUG] isAnimationReady:', isAnimationReady);
    if (loadedAvatarPartsRef && loadedAvatarPartsRef.current) {
      Object.entries(loadedAvatarPartsRef.current).forEach(([partType, meshes]) => {
        console.log(`[DEBUG] Avatar part: ${partType}, mesh count: ${meshes.length}`);
        meshes.forEach(mesh => {
          console.log(`[DEBUG] Mesh: ${mesh.name}, isEnabled: ${mesh.isEnabled?.()}, isVisible: ${mesh.isVisible}`);
        });
      });
    }
  }, [isAnimationReady, loadedAvatarPartsRef]);

  // Function to reset camera with smooth animation
  const resetCamera = () => {
    if (cameraRef.current && sceneRef.current) {
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      const defaultAlpha = Math.PI / 2;
      const defaultBeta = Math.PI / 3;
      const defaultRadius = 10;
      const defaultTarget = DEFAULT_CAMERA_TARGET_POSITION;
      const animationDuration = 60;
      const alphaAnimation = new Animation(
        'cameraAlphaAnimation',
        'alpha',
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      const alphaKeys = [
        { frame: 0, value: camera.alpha },
        { frame: animationDuration, value: defaultAlpha }
      ];
      alphaAnimation.setKeys(alphaKeys);
      const betaAnimation = new Animation(
        'cameraBetaAnimation',
        'beta',
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      const betaKeys = [
        { frame: 0, value: camera.beta },
        { frame: animationDuration, value: defaultBeta }
      ];
      betaAnimation.setKeys(betaKeys);
      const radiusAnimation = new Animation(
        'cameraRadiusAnimation',
        'radius',
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      const radiusKeys = [
        { frame: 0, value: camera.radius },
        { frame: animationDuration, value: defaultRadius }
      ];
      radiusAnimation.setKeys(radiusKeys);
      const easingFunction = new CubicEase();
      easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
      alphaAnimation.setEasingFunction(easingFunction);
      betaAnimation.setEasingFunction(easingFunction);
      radiusAnimation.setEasingFunction(easingFunction);
      camera.setTarget(defaultTarget);
      scene.beginAnimation(camera, 0, animationDuration, false, 1.0);
      camera.animations = [alphaAnimation, betaAnimation, radiusAnimation];
    }
  };

  // Function to reset both camera and avatar to initial positions
  const resetAll = () => {
    resetCamera();
    resetAvatarMovement();
  };

  useImperativeHandle(ref, () => ({
    resetCamera
  }), []);

  // Initialize Babylon scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const initScene = async () => {
      // Create engine with antialiasing and HDR texture support
      const engine = new Engine(canvasRef.current!, true, {
        antialias: true,
        adaptToDeviceRatio: true,
        powerPreference: "high-performance",
        stencil: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true
      });
      engineRef.current = engine;

      // Create scene with improved clear color
      const scene = new Scene(engine);
      scene.clearColor = new Color4(0.05, 0.05, 0.05, 1.0);
      scene.ambientColor = new Color3(0.3, 0.3, 0.3);
      scene.imageProcessingConfiguration.contrast = 1.1;
      scene.imageProcessingConfiguration.exposure = 1.1;
      scene.imageProcessingConfiguration.toneMappingEnabled = true;
      sceneRef.current = scene;

      // Notify parent component that scene is ready
      if (props.onSceneReady) {
        props.onSceneReady(scene);
      }

      // Create camera - positioned to look from opposite side towards center
      const camera = new ArcRotateCamera(
        'camera',
        Math.PI / 1.335,  // Changed from -Math.PI / 2 to Math.PI / 2 for opposite side
        Math.PI / 2.8,
        10,
        DEFAULT_CAMERA_TARGET_POSITION,
        scene
      );
      camera.attachControl(canvasRef.current!, true);
      camera.minZ = 0.1; // Closer near plane for better precision
      camera.fov = 0.8; // Slightly narrower FOV for better detail
      camera.wheelPrecision = 50; // More precise zooming
      camera.lowerRadiusLimit = 2; // Limit how close camera can get
      camera.upperRadiusLimit = 15; // Limit how far camera can go
      camera.upperBetaLimit = Math.PI / 1.95;
      cameraRef.current = camera;

      // Create enhanced lighting with increased brightness
      const light = new HemisphericLight('light', new Vector3(0, -1, 0), scene);
      light.intensity = 1.15; // Increased from 1.8 for more brightness
      light.diffuse = new Color3(1, 0.98, 0.95); // Slightly warm light
      light.specular = new Color3(1, 1, 1);
      light.groundColor = new Color3(0.25, 0.25, 0.3); // Slightly brighter ground reflection

      // Add a fill light from opposite direction for better overall illumination
      const fillLight = new HemisphericLight('fillLight', new Vector3(0, 1, 0), scene);
      fillLight.intensity = 1.15;
      fillLight.diffuse = new Color3(0.9, 0.9, 1.0); // Slightly cool fill light
      fillLight.specular = new Color3(0.5, 0.5, 0.5);

      // Add directional light for shadows with improved settings
      const directionalLight = new DirectionalLight('directionalLight', new Vector3(-0.8, -2, -1), scene);
      directionalLight.intensity = 1.15; // Increased from 0.9 for more brightness
      directionalLight.diffuse = new Color3(1, 0.97, 0.9); // Slightly warm sunlight
      directionalLight.specular = new Color3(1, 1, 1);

      // Create a shadow generator
      const shadowGenerator = new ShadowGenerator(1024, directionalLight);
      shadowGenerator.useBlurExponentialShadowMap = true; // Optional: Enable soft shadows
      shadowGenerator.blurKernel = 32; // Optional: Adjust shadow softness
      shadowGeneratorRef.current = shadowGenerator;

      // Create a highlight disc
      const highlightDiscRadius = 0.7;
      const highlightDisc = MeshBuilder.CreateDisc(
        'highlightDisc',
        { radius: highlightDiscRadius, tessellation: 64 },
        scene
      );
      highlightDisc.rotation.x = Math.PI / 2; // Rotate to lie flat on the ground
      highlightDisc.isVisible = false; // Initially hidden
      highlightDisc.material = new StandardMaterial('highlightMaterial', scene);
      (highlightDisc.material as StandardMaterial).diffuseColor = new Color3(0, 0, 1); // Blue color
      (highlightDisc.material as StandardMaterial).alpha = 0.5; // Semi-transparent
      highlightDiscRef.current = highlightDisc;

      // Add 4 small colored circles at 0, 90, 180, 270 degrees around the highlightDisc
      const smallCircleRadius = 0.15;
      const angles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
      const color = new Color3(0, 1, 0);
      const highlightDiscCircles: Mesh[] = [];
      angles.forEach((angle, i) => {
        const x = highlightDiscRadius * Math.cos(angle);
        const y = highlightDiscRadius * Math.sin(angle);
        const circle = MeshBuilder.CreateDisc(
          `highlightDiscCircle${i}`,
          { radius: smallCircleRadius, tessellation: 32 },
          scene
        );
        circle.position = new Vector3(x, y, -0.01);
        circle.parent = highlightDisc;
        const mat = new StandardMaterial(`highlightDiscCircleMat${i}`, scene);
        mat.diffuseColor = color;
        mat.alpha = 0.85;
        circle.material = mat;
        circle.isPickable = true;
        circle.isVisible = false; // Initially hidden
        highlightDiscCircles.push(circle);
      });

      // Create a green circle for the target position
      const targetDisc = MeshBuilder.CreateDisc(
        'targetDisc',
        { radius: 0.1, tessellation: 64 },
        scene
      );
      targetDisc.rotation.x = Math.PI / 2; // Rotate to lie flat on the ground
      targetDisc.isVisible = false; // Initially hidden
      targetDisc.material = new StandardMaterial('targetMaterial', scene);
      (targetDisc.material as StandardMaterial).diffuseColor = new Color3(0, 1, 0); // Green color
      (targetDisc.material as StandardMaterial).alpha = 0.5; // Semi-transparent

      // Create an animation for the radius
      const radiusAnimation = new Animation(
        'radiusAnimation',
        'scaling', // Animating the scaling of the disc
        45, // Frames per second
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CYCLE
      );

      // Define keyframes for the animation
      const radiusKeys = [
        { frame: 0, value: new Vector3(1, 1, 1) }, // Start with normal size
        { frame: 15, value: new Vector3(2, 2, 1) }, // Scale up uniformly
        { frame: 30, value: new Vector3(1, 1, 1) }, // Scale back down
      ];
      radiusAnimation.setKeys(radiusKeys);

      // Attach the animation to the targetDisc
      targetDisc.animations = [radiusAnimation];
      scene.beginAnimation(targetDisc, 0, 30, true); // Loop the animation

      // Skybox will be handled by useSkybox hook

      // Create room container
      const roomContainer = new TransformNode('roomContainer', scene);
      roomRef.current = roomContainer;

      // Post-processing will be handled by usePostProcessing hook

      // Create avatar container
      const avatarContainer = new TransformNode('avatarContainer', scene);
      avatarContainer.position = new Vector3(0, 0, 0);
      // Calculate rotation to face the camera
      const cameraPosition = camera.position.clone();
      const directionToCamera = cameraPosition.subtract(avatarContainer.position);
      avatarContainer.rotation.y = Math.atan2(directionToCamera.x, directionToCamera.z); // Adjust rotation to face the camera

      avatarRef.current = avatarContainer;

      // Create items container
      const itemsContainer = new TransformNode('itemsContainer', scene);
      itemsRef.current = itemsContainer;

      // Create utility layer for gizmos
      const utilityLayer = new UtilityLayerRenderer(scene);
      utilityLayerRef.current = utilityLayer;

      // // Ground
      let ground = MeshBuilder.CreateBox("ground", {
        width: 4.5,
        depth: 4.5,
        height: 0.09
      }, scene);
      ground.position.y = -0.1 / 2;
      ground.receiveShadows = true;

      // --- Pointer Event Helpers ---
      const setAvatarVisibility = (isVisible: boolean) => {
        if (avatarRef.current) {
          isAvatarVisible = isVisible;
          avatarRef.current.getChildMeshes().forEach((mesh) => {
            mesh.isVisible = isVisible;
          });
        }
      };

      const setHighlightDiscPosition = (position: Vector3) => {
        if (highlightDiscRef.current) {
          highlightDiscRef.current.position.copyFrom(position);
          highlightDiscRef.current.position.y += 0.02;
          highlightDiscRef.current.isVisible = true;
          highlightDiscCircles.forEach(circle => circle.isVisible = true);
        }
      };

      const hideHighlightDisc = () => {
        if (highlightDiscRef.current) {
          highlightDiscRef.current.isVisible = false;
          highlightDiscCircles.forEach(circle => circle.isVisible = false);
        }
      };

      const deselectItem = () => {
        if (selectedMesh && !isDragging) {
          selectedMesh = null;
          isDragging = false;
          dragStartPoint = null;
          initialMeshPosition = null;
          setAvatarVisibility(true);
          hideHighlightDisc();
        }
      };

      // --- Pointer State ---
      let isAvatarVisible = true;
      let selectedMesh: AbstractMesh | null = null;
      let isDragging = false;
      let dragStartPoint: Vector3 | null = null;
      let initialMeshPosition: Vector3 | null = null;
      let lastClickTime = 0;
      const doubleClickThreshold = 300;
      // For disc child drag-rotate
      let isRotatingByDisc = false;
      let lastPointerX = 0;
      let deltaX = 0;
      const rotationSpeed = 0.02;
      const SNAP_STEP_RAD = Math.PI / 12; // 15 degrees in radians
      let accumulatedRotation = 0;

      // --- Unified Pointer Observable ---
      scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
          case PointerEventTypes.POINTERDOWN: {
            const currentTime = new Date().getTime();
            const isDoubleClick = (currentTime - lastClickTime) < doubleClickThreshold;
            lastClickTime = currentTime;

            const pickResult = scene.pick(scene.pointerX, scene.pointerY);

            // Double click: move avatar
            if (isDoubleClick && avatarRef.current && isAvatarVisible) {
              const ray = scene.createPickingRay(
                scene.pointerX,
                scene.pointerY,
                Matrix.Identity(),
                camera
              );
              const planeNormal = new Vector3(0, 1, 0);
              const planePoint = new Vector3(0, 0, 0);
              const denominator = Vector3.Dot(ray.direction, planeNormal);
              if (Math.abs(denominator) > 0.0001) {
                const t = Vector3.Dot(planePoint.subtract(ray.origin), planeNormal) / denominator;
                if (t >= 0) {
                  const intersectionPoint = ray.origin.add(ray.direction.scale(t));
                  moveAvatarToPosition(intersectionPoint, targetDisc);
                }
              }
              return;
            }

            // Reset both flags
            isDragging = false;
            isRotatingByDisc = false;

            // Item selection/drag
            if (pickResult?.hit && pickResult.pickedMesh?.metadata && pickResult.pickedMesh?.metadata.isFurniture) {
              let currentMesh = pickResult.pickedMesh;
              while (currentMesh.parent && currentMesh.parent instanceof AbstractMesh) {
                currentMesh = currentMesh.parent;
              }
              selectedMesh = currentMesh;
              console.log('selectedMesh', selectedMesh, 'children', selectedMesh.getChildren());
              isDragging = true;
              dragStartPoint = pickResult.pickedPoint?.clone() || null;
              initialMeshPosition = selectedMesh.position.clone();
              setHighlightDiscPosition(selectedMesh.getAbsolutePosition());
              setAvatarVisibility(false);
              camera.detachControl();
            } else if (pickResult?.hit && ((highlightDiscRef.current && pickResult.pickedMesh === highlightDiscRef.current) || (pickResult.pickedMesh?.parent === highlightDiscRef.current))) {
              // Clicked on the highlight disc or its children
              camera.detachControl();
              // If it's a child circle, enable rotation mode
              if (pickResult.pickedMesh?.parent === highlightDiscRef.current) {
                isRotatingByDisc = true;
                lastPointerX = scene.pointerX;
              }
            } else {
              if (!isDragging && !isRotatingByDisc) {
                deselectItem();
              }
            }

            // Camera follow/cursor state
            if (pointerInfo.event && pointerInfo.event.button === 2) {
              isRightMouseDownRef.current = true;
            }
            if (pointerInfo.event && pointerInfo.event.button === 0) {
              cameraFollowStateRef.current.shouldFollowAvatar = true;
            }
            break;
          }

          case PointerEventTypes.POINTERUP: {
            // Only deselect if neither dragging nor rotating
            if (!isDragging && !isRotatingByDisc) {
              deselectItem();
              hideHighlightDisc();
            }
            camera.attachControl(canvasRef.current!, true);
            isDragging = false;
            isRotatingByDisc = false;
            accumulatedRotation = 0;
            if (highlightDiscRef.current) {
              highlightDiscRef.current.rotation.y = 0;
            }
            if (pointerInfo.event && pointerInfo.event.button === 2) {
              isRightMouseDownRef.current = false;
              cameraFollowStateRef.current.shouldFollowAvatar = true;
            }
            break;
          }

          case PointerEventTypes.POINTERMOVE: {
            // Only one action at a time
            if (isDragging && selectedMesh && dragStartPoint && initialMeshPosition && !isRotatingByDisc) {
              const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh === ground);
              if (pickResult?.hit && pickResult.pickedPoint) {
                const delta = pickResult.pickedPoint.subtract(dragStartPoint);
                const newPosition = initialMeshPosition.add(delta);
                newPosition.y = selectedMesh.position.y;
                selectedMesh.position = newPosition;
                setHighlightDiscPosition(selectedMesh.getAbsolutePosition());
              }
            } else if (isRotatingByDisc && selectedMesh && !isDragging) {
              deltaX = scene.pointerX - lastPointerX;
              // Find the top-most parent
              let topMost = selectedMesh;
              while (topMost.parent && topMost.parent instanceof AbstractMesh) {
                topMost = topMost.parent;
              }
              // Accumulate rotation
              let rotationDelta = -deltaX * rotationSpeed;
              accumulatedRotation += rotationDelta;
              // Snap to nearest 12-degree step
              if (Math.abs(accumulatedRotation) >= SNAP_STEP_RAD) {
                const steps = Math.floor(accumulatedRotation / SNAP_STEP_RAD);
                const snappedDelta = steps * SNAP_STEP_RAD;
                if (topMost.rotationQuaternion) {
                  topMost.rotationQuaternion = topMost.rotationQuaternion.multiply(
                    Quaternion.RotationAxis(Axis.Y, snappedDelta)
                  );
                } else {
                  topMost.rotation.y += snappedDelta;
                }
                accumulatedRotation -= snappedDelta;
                setHighlightDiscPosition(topMost.getAbsolutePosition());
                // Synchronize highlight disc rotation
                if (highlightDiscRef.current) {
                  if (topMost.rotationQuaternion) {
                    const euler = topMost.rotationQuaternion.toEulerAngles();
                    highlightDiscRef.current.rotation.y = euler.y;
                  } else {
                    highlightDiscRef.current.rotation.y = topMost.rotation.y;
                  }
                }
              }
              lastPointerX = scene.pointerX;
            }

            // Cursor feedback
            const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
            if (pickInfo?.hit && pickInfo.pickedMesh) {
              const isItem = loadedItemMeshesRef.current.some((itemContainer) => {
                let currentParent = pickInfo.pickedMesh?.parent;
                while (currentParent) {
                  if (currentParent === itemContainer) return true;
                  currentParent = currentParent.parent;
                }
                return false;
              });
              canvasRef.current!.style.cursor = isItem ? 'pointer' : 'default';
            } else {
              canvasRef.current!.style.cursor = 'default';
            }
            break;
          }

          default:
            break;
        }
      });

      // Start render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      // Add direct canvas click listener for testing
      canvasRef.current!.addEventListener('click', (e) => {
        console.log('Canvas clicked directly:', e);
      });

      // Add wheel event listener to prevent page scroll when mouse is over canvas
      const handleWheel = (e: WheelEvent) => {
        // Prevent default page scroll behavior
        e.preventDefault();
        e.stopPropagation();
      };

      canvasRef.current!.addEventListener('wheel', handleWheel, { passive: false });

      console.log('Scene setup complete, pointer observable added');

      setIsSceneReady(true);
    };

    initScene();

    // Cleanup
    return () => {
      // Remove wheel event listener
      // if (canvasRef.current) {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('wheel', (event: WheelEvent) => {
          event.preventDefault();
        });
      }
      // }

      if (gizmoRef.current) {
        gizmoRef.current.dispose();
      }
      if (utilityLayerRef.current) {
        utilityLayerRef.current.dispose();
      }
      if (engineRef.current) {
        engineRef.current.dispose();
      }

      // Cleanup animations
      idleAnimRef.current?.stop();
      walkAnimRef.current?.stop();

      // Cleanup sync intervals
      if (walkAnimRef.current?._syncIntervals) {
        walkAnimRef.current._syncIntervals.forEach((interval: number) => clearInterval(interval));
        walkAnimRef.current._syncIntervals = [];
      }

      idleAnimRef.current = null;
      walkAnimRef.current = null;
      currentAnimRef.current = null;
    };
  }, []);

  // Use room loader component
  useRoomLoader({
    scene: sceneRef.current,
    roomPath: props.roomPath,
    roomResourcePath: props.roomResourcePath,
    isSceneReady,
    roomRef
  });

  // Use item loader component
  useItemLoader({
    scene: sceneRef.current,
    loadedItems: props.loadedItems,
    isSceneReady,
    itemsRef,
    loadedItemMeshesRef,
    shadowGeneratorRef
  });

  // Use skybox hook
  useSkybox({
    scene: sceneRef.current,
    isSceneReady
  });

  // Use post-processing hook
  usePostProcessing({
    scene: sceneRef.current,
    camera: cameraRef.current,
    isSceneReady,
    options: {
      enableFXAA: true,
      enableMSAA: true,
      enableBloom: true,
      bloomThreshold: 0.2,
      bloomIntensity: 0.3,
      enableDOF: false,
      enableImageProcessing: true,
      contrast: 1.1,
      exposure: 1.0,
      enableSSAO: true
    }
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const container = document.querySelector('.babylon-scene-container');

    if (!container) return;

    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);

      // Force engine resize to maintain render quality in fullscreen
      if (engineRef.current) {
        // Small delay to ensure the browser has completed the fullscreen transition
        setTimeout(() => {
          if (engineRef.current) {
            engineRef.current.resize();
            // Update engine's hardware scaling to maintain quality
            engineRef.current.setHardwareScalingLevel(1.0);
          }
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Listen for container and window resize events
  useEffect(() => {
    if (!canvasRef.current || !engineRef.current) return;

    const handleResize = () => {
      if (engineRef.current && cameraRef.current && canvasRef.current) {
        // Force engine resize to match canvas size
        engineRef.current.resize();

        // Get actual canvas dimensions
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Update camera aspect ratio to prevent distortion
        const aspectRatio = width / height;
        cameraRef.current.fov = 0.8; // Base FOV

        // Adjust FOV based on aspect ratio to maintain proper view
        if (aspectRatio < 1) {
          // Portrait mode - increase FOV slightly
          cameraRef.current.fov = 0.9;
        } else if (aspectRatio > 1.5) {
          // Wide screen - decrease FOV slightly
          cameraRef.current.fov = 0.7;
        }

        // Force camera to update its projection matrix
        cameraRef.current.getProjectionMatrix(true);
      }
    };

    // Add window resize listener
    window.addEventListener('resize', handleResize);

    // Try to observe the canvas parent container
    let resizeObserver: ResizeObserver | null = null;
    const canvasParent = canvasRef.current.parentElement;

    if (canvasParent) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          handleResize();
        }
      });
      resizeObserver.observe(canvasParent);
    }

    // Also try to observe specific containers if they exist
    const interactiveContainer = document.querySelector('.interactive-room-container');
    const babylonContainer = document.querySelector('.babylon-scene-container');

    if (interactiveContainer && babylonContainer && !resizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;

          // Update babylon container size to match interactive container
          (babylonContainer as HTMLElement).style.width = `${width}px`;
          (babylonContainer as HTMLElement).style.height = `${height}px`;

          handleResize();
        }
      });
      resizeObserver.observe(interactiveContainer);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="babylon-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'auto'
        }}
      />
      <SceneControlButtons
        onReset={resetAll}
        onToggleFullscreen={() => { }}
        onToggleUIOverlay={props.onToggleUIOverlay || (() => { })}
        isFullscreen={isFullscreen}
      />
      {props.selectedItem && (
        <ItemManipulationControls
          gizmoMode={props.gizmoMode}
          onGizmoModeChange={props.onGizmoModeChange}
        />
      )}
    </div>
  );
});

IntegratedBabylonScene.displayName = 'IntegratedBabylonScene';

export { IntegratedBabylonScene };
export default IntegratedBabylonScene;