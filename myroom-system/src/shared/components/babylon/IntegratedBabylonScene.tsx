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
  Mesh, MeshBuilder, StandardMaterial, AbstractMesh
} from '@babylonjs/core';
import '@babylonjs/loaders';

import { ActiveMovement, TouchMovement } from '../../types/AvatarTypes';
import { AvatarConfig } from '../../types/AvatarTypes';

import { useRoomLoader } from '../room/RoomLoader';
import { useItemLoader } from '../items/ItemLoader';
import { useItemManipulator } from '../items/ItemManipulator';

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

  // Use item manipulator component
  const { selectItem, deselectItem, updateGizmo } = useItemManipulator({
    loadedItemMeshesRef,
    utilityLayerRef,
    gizmoMode: props.gizmoMode,
    selectedItem: props.selectedItem,
    onSelectItem: props.onSelectItem,
    onItemTransformChange: props.onItemTransformChange,
    highlightDiscRef: highlightDiscRef
  });

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
      const highlightDisc = MeshBuilder.CreateDisc(
        'highlightDisc',
        { radius: 0.7, tessellation: 64 },
        scene
      );
      highlightDisc.rotation.x = Math.PI / 2; // Rotate to lie flat on the ground
      highlightDisc.isVisible = false; // Initially hidden
      highlightDisc.material = new StandardMaterial('highlightMaterial', scene);
      (highlightDisc.material as StandardMaterial).diffuseColor = new Color3(0, 0, 1); // Blue color
      (highlightDisc.material as StandardMaterial).alpha = 0.5; // Semi-transparent
      highlightDiscRef.current = highlightDisc;

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

      // Variable to track double click/touch
      let lastClickTime = 0;
      const doubleClickThreshold = 300; // Time threshold for double click (ms)

      // Track right mouse button to disable camera damping
      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
          // Check if it's right mouse button (button 2)
          if (pointerInfo.event && pointerInfo.event.button === 2) {
            isRightMouseDownRef.current = true;
          }
          // Check if it's left mouse button (button 0) - start orbit
          if (pointerInfo.event && pointerInfo.event.button === 0) {
            cameraFollowStateRef.current.shouldFollowAvatar = true;
          }
        } else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
          // Reset when releasing right mouse button
          if (pointerInfo.event && pointerInfo.event.button === 2) {
            isRightMouseDownRef.current = false;
            // Resume camera follow after releasing right mouse button
            cameraFollowStateRef.current.shouldFollowAvatar = true;
          }
        }

        if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
          const pickInfo = scene.pick(scene.pointerX, scene.pointerY);

          if (pickInfo?.hit && pickInfo.pickedMesh) {
            const isItem = loadedItemMeshesRef.current.some((itemContainer) => {
              // Check if the picked mesh is a child or descendant of any item container
              let currentParent = pickInfo.pickedMesh?.parent;
              while (currentParent) {
                if (currentParent === itemContainer) {
                  return true;
                }
                currentParent = currentParent.parent;
              }
              return false;
            });

            // Change cursor to pointer if hovering over an item
            if (isItem) {
              canvasRef.current!.style.cursor = 'pointer';
            } else {
              canvasRef.current!.style.cursor = 'default';
            }
          } else {
            canvasRef.current!.style.cursor = 'default';
          }
        }
      });

      // // Ground
      let ground = MeshBuilder.CreateBox("ground", {
        width: 4.5,
        depth: 4.5,
        height: 0.09
      }, scene);
      ground.position.y = -0.1 / 2;
      ground.receiveShadows = true;

      // // Wall 1
      // let wall1 = MeshBuilder.CreateBox("wall1", {
      //   width: 6,
      //   height: 3,
      //   depth: 0.1
      // }, scene);
      // wall1.position.y = 3 / 2;
      // wall1.position.z = -6 / 2 + 0.1 / 2;

      // // Wall 2
      // let wall2 = MeshBuilder.CreateBox("wall2", {
      //   width: 6,
      //   height: 3,
      //   depth: 0.1
      // }, scene);
      // wall2.rotation.y = Math.PI / 2;
      // wall2.position.y = 3 / 2;
      // wall2.position.x = -6 / 2 + 0.1 / 2;

      let selectedMesh: AbstractMesh | null = null;
      let isDragging = false;
      let dragStartPoint: Vector3 | null = null; // Store the starting point of the drag
      let initialMeshPosition: Vector3 | null = null; // Store the initial position of the mesh

      const setAvatarVisibility = (isVisible: boolean) => {
        if (avatarRef.current) {
          avatarRef.current.getChildMeshes().forEach((mesh) => {
            mesh.isVisible = isVisible;
          });
        }
      };

      const deselectItem = () => {
        if (selectedMesh)
        {
          selectedMesh = null;
          isDragging = false;
          dragStartPoint = null;
          initialMeshPosition = null;
          // Show the avatar if not dragging
          setAvatarVisibility(true);
        }
      }

      const setHighlightDiscPosition = (position: Vector3) => {
        if (highlightDiscRef.current) {
          highlightDiscRef.current.position.copyFrom(position);
          highlightDiscRef.current.position.y += 0.02; // Slightly above ground to avoid z-fighting
          highlightDiscRef.current.isVisible = true; // Show the disc
        }
      }

      const hideHighlightDisc = () => {
        if (highlightDiscRef.current) {
          highlightDiscRef.current.isVisible = false;
        }
      }

      scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
          case PointerEventTypes.POINTERDOWN: {
            const pickResult = scene.pick(scene.pointerX, scene.pointerY);
            if (pickResult?.hit) {
              if (pickResult.pickedMesh?.metadata && pickResult.pickedMesh?.metadata.isFurniture) {
                // Find the top-most parent mesh
                let currentMesh = pickResult.pickedMesh;
                while (currentMesh.parent && currentMesh.parent instanceof AbstractMesh) {
                  currentMesh = currentMesh.parent;
                }

                selectedMesh = currentMesh;
                isDragging = true;
                dragStartPoint = pickResult.pickedPoint?.clone() || null; // Store the drag start point
                initialMeshPosition = selectedMesh.position.clone(); // Store the initial position of the mesh
                setHighlightDiscPosition(selectedMesh.getAbsolutePosition());

                // Hide the avatar while dragging
                setAvatarVisibility(false);

                // Detach camera controls to prevent rotation while dragging
                camera.detachControl();
              }
              else {
                // If clicked on ground or other non-item mesh, deselect any selected item
                deselectItem();
                hideHighlightDisc();
              }
            }
            else {
              deselectItem();
              hideHighlightDisc();
            }
            break;
          }

          case PointerEventTypes.POINTERUP: {
            deselectItem();

            // Reattach camera controls after dragging ends
            camera.attachControl(canvasRef.current!, true);
            break;
          }

          case PointerEventTypes.POINTERMOVE: {
            if (isDragging && selectedMesh && dragStartPoint && initialMeshPosition) {
              const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh === ground);
              if (pickResult?.hit && pickResult.pickedPoint) {
                // Calculate the relative movement of the cursor
                const delta = pickResult.pickedPoint.subtract(dragStartPoint);

                // Apply the relative movement to the initial position of the mesh
                const newPosition = initialMeshPosition.add(delta);

                // Apply boundary constraints
                // newPosition.x = Math.max(-2.5, Math.min(2.5, newPosition.x));
                // newPosition.z = Math.max(-4, Math.min(3.3, newPosition.z));
                newPosition.y = selectedMesh.position.y; // Keep Y constant

                selectedMesh.position = newPosition;
                setHighlightDiscPosition(selectedMesh.getAbsolutePosition());
              }
            }
            break;
          }

          default:
            break;
        }
      });

      // Setup click/touch selection for items and double click for avatar movement
      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
          console.log('Pointer down detected');
          const currentTime = new Date().getTime();
          const isDoubleClick = (currentTime - lastClickTime) < doubleClickThreshold;
          lastClickTime = currentTime;

          const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
          console.log('Pick info:', pickInfo);
          console.log('Loaded items count:', loadedItemMeshesRef.current.length);

          // Handle double click/touch to move avatar
          if (isDoubleClick && avatarRef.current) {
            console.log('[DEBUG] Double click detected, moving avatar...');
            // Create ray from camera through click point
            const ray = scene.createPickingRay(
              scene.pointerX,
              scene.pointerY,
              Matrix.Identity(),
              camera
            );
            // Calculate intersection of ray with y=0 plane (ground plane)
            const planeNormal = new Vector3(0, 1, 0); // y=0 plane has normal (0,1,0)
            const planePoint = new Vector3(0, 0, 0); // A point on the plane
            // Calculate intersection
            const denominator = Vector3.Dot(ray.direction, planeNormal);
            // Check if ray is not parallel to the plane
            if (Math.abs(denominator) > 0.0001) {
              const t = Vector3.Dot(planePoint.subtract(ray.origin), planeNormal) / denominator;
              // Check if intersection is in front of camera
              if (t >= 0) {
                // Calculate intersection point
                const intersectionPoint = ray.origin.add(ray.direction.scale(t));
                moveAvatarToPosition(intersectionPoint, targetDisc);
              }
            }
            return; // Don't handle item selection if it's double click
          }
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

  // Update gizmo when mode changes (handled by ItemManipulator component)
  useEffect(() => {
    if (selectedItemRef.current) {
      updateGizmo(selectedItemRef.current);
    }
  }, [props.gizmoMode, updateGizmo]);

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