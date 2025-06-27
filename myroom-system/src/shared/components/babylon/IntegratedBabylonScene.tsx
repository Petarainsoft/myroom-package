import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight, DirectionalLight,
  SceneLoader,
  TransformNode,
  PointerEventTypes,
  Color3,
  UtilityLayerRenderer,
  PositionGizmo, RotationGizmo, ScaleGizmo,
  EasingFunction, CubicEase,
  Color4, Matrix,
  Animation
} from '@babylonjs/core';
import '@babylonjs/loaders';

import { ActiveMovement, TouchMovement } from '../../types/AvatarTypes';
import { availablePartsData, AvatarConfig } from '../../data/avatarPartsData';
import { findMappedBone } from '../../data/skeletonMapping';

import { useRoomLoader } from '../room/RoomLoader';
import { useItemLoader } from '../items/ItemLoader';
import { useItemManipulator } from '../items/ItemManipulator';

import { useSkybox } from '../../hooks/useSkybox';
import { usePostProcessing } from '../../hooks/usePostProcessing';
import { domainConfig } from '../../config/appConfig';

import { LoadedItem } from '../../types/LoadedItem';
import { ClonedAnimation } from '../../types/ClonedAnimation';
import { ItemManipulationControls } from './ItemManipulationControls';

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
const IntegratedBabylonScene = forwardRef<IntegratedSceneRef, IntegratedSceneProps>(({
    roomPath, // Path to room 3D model
    avatarConfig, // Avatar configuration
    touchMovement, // Touch control input data
    loadedItems, // List of items to be loaded
    onSceneReady, // Callback when scene is ready
    gizmoMode, // Current gizmo mode
    onGizmoModeChange, // Callback when gizmo mode changes
    selectedItem, // Currently selected item
    onSelectItem, // Callback when item is selected
    onItemTransformChange, // Callback when item transform changes
    onToggleUIOverlay // Callback to toggle UI overlay visibility
  },
  ref // Ref passed from parent component
) => {
  // Log received props for debugging
  try {
    console.log('IntegratedBabylonScene props received:', {
      hasAvatarConfig: !!avatarConfig,
      gender: avatarConfig?.gender,
      bodyPath: avatarConfig?.parts?.body
    });
  } catch (e) {
    console.error('Error logging props:', e);
  }

  // Declare refs for storing and accessing Babylon.js objects
  const canvasRef = useRef<HTMLCanvasElement>(null); // Ref to HTML canvas element
  const engineRef = useRef<Engine | null>(null); // Ref to Babylon.js engine
  const sceneRef = useRef<Scene | null>(null); // Ref to Babylon.js scene
  const cameraRef = useRef<ArcRotateCamera | null>(null); // Ref to camera
  const roomRef = useRef<TransformNode | null>(null); // Ref to room model transform node
  const avatarRef = useRef<TransformNode | null>(null); // Ref to avatar transform node
  const itemsRef = useRef<TransformNode | null>(null); // Ref to items container node
  const utilityLayerRef = useRef<UtilityLayerRenderer | null>(null); // Ref to utility layer for tools
  const gizmoRef = useRef<PositionGizmo | RotationGizmo | ScaleGizmo | null>(null); // Ref to current gizmo
  const selectedItemRef = useRef<any>(null); // Ref to currently selected item
  const loadedItemMeshesRef = useRef<any[]>([]); // Ref to list of loaded item meshes

  // Animation-related refs
  const idleAnimRef = useRef<any>(null); // Ref to idle animation
  const walkAnimRef = useRef<any>(null); // Ref to walk animation
  const currentAnimRef = useRef<any>(null); // Ref to currently active animation
  
  // Store all cloned animations for each animation type
  const allIdleAnimationsRef = useRef<any[]>([]); // All idle animations for all parts
  const allWalkAnimationsRef = useRef<any[]>([]); // All walk animations for all parts
  const allCurrentAnimationsRef = useRef<any[]>([]); // All currently active animations
  
  // Animation blending state
  const animationBlendingRef = useRef({
    isBlending: false, // Whether currently blending between animations
    blendDuration: 0.3, // Blend duration in seconds (300ms)
    blendProgress: 0, // Current blend progress (0-1)
    fromAnimations: [] as any[], // Animations blending from (all parts)
    toAnimations: [] as any[], // Animations blending to (all parts)
    startTime: 0 // Blend start time
  });

  // State for tracking scene readiness
  const [isSceneReady, setIsSceneReady] = useState(false);

  // Ref for storing avatar movement state
  const avatarMovementStateRef = useRef({
    isMoving: false, // Whether avatar is currently moving
    targetPosition: null as Vector3 | null, // Target position
    startPosition: null as Vector3 | null, // Start position
    animationProgress: 0, // Animation progress (0-1)
    movementSpeed: 1.5, // Movement speed (units/second), reduced by 50% from 3.0
    totalDistance: 0, // Total distance to travel
    targetRotation: 0, // Target rotation angle
    startRotation: 0, // Start rotation angle
    shouldRotate: false // Whether avatar needs to rotate
  });

  // Ref for storing camera follow state
  const cameraFollowStateRef = useRef({
    currentTarget: new Vector3(0, 0, 0), // Current camera target position
    dampingFactor: 0.1, // Movement smoothing factor (damping)
    shouldFollowAvatar: false // Flag controlling when camera should follow avatar
  });

  // Ref tracking right mouse button state
  const isRightMouseDownRef = useRef(false);

  // Ref to observer monitoring avatar movement
  const avatarMovementObserverRef = useRef<any>(null);

  // Function to load and apply animations from gender-specific animation files to the avatar
  const loadAnimationFromGLB = async (animationName: string, options?: {
    playImmediately?: boolean; // Play animation immediately after loading
    synchronizeAnimations?: boolean; // Synchronize animations across all avatar parts
  }) => {
    // Check if scene and avatar are ready
    if (!sceneRef.current || !avatarRef.current) {
      console.log(`⚠️ Scene or avatar not ready for ${animationName} animation loading`);
      return;
    }

    try {
      // Determine animation file based on avatar gender
      const currentGender = avatarConfig.gender;
      const animationFileName = currentGender === 'male' ? 'male_anims.glb' : 'female_anims.glb';
      
      // Log animation loading start
      console.log(`🎬 Loading ${animationName} animation from ${animationFileName} for ${currentGender} avatar...`);
      
      // Load animation file using Babylon.js SceneLoader with full URL
      const animationUrl = `${domainConfig.baseDomain}/animations/${animationFileName}`;
      const result = await SceneLoader.ImportMeshAsync("", animationUrl, "", sceneRef.current);

      // Check if animation groups exist in the result
      if (result.animationGroups && result.animationGroups.length > 0) {
        // Find animation group containing animationName (e.g., "walk", "idle")
        const targetAnimGroup = result.animationGroups.find(group =>
          group.name.toLowerCase().includes(animationName.toLowerCase()));

        // If no matching animation found, log error and exit
        if (!targetAnimGroup) {
          console.log(`⚠️ No ${animationName} animation found in ${animationFileName}`);
          return;
        }

        // Log successful animation loading
        console.log(`✅ ${animationName} animation loaded:`, targetAnimGroup.name);

        // Clone animation to apply to each skeleton of every avatar part
        // Find all skeletons from avatar parts
        const avatarSkeletons = [];

        // Iterate through all parts to find all skeletons
        // Include both loaded and pending parts to maintain animation during part changes
        const allParts = {
          ...loadedAvatarPartsRef.current,
          ...pendingPartsRef.current
        };
        
        for (const [partType, partMeshes] of Object.entries(allParts)) {
          // Log current avatar part inspection
          const isFromPending = pendingPartsRef.current[partType] !== undefined;
          console.log(`🔍 Checking ${partType} part with ${partMeshes?.length || 0} meshes ${isFromPending ? '(from pending)' : '(from loaded)'}`);
          
          // Check if this part has any meshes
          if (partMeshes && partMeshes.length > 0) {
            // Iterate through each mesh in the avatar part
            for (const mesh of partMeshes) {
              // Log current mesh inspection
              console.log(`🔍 Checking mesh: ${mesh.name} in ${partType}, has skeleton: ${!!mesh.skeleton}`);
              
              // If mesh has a skeleton, add it to avatarSkeletons list
              if (mesh.skeleton) {
                avatarSkeletons.push({
                  skeleton: mesh.skeleton, // Mesh's skeleton
                  partType: partType,      // Part type (body, head, hair, ...)
                  meshName: mesh.name,      // Mesh name
                  mesh: mesh                // Reference to mesh
                });
                console.log(`🦴 Found skeleton from ${partType} part, mesh: ${mesh.name}, bones: ${mesh.skeleton.bones.length}`);
              } else {
                // Log warning if mesh has no skeleton
                console.log(`⚠️ Mesh ${mesh.name} in ${partType} has no skeleton - will not be animated`);
              }
            }
          } else {
            // Log warning if no meshes found for this part
            console.log(`⚠️ No meshes found for ${partType} part`);
          }
        }

        // Log total number of skeletons found
        console.log(`🦴 Total skeletons found: ${avatarSkeletons.length}`);

        // Check if no skeletons found, log error and exit
        if (avatarSkeletons.length === 0) {
          console.error('❌ No skeletons found for animation');
          return;
        }

        // Find main skeleton (typically from body part) to use as reference
        // If body skeleton not found, use first available skeleton
        const mainSkeleton = avatarSkeletons.find(s => s.partType === 'body')?.skeleton || avatarSkeletons[0]?.skeleton;
        if (!mainSkeleton) {
          console.error('❌ No main skeleton found');
          return;
        }

        // Apply main skeleton to all meshes without skeletons
        // and ensure all parts are included in the animation cloning process
        // Include both loaded and pending parts
        for (const [partType, partMeshes] of Object.entries(allParts)) {
          // Check if this part has any meshes
          if (partMeshes && partMeshes.length > 0) {
            // Iterate through each mesh in the avatar part
            for (const mesh of partMeshes) {
              // Apply skeleton to meshes without one
              // Skip geometry check as some clothing parts may need skeleton without geometry
              if (!mesh.skeleton) {
                console.log(`🔧 Applying main skeleton to ${mesh.name} in ${partType}`);
                // Assign main skeleton to mesh without skeleton
                mesh.skeleton = mainSkeleton;
              }

              // Add ALL meshes with skeletons to avatarSkeletons for animation
              // (not just the meshes we just applied skeleton to)
              if (mesh.skeleton) {
                avatarSkeletons.push({
                  skeleton: mesh.skeleton, // Mesh's skeleton
                  partType: partType,      // Part type
                  meshName: mesh.name,      // Mesh name
                  mesh: mesh                // Reference to mesh
                });
                console.log(`🦴 Added ${partType} mesh ${mesh.name} to animation targets`);
              }
            }
          }
        }

        // Log total number of skeletons for animation
        console.log(`🦴 Total skeletons for animation: ${avatarSkeletons.length}`);

        // Group skeletons by part type for better organization
        const skeletonsByPart = avatarSkeletons.reduce((acc, skeletonInfo) => {
          // If no array exists for this part type, create new array
          if (!acc[skeletonInfo.partType]) {
            acc[skeletonInfo.partType] = [];
          }
          // Add skeleton info to corresponding part type array
          acc[skeletonInfo.partType].push(skeletonInfo);
          return acc;
        }, {} as Record<string, typeof avatarSkeletons>);

        // Log information about skeletons grouped by part type
        console.log('🦴 Skeletons grouped by part type:');
        Object.entries(skeletonsByPart).forEach(([partType, skeletons]) => {
          // Log mesh count for each part type
          console.log(`  ${partType}: ${skeletons.length} meshes`);
          // Log details for each skeleton in part type
          skeletons.forEach((skeletonInfo, index) => {
            console.log(`    ${index + 1}. ${skeletonInfo.meshName} (${skeletonInfo.skeleton.bones.length} bones)`);
          });
        });

        // Log start of animation cloning process
        console.log('🎭 Starting animation cloning process for all skeletons...');
        console.log('📊 Original animation name:', targetAnimGroup.name);
        console.log(`📊 Will create ${avatarSkeletons.length} animation clones for all parts`);

        // Verify all loaded parts have skeletons for animation
        const loadedPartTypes = Object.keys(loadedAvatarPartsRef.current); // Loaded part types
        const skeletonPartTypes = [...new Set(avatarSkeletons.map(s => s.partType))]; // Part types with skeletons
        // Find parts missing skeletons
        const missingParts = loadedPartTypes.filter(partType => !skeletonPartTypes.includes(partType));

        // Log warning if any parts are missing skeletons
        if (missingParts.length > 0) {
          console.warn(`⚠️ Some parts don't have skeletons for animation: ${missingParts.join(', ')}`);
        } else {
          // Log success if all parts have skeletons
          console.log(`✅ All loaded parts (${loadedPartTypes.join(', ')}) have skeletons for animation`);
        }

        // Interface defining structure of cloned animation
        interface ClonedAnimation {
          animation: any; // AnimationGroup - Cloned animation group
          skeletonInfo: {
            skeleton: any; // Skeleton - Skeleton that animation is applied to
            partType: string; // Part type (body, head, hair, ...)
            meshName: string; // Mesh name
            mesh: any; // AbstractMesh - Reference to mesh
          };
        }

        // Array to store all cloned animations
        const clonedAnimations: ClonedAnimation[] = [];

        // Iterate through each skeleton to clone animation
        avatarSkeletons.forEach((skeletonInfo, index) => {
          // Log start of animation cloning for current skeleton
          console.log(`🎭 Cloning animation ${index + 1} for ${skeletonInfo.partType} skeleton...`);

          // Clone animation group with new name and target mapping callback
          const clonedAnim = targetAnimGroup.clone(`${targetAnimGroup.name}_${skeletonInfo.partType}_${index}`, (oldTarget) => {
            // This callback is called for each target in original animation
            // console.log(`🎯 [${skeletonInfo.partType}] Processing target:`, oldTarget.name);

            // Check if target has name and skeleton has bones
            if (oldTarget.name && skeletonInfo.skeleton.bones) {
              // console.log(`🔍 [${skeletonInfo.partType}] Searching for mapped bone:`, oldTarget.name);
              // Find corresponding bone in current skeleton
              const mappedBone = findMappedBone(oldTarget.name, skeletonInfo.skeleton);

              // If corresponding bone is found
              if (mappedBone) {
                // console.log(`✨ [${skeletonInfo.partType}] Found mapped bone:`, mappedBone.name);
                // Prioritize using TransformNode if available, otherwise use bone
                const target = mappedBone.getTransformNode() || mappedBone;
                // console.log(`🎯 [${skeletonInfo.partType}] Using target:`, target.name);
                return target;
              } else {
                // Log warning if no corresponding bone is found
                console.log(`⚠️ [${skeletonInfo.partType}] No mapping found for bone:`, oldTarget.name);
              }
            }
            // Log message and return null if no suitable target is found
            console.log(`❌ [${skeletonInfo.partType}] Returning null for target:`, oldTarget.name);
            return null;
          });

          // If animation cloning is successful, add to clonedAnimations list
          if (clonedAnim) {
            clonedAnimations.push({
              animation: clonedAnim,      // Cloned animation
              skeletonInfo: skeletonInfo  // Applied skeleton info
            });
            // Log successful cloning message
            console.log(`✅ [${skeletonInfo.partType}] Animation successfully cloned:`, clonedAnim.name);
            // Log cloned animation details
            console.log(`📝 [${skeletonInfo.partType}] Animation details:`, {
              name: clonedAnim.name,
              targetCount: clonedAnim.targetedAnimations.length // Number of targets in animation
            });
          } else {
            // Log error message if cloning failed
            console.log(`❌ [${skeletonInfo.partType}] Failed to clone animation`);
          }
        });

        // Log total number of cloned animations
        console.log(`🎬 Total animations cloned: ${clonedAnimations.length}`);

        // Process cloned animations
        if (clonedAnimations.length > 0) {
          // Function to cleanup old animations before setting up new ones
          // Specifically cleans up animation synchronization intervals
          const cleanupOldAnimation = (oldAnim: any) => {
            if (oldAnim && oldAnim._cleanup) {
              oldAnim._cleanup(); // Call cleanup function if available
              console.log('🧹 Cleaned up old animation sync intervals');
            }
          };

          // Store all animations in appropriate refs based on animation name
          const allClonedAnims = clonedAnimations.map(ca => ca.animation);
          
          if (animationName.toLowerCase().includes('walk')) {
            // Cleanup old walk animations if exist
            allWalkAnimationsRef.current.forEach(anim => cleanupOldAnimation(anim));
            // Store all new walk animations
            allWalkAnimationsRef.current = allClonedAnims;
            walkAnimRef.current = allClonedAnims[0]; // Keep main reference for compatibility
            console.log(`🚶 Walk animations set: ${allClonedAnims.length} animations for all parts`);
          } else if (animationName.toLowerCase().includes('idle')) {
            // Cleanup old idle animations if exist
            allIdleAnimationsRef.current.forEach(anim => cleanupOldAnimation(anim));
            // Store all new idle animations
            allIdleAnimationsRef.current = allClonedAnims;
            idleAnimRef.current = allClonedAnims[0]; // Keep main reference for compatibility
            console.log(`🧍 Idle animations set: ${allClonedAnims.length} animations for all parts`);
          }

          // Log current animation state
          console.log('🔄 Current animation state:', currentAnimRef.current?.name || 'none');

          // Check if all animations need to be synchronized (default: true)
          const shouldSynchronize = options?.synchronizeAnimations !== false;

          // If synchronization is needed and there are multiple animations
          if (shouldSynchronize && clonedAnimations.length > 1) {
            console.log('🔄 Synchronizing all animations...');
            // Use first animation as main animation
            const mainAnim = clonedAnimations[0].animation;
            // Get all cloned animations
            const allAnimations = clonedAnimations.map(ca => ca.animation);

            // Cleanup existing synchronization intervals
            if (mainAnim._syncIntervals) {
              mainAnim._syncIntervals.forEach((interval: any) => clearInterval(interval));
              mainAnim._syncIntervals = [];
            }

            // Override main animation's play/stop/pause methods
            // to synchronize with all other animations
            const originalPlay = mainAnim.play.bind(mainAnim);
            const originalStop = mainAnim.stop.bind(mainAnim);
            const originalPause = mainAnim.pause.bind(mainAnim);

            // Override main animation's play method
            mainAnim.play = (loop: any) => {
              console.log('🎬 Starting synchronized animation playback...');

              // Function to get current animation list (including newly loaded parts)
              const getCurrentAnimations = () => {
                // Start with list of cloned animations
                const current = [...allAnimations];
                
                // Check current scene
                if (sceneRef.current) {
                  // Iterate through all animation groups in scene
                  sceneRef.current.animationGroups.forEach(animGroup => {
                    // Check if animation group name contains animationName and isn't already in list
                    if (animGroup.name.includes(animationName) && !current.includes(animGroup)) {
                      // Iterate through all loaded avatar parts
                      for (const [partType, partMeshes] of Object.entries(loadedAvatarPartsRef.current)) {
                        if (partMeshes && partMeshes.length > 0) {
                          // Iterate through each mesh in avatar part
                          for (const mesh of partMeshes) {
                            // Check if mesh has skeleton and animation group targets skeleton or its bones
                            if (mesh.skeleton && animGroup.animatables.some(animatable =>
                              animatable.target === mesh.skeleton ||
                              (mesh.skeleton.bones && mesh.skeleton.bones.includes(animatable.target))
                            )) {
                              // Add animation group to current list
                              current.push(animGroup);
                              console.log(`🔄 Added newly loaded ${partType} animation to play sync: ${animGroup.name}`);
                              break;
                            }
                          }
                        }
                      }
                    }
                  });
                }
                return current;
              };

              // Get current animation list
              const currentAnimations = getCurrentAnimations();

              // Reset all animations to frame 0 before playing to ensure perfect synchronization
              currentAnimations.forEach((anim, index) => {
                // Check if animation has animatables and isn't disposed
                if (anim?.animatables && anim.animatables.length > 0 && !anim.isDisposed) {
                  // Iterate through each animatable in animation
                  anim.animatables.forEach((animatable: any) => {
                    // Check if animatable has animations
                    if (animatable?.getAnimations && animatable.getAnimations().length > 0) {
                      // Iterate through each animation in animatable
                      animatable.getAnimations().forEach((animation: any) => {
                        // Check if animation has currentFrame
                        if (animation && typeof animation.currentFrame === 'number') {
                          try {
                            // Try different methods to reset frame to 0
                            if (typeof animation.goToFrame === 'function') {
                              animation.goToFrame(0);
                            } else if (typeof animation.setCurrentFrame === 'function') {
                              animation.setCurrentFrame(0);
                            } else if (animatable.goToFrame) {
                              animatable.goToFrame(0);
                            }
                          } catch (error) {
                            // Log warning if frame reset fails
                            console.warn(`⚠️ Failed to reset animation frame:`, error instanceof Error ? error.message : 'Unknown error');
                          }
                        }
                      });
                    }
                  });
                }
                // Log message that animation has been reset to frame 0
                // console.log(`🔄 Reset animation ${index + 1} to frame 0`);
              });

              // Start main animation first
              const result = originalPlay(loop);

              // Start all other animations with small delay to ensure main animation is ready
              // Use setTimeout to create small delay before starting other animations
              setTimeout(() => {
                // Iterate through all other animations (starting from index 1)
                for (let i = 1; i < currentAnimations.length; i++) {
                  // Check if animation exists, main animation is playing and this animation isn't disposed
                  if (currentAnimations[i] && mainAnim.isPlaying && !currentAnimations[i].isDisposed) {
                    // Play animation
                    currentAnimations[i].play(loop);
                    // console.log(`▶️ Started animation ${i + 1}`);
                  }
                }
                // Log message that all animations have been started in sync
                console.log(`✅ All ${currentAnimations.length} animations started in sync`);
              }, 50); // Small delay to ensure main animation is ready

              return result;
            };

            // Override stop method of main animation
            mainAnim.stop = () => {
              console.log('⏹️ Stopping all synchronized animations...');
              // Stop main animation
              const result = originalStop();

              // Function to get current animation list (including newly loaded parts)
              const getCurrentAnimations = () => {
                // Start with list of cloned animations
                const current = [...allAnimations];
                // Check current scene
                if (sceneRef.current) {
                  // Iterate through all animation groups in scene
                  sceneRef.current.animationGroups.forEach(animGroup => {
                    // Check if animation group name contains animationName and isn't already in list
                    if (animGroup.name.includes(animationName) && !current.includes(animGroup)) {
                      // Iterate through all loaded avatar parts
                      for (const [, partMeshes] of Object.entries(loadedAvatarPartsRef.current)) {
                        if (partMeshes && partMeshes.length > 0) {
                          // Iterate through each mesh in avatar part
                          for (const mesh of partMeshes) {
                            // Check if mesh has skeleton and animation group targets skeleton or its bones
                            if (mesh.skeleton && animGroup.animatables.some(animatable =>
                              animatable.target === mesh.skeleton ||
                              (mesh.skeleton.bones && mesh.skeleton.bones.includes(animatable.target))
                            )) {
                              // Add animation group to current list
                              current.push(animGroup);
                              break;
                            }
                          }
                        }
                      }
                    }
                  });
                }
                return current;
              };

              // Get current animation list
              const currentAnimations = getCurrentAnimations();

              // Stop all other animations and reset to frame 0
              for (let i = 1; i < currentAnimations.length; i++) {
                // Check if animation exists and isn't disposed
                if (currentAnimations[i] && !currentAnimations[i].isDisposed) {
                  // Stop animation
                  currentAnimations[i].stop();

                  // Reset to frame 0 to ensure next playback starts in sync
                  if (currentAnimations[i].animatables && currentAnimations[i].animatables.length > 0) {
                    // Iterate through each animatable in animation
                    currentAnimations[i].animatables.forEach((animatable: any) => {
                      // Check if animatable has animations
                      if (animatable?.getAnimations && animatable.getAnimations().length > 0) {
                        // Iterate through each animation in animatable
                        animatable.getAnimations().forEach((animation: any) => {
                          // Check if animation has currentFrame
                          if (animation && typeof animation.currentFrame === 'number') {
                            try {
                              // Try different methods to reset frame to 0
                              if (typeof animation.goToFrame === 'function') {
                                animation.goToFrame(0);
                              } else if (typeof animation.setCurrentFrame === 'function') {
                                animation.setCurrentFrame(0);
                              } else if (animatable.goToFrame) {
                                animatable.goToFrame(0);
                              }
                            } catch (error) {
                              console.warn(`⚠️ Failed to reset animation frame:`, error instanceof Error ? error.message : 'Unknown error');
                            }
                          }
                        });
                      }
                    });
                  }
                  // console.log(`⏹️ Stopped and reset animation ${i + 1}`);
                }
              }

              // Reset main animation to frame 0 along with other animations
              if (mainAnim.animatables && mainAnim.animatables.length > 0) {
                // Iterate through each animatable in main animation
                mainAnim.animatables.forEach((animatable: any) => {
                  // Check if animatable has animations
                  if (animatable?.getAnimations && animatable.getAnimations().length > 0) {
                    // Iterate through each animation in animatable
                    animatable.getAnimations().forEach((animation: any) => {
                      // Check if animation has currentFrame
                      if (animation && typeof animation.currentFrame === 'number') {
                        try {
                          // Try different methods to reset frame to 0
                          if (typeof animation.goToFrame === 'function') {
                            animation.goToFrame(0);
                          } else if (typeof animation.setCurrentFrame === 'function') {
                            animation.setCurrentFrame(0);
                          } else if (animatable.goToFrame) {
                            animatable.goToFrame(0);
                          }
                        } catch (error) {
                          console.warn(`⚠️ Failed to reset animation frame:`, error instanceof Error ? error.message : 'Unknown error');
                        }
                      }
                    });
                  }
                });
              }

              console.log('✅ All animations stopped and reset to frame 0');
              return result;
            };

            // Override main animation's pause method to synchronize all animations
            mainAnim.pause = () => {
              console.log('⏸️ Pausing all synchronized animations...');
              // Call original pause method of main animation
              const result = originalPause();

              // Get current animation list (including newly loaded parts)
              const getCurrentAnimations = () => {
                // Start with known animation list
                const current = [...allAnimations];
                // Check if scene exists
                if (sceneRef.current) {
                  // Iterate through all animation groups in scene
                  sceneRef.current.animationGroups.forEach(animGroup => {
                    // Check if animation group name contains animationName and isn't in list
                    if (animGroup.name.includes(animationName) && !current.includes(animGroup)) {
                      // Iterate through all loaded avatar parts
                      for (const [, partMeshes] of Object.entries(loadedAvatarPartsRef.current)) {
                        // Check if avatar part has meshes
                        if (partMeshes && partMeshes.length > 0) {
                          // Iterate through each mesh in avatar part
                          for (const mesh of partMeshes) {
                            // Check if mesh has skeleton and animation group targets skeleton or its bones
                            if (mesh.skeleton && animGroup.animatables.some(animatable =>
                              animatable.target === mesh.skeleton ||
                              (mesh.skeleton.bones && mesh.skeleton.bones.includes(animatable.target))
                            )) {
                              // Add animation group to current list
                              current.push(animGroup);
                              break;
                            }
                          }
                        }
                      }
                    }
                  });
                }
                return current;
              };

              // Get current animation list
              const currentAnimations = getCurrentAnimations();

              // Pause all other animations
              for (let i = 1; i < currentAnimations.length; i++) {
                // Check if animation exists and hasn't been disposed
                if (currentAnimations[i] && !currentAnimations[i].isDisposed) {
                  // Pause the animation
                  currentAnimations[i].pause();
                  console.log(`⏸️ Paused animation ${i + 1}`);
                }
              }

              console.log(`✅ All ${currentAnimations.length} animations paused in sync`);
              return result;
            };

            console.log('✅ All animations synchronized with enhanced frame sync');
          }

          // Play animation immediately if requested in options
          const shouldPlayImmediately = options?.playImmediately === true;

          // If immediate playback is needed
          if (shouldPlayImmediately) {
            // Get first animation from cloned animations list
            const animToPlay = clonedAnimations[0].animation;

            // Stop current animation if exists
            if (currentAnimRef.current) {
              console.log('⏹️ Stopping current animation:', currentAnimRef.current.name);
              currentAnimRef.current.stop();
            }

            // Reset all animations to frame 0 before playing to ensure perfect synchronization
            clonedAnimations.forEach(clonedAnim => {
              // Check if animation has animatables
              if (clonedAnim.animation.animatables && clonedAnim.animation.animatables.length > 0) {
                // Iterate through each animatable in animation
                clonedAnim.animation.animatables.forEach((animatable: any) => {
                  // Check if animatable has animations
                  if (animatable.getAnimations && animatable.getAnimations().length > 0) {
                    // Iterate through each animation in animatable
                    animatable.getAnimations().forEach((animation: any) => {
                      try {
                        // Try different methods to reset frame to 0
                        if (typeof animation.goToFrame === 'function') {
                          animation.goToFrame(0);
                        } else if (typeof animation.setCurrentFrame === 'function') {
                          animation.setCurrentFrame(0);
                        } else if (animatable.goToFrame) {
                          animatable.goToFrame(0);
                        }
                      } catch (error) {
                        console.warn(`⚠️ Failed to reset animation frame:`, error instanceof Error ? error.message : 'Unknown error');
                      }
                    });
                  }
                });
              }
            });
            console.log(`🔄 Reset all ${clonedAnimations.length} animations to frame 0 for perfect sync`);

            // Play new animation
            animToPlay.play(true);
            // Update current animation
            currentAnimRef.current = animToPlay;
            console.log(`▶️ Now playing ${animationName} animation:`, animToPlay.name);

            // Animation is ready - show all avatar parts
            setTimeout(() => {
              console.log('✅ Animation ready - enabling all avatar parts');
              // Iterate through all loaded avatar parts
              Object.entries(loadedAvatarPartsRef.current).forEach(([partType, meshes]) => {
                // Iterate through each mesh in avatar part
                meshes.forEach(mesh => {
                  // Check if mesh hasn't been disposed
                  if (!mesh.isDisposed()) {
                    // Enable mesh and set isVisible property to true
                    mesh.setEnabled(true);
                    mesh.isVisible = true;
                    console.log(`👁️ Enabled ${partType} part after animation ready`);
                  }
                });
              });

              // Also enable any pending parts
              Object.entries(pendingPartsRef.current).forEach(([partType, meshes]) => {
                // Iterate through each mesh in pending parts
                meshes.forEach(mesh => {
                  // Check if mesh hasn't been disposed
                  if (!mesh.isDisposed()) {
                    // Enable mesh and set isVisible property to true
                    mesh.setEnabled(true);
                    mesh.isVisible = true;
                    console.log(`👁️ Enabled pending ${partType} part after animation ready`);
                  }
                });
              });
            }, 100); // Small delay to ensure animation has fully started
          }

        } else {
          // No animations were successfully cloned
          console.log('❌ No animations were successfully cloned');
        }

        // Dispose original meshes from animation file (keep only animations)
        result.meshes.forEach(mesh => {
          // Check if mesh hasn't been disposed yet
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });

        // Store cleanup function for later use
        if (clonedAnimations.length > 0) {
          // Get main animation (first animation in the list)
          const mainAnim = clonedAnimations[0].animation;
          // Add _cleanup method to main animation
          mainAnim._cleanup = () => {
            // Check if there are sync intervals
            if (mainAnim._syncIntervals) {
              // Clear all sync intervals
              mainAnim._syncIntervals.forEach((interval: any) => clearInterval(interval));
              // Reset intervals array to empty
              mainAnim._syncIntervals = [];
              console.log('🧹 Cleaned up animation sync intervals');
            }
          };
        }
      } else {
        // No animations found in animation file
        console.log(`⚠️ No animations found in ${animationFileName}`);
      }
    } catch (error) {
      // Handle animation loading error
      console.error(`❌ Error loading ${animationName} animation:`, error);
      // Log detailed error information
      console.error('📋 Error details:', {
        // Error message
        message: error instanceof Error ? error.message : 'Unknown error',
        // Error stack trace
        stack: error instanceof Error ? error.stack : 'No stack trace available',
        // Current state of related components
        currentState: {
          // Check if scene is ready
          sceneReady: !!sceneRef.current,
          // Check if avatar is ready
          avatarReady: !!avatarRef.current,
          // Name of current animation
          currentAnimation: currentAnimRef.current?.name || 'none',
          // Name of walk animation
          walkAnimation: walkAnimRef.current?.name || 'none',
          // Name of idle animation
          idleAnimation: idleAnimRef.current?.name || 'none'
        }
      });
    }
  };


  // Avatar movement boundary constraint (4-unit radius square)
  const AVATAR_BOUNDARY_LIMIT = 2.2;
  
  // Camera target offset to focus on avatar's head instead of feet
  const CAMERA_TARGET_HEAD_OFFSET = 1;
  
  // Setup default camera target - updated to match new initial position
  const DEFAULT_CAMERA_TARGET_POSITION = new Vector3(0, 1, 0);

  // Function to reset camera with smooth animation
  const resetCamera = () => {
    // Check if camera and scene exist
    if (cameraRef.current && sceneRef.current) {
      // Get current camera
      const camera = cameraRef.current;
      const scene = sceneRef.current;

      // Default camera values
      const defaultAlpha = Math.PI / 2;
      const defaultBeta = Math.PI / 3;
      const defaultRadius = 10;
      const defaultTarget = DEFAULT_CAMERA_TARGET_POSITION;

      // Animation duration in frames (60fps)
      const animationDuration = 60; // 1 second

      // Create alpha animation
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

      // Create beta animation
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

      // Create radius animation
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

      // Add easing for smooth animation
      const easingFunction = new CubicEase();
      easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
      
      alphaAnimation.setEasingFunction(easingFunction);
      betaAnimation.setEasingFunction(easingFunction);
      radiusAnimation.setEasingFunction(easingFunction);

      // Reset target immediately (no animation needed for target)
      camera.setTarget(defaultTarget);

      // Start animations
      scene.beginAnimation(camera, 0, animationDuration, false, 1.0);
      camera.animations = [alphaAnimation, betaAnimation, radiusAnimation];
    }
  };

  // Function to reset both camera and avatar to initial positions
  const resetAll = () => {
    // Reset camera
    resetCamera();
    
    // Reset avatar position and rotation if avatar exists
    if (avatarRef.current) {
      avatarRef.current.position = new Vector3(0, 0, 0);
      avatarRef.current.rotation = new Vector3(0, 0, 0);
      
      // Reset avatar movement state
      avatarMovementStateRef.current = {
        isMoving: false,
        targetPosition: null,
        startPosition: null,
        animationProgress: 0,
        movementSpeed: 1.5,
        totalDistance: 0,
        targetRotation: 0,
        startRotation: 0,
        shouldRotate: false
      };
    }
  };

  // Expose reset camera function via ref
  useImperativeHandle(ref, () => ({
    resetCamera
  }), []);

  // Use item manipulator component
  const { selectItem, deselectItem, updateGizmo } = useItemManipulator({
    loadedItemMeshesRef,
    utilityLayerRef,
    gizmoMode,
    selectedItem,
    onSelectItem,
    onItemTransformChange
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
      if (onSceneReady) {
        onSceneReady(scene);
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
      cameraRef.current = camera;

      // Create enhanced lighting with increased brightness
      const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
      light.intensity = 2.2; // Increased from 1.8 for more brightness
      light.diffuse = new Color3(1, 0.98, 0.95); // Slightly warm light
      light.specular = new Color3(1, 1, 1);
      light.groundColor = new Color3(0.25, 0.25, 0.3); // Slightly brighter ground reflection

      // Add directional light for shadows with improved settings
      const directionalLight = new DirectionalLight('directionalLight', new Vector3(-0.5, -1, -0.5), scene);
      directionalLight.intensity = 1.2; // Increased from 0.9 for more brightness
      directionalLight.diffuse = new Color3(1, 0.97, 0.9); // Slightly warm sunlight
      directionalLight.specular = new Color3(1, 1, 1);

      // Add a fill light from opposite direction for better overall illumination
      const fillLight = new HemisphericLight('fillLight', new Vector3(0.5, 0.5, 0.5), scene);
      fillLight.intensity = 0.7;
      fillLight.diffuse = new Color3(0.9, 0.9, 1.0); // Slightly cool fill light
      fillLight.specular = new Color3(0.5, 0.5, 0.5);

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
            console.log('Double click/touch detected - Moving avatar');

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
                console.log('Moving avatar to position:', intersectionPoint);

                // Apply movement constraints: limit avatar to boundary square centered at (0,0,0)
                const constrainedX = Math.max(-AVATAR_BOUNDARY_LIMIT, Math.min(AVATAR_BOUNDARY_LIMIT, intersectionPoint.x));
                const constrainedZ = Math.max(-AVATAR_BOUNDARY_LIMIT, Math.min(AVATAR_BOUNDARY_LIMIT, intersectionPoint.z));
                
                // Start smooth movement animation to new position (can change destination while moving)
                const targetPos = new Vector3(constrainedX, 0, constrainedZ);
                const currentPos = avatarRef.current.position;

                // Calculate rotation angle for avatar to face destination
                const direction = targetPos.subtract(currentPos);
                const targetRotationY = Math.atan2(direction.x, direction.z);

                // Allow changing destination even while moving
                const distance = Vector3.Distance(currentPos, targetPos);

                // Quickly rotate avatar in 0.1s before moving
                const currentRotY = avatarRef.current.rotation.y;
                let rotDiff = targetRotationY - currentRotY;

                // Find shortest rotation path
                if (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
                if (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;

                // Quick rotation in 0.1s
                const rotationDuration = 0.1; // 0.1 seconds



                // Variable to track elapsed time for rotation animation
                let accumulatedRotationTime = 0;

                // Setup quick rotation animation
                scene.registerBeforeRender(function rotateBeforeMove() {
                  const deltaTime = scene.getEngine().getDeltaTime() / 1000;

                  // Update accumulated time
                  accumulatedRotationTime += deltaTime;

                  // Calculate completion ratio based on accumulated time
                  const completionRatio = Math.min(accumulatedRotationTime / rotationDuration, 1.0);

                  // Calculate new rotation angle based on completion ratio
                  const newRotationY = currentRotY + rotDiff * completionRatio;

                  // Update avatar's rotation
                  if (avatarRef.current) {
                    avatarRef.current.rotation.y = newRotationY;
                  }

                  // Check if rotation is complete
                  if (completionRatio >= 1.0 && avatarRef.current) {
                    // Ensure exact rotation angle
                    avatarRef.current.rotation.y = targetRotationY;

                    // Setup movement after rotation is complete
                    avatarMovementStateRef.current.startPosition = avatarRef.current.position.clone();
                    avatarMovementStateRef.current.targetPosition = targetPos;
                    avatarMovementStateRef.current.totalDistance = distance;
                    avatarMovementStateRef.current.startRotation = targetRotationY; // Rotation complete
                    avatarMovementStateRef.current.targetRotation = targetRotationY;
                    avatarMovementStateRef.current.isMoving = true;
                    avatarMovementStateRef.current.shouldRotate = false; // No more rotation needed
                    avatarMovementStateRef.current.animationProgress = 0; // Reset progress



                    // Unregister rotation function
                    scene.unregisterBeforeRender(rotateBeforeMove);
                  }
                });

                // Set shouldFollowAvatar to true when avatar moves
                cameraFollowStateRef.current.shouldFollowAvatar = true;
              }
            }

            return; // Don't handle item selection if it's double click
          }

          // Handle item selection (single click)
          if (pickInfo.hit && pickInfo.pickedMesh) {
            const mesh = pickInfo.pickedMesh;
            console.log('Picked mesh:', mesh.name, mesh);

            // Check if clicked mesh is an item
            const isItem = loadedItemMeshesRef.current.some(itemContainer => {
              // Check if the picked mesh is a child of any item container
              const isDirectChild = mesh.parent === itemContainer;

              // Check if mesh is descendant by walking up parent chain
              let isDescendant = false;
              let currentParent = mesh.parent;
              while (currentParent && !isDescendant) {
                if (currentParent === itemContainer) {
                  isDescendant = true;
                }
                currentParent = currentParent.parent;
              }

              console.log('Checking container:', itemContainer.name, 'Direct child:', isDirectChild, 'Descendant:', isDescendant);
              return isDirectChild || isDescendant;
            });

            console.log('Is item:', isItem);

            if (isItem) {
              console.log('Selecting item');
              selectItem(mesh);
            } else {
              console.log('Deselecting item');
              deselectItem();
            }
          } else {
            console.log('No mesh picked, deselecting');
            deselectItem();
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
    roomPath,
    isSceneReady,
    roomRef
  });

  // Ref to store loaded parts
  const loadedAvatarPartsRef = useRef<Record<string, any[]>>({});
  const pendingPartsRef = useRef<Record<string, any[]>>({});
  const oldPartsToDisposeRef = useRef<Record<string, any[]>>({});
  // Ref to track loading process when changing gender
  const loadingGenderPartsRef = useRef<{ isLoading: boolean, gender: string | null, parts: Record<string, any[]> }>({ isLoading: false, gender: null, parts: {} });

  // Load avatar when config changes
  useEffect(() => {
    console.log('Avatar useEffect triggered:', {
      isSceneReady,
      hasAvatarConfig: !!avatarConfig,
      gender: avatarConfig?.gender,
      bodyPath: avatarConfig?.parts?.body,
      hasScene: !!sceneRef.current,
      hasAvatarRef: !!avatarRef.current
    });
    if (!isSceneReady || !avatarConfig || !sceneRef.current || !avatarRef.current) {
      console.log('Avatar loading skipped - missing dependencies');
      return;
    }

    const loadAvatar = async () => {
      console.log('Starting avatar load process...');
      try {
        const genderData = availablePartsData[avatarConfig.gender];

        // Check if body needs to be reloaded (when gender changes or first load)
        const currentBodyMeshes = loadedAvatarPartsRef.current['body'];
        const isGenderChanged = currentBodyMeshes &&
          Array.isArray(currentBodyMeshes) &&
          currentBodyMeshes.length > 0 &&
          currentBodyMeshes[0].metadata?.gender !== avatarConfig.gender;

        const needReloadBody = !currentBodyMeshes ||
          !Array.isArray(currentBodyMeshes) ||
          currentBodyMeshes.length === 0 ||
          isGenderChanged;

        console.log('Body check:', {
          hasCurrentBodyMeshes: !!currentBodyMeshes,
          isArray: Array.isArray(currentBodyMeshes),
          length: currentBodyMeshes?.length || 0,
          currentGender: currentBodyMeshes?.[0]?.metadata?.gender,
          targetGender: avatarConfig.gender,
          isGenderChanged,
          needReloadBody
        });

        // If gender changes, we'll load all new parts before displaying
        if (isGenderChanged) {
          console.log(`Gender changed from ${currentBodyMeshes[0].metadata?.gender} to ${avatarConfig.gender}. Loading all parts first...`);

          // Store current avatar position to preserve it
          const currentAvatarPosition = avatarRef.current?.position?.clone() || new Vector3(0, 0, 0);
          const currentAvatarRotation = avatarRef.current?.rotation?.clone() || new Vector3(0, 0, 0);
          console.log('Preserving avatar position:', currentAvatarPosition, 'rotation:', currentAvatarRotation);

          // Reset animation ready state during gender change
          setIsAnimationReady(false);
          // console.log('🔄 Reset animation ready state for gender change');

          // Stop and cleanup current animations
          if (currentAnimRef.current) {
            currentAnimRef.current.stop();
            if (currentAnimRef.current._cleanup) {
              currentAnimRef.current._cleanup();
            }
          }
          
          // Clear animation refs
          idleAnimRef.current = null;
          walkAnimRef.current = null;
          currentAnimRef.current = null;
          allIdleAnimationsRef.current = [];
          allWalkAnimationsRef.current = [];
          allCurrentAnimationsRef.current = [];

          // Mark as loading new gender
          loadingGenderPartsRef.current = {
            isLoading: true,
            gender: avatarConfig.gender,
            parts: {}
          };

          // 1. Immediately hide all old parts to prevent double avatar display
          console.log('🙈 Immediately hiding all old avatar parts...');
          Object.entries(loadedAvatarPartsRef.current).forEach(([partType, meshes]) => {
            meshes.forEach(mesh => {
              if (!mesh.isDisposed()) {
                mesh.setEnabled(false);
                mesh.isVisible = false;
              }
            });
          });

          // 2. Load new body (but don't display yet)
          try {
            // Ensure correct path
            const bodyPath = genderData.fixedParts.body;
            console.log(`Attempting to load body from path: ${bodyPath}`);

            // Check if avatarRef exists
            if (!avatarRef.current) {
              console.error('Avatar container is null, creating new one');
              const avatarContainer = new TransformNode('avatarContainer', sceneRef.current!);
              avatarContainer.position = currentAvatarPosition;
              avatarContainer.rotation = currentAvatarRotation;
              avatarRef.current = avatarContainer;
            }

            // Load new body with full URL
            const fullBodyUrl = bodyPath.startsWith('http') ? bodyPath : `${domainConfig.baseDomain}${bodyPath}`;
            const bodyResult = await SceneLoader.ImportMeshAsync(
              '',
              fullBodyUrl,
              '',
              sceneRef.current!
            );

            console.log(`Body loaded successfully with ${bodyResult.meshes.length} meshes`);

            // Setup new body meshes with proper parent and metadata
            bodyResult.meshes.forEach(mesh => {
              if (mesh.parent === null && avatarRef.current) {
                mesh.parent = avatarRef.current;
              }
              // Keep hidden until animation is ready
              mesh.setEnabled(false);
              mesh.isVisible = false;
              // Save gender metadata for identification
              mesh.metadata = { gender: avatarConfig.gender };
            });

            // Save to loadingGenderPartsRef
            loadingGenderPartsRef.current.parts['body'] = bodyResult.meshes;
            console.log(`Body loaded for gender: ${avatarConfig.gender} (hidden)`);
          } catch (error) {
            console.error(`Error loading body for gender ${avatarConfig.gender}:`, error);
          }

          // 3. Load all new selectable parts (but don't display yet)
          const loadPromises = [];

          for (const [partType, partKey] of Object.entries(avatarConfig.parts)) {
            // Skip body as it's already handled above
            if (partType === 'body') {
              continue;
            }

            if (partKey && genderData.selectableParts[partType as keyof typeof genderData.selectableParts]) {
              const partsList = genderData.selectableParts[partType as keyof typeof genderData.selectableParts];
              const partData = partsList?.find(item => item.fileName === partKey);

              if (partData && partData.fileName) {
                console.log(`Loading new ${partType} for gender change: ${partData.fileName}`);

                // Create promise to load part
                const loadPartPromise = (async () => {
                  try {
                    // Load new part with full URL
                    const partFileName = partData.fileName as string;
                    const fullPartUrl = partFileName.startsWith('http') ? partFileName : `${domainConfig.baseDomain}${partFileName}`;
                    const partResult = await SceneLoader.ImportMeshAsync(
                      '',
                      fullPartUrl,
                      '',
                      sceneRef.current!
                    );

                    // Setup new part meshes with proper parent and metadata
                    partResult.meshes.forEach(mesh => {
                      if (mesh.parent === null && avatarRef.current) {
                        mesh.parent = avatarRef.current;
                      }
                      // Keep hidden until animation is ready
                      mesh.setEnabled(false);
                      mesh.isVisible = false;
                      mesh.metadata = { fileName: partData.fileName };
                    });

                    // Save to loadingGenderPartsRef
                    loadingGenderPartsRef.current.parts[partType] = partResult.meshes;
                    console.log(`${partType} loaded for gender change: ${partData.fileName} (hidden)`);
                  } catch (error) {
                    console.error(`Error loading ${partType} for gender change:`, error);
                  }
                })();

                loadPromises.push(loadPartPromise);
              }
            }
          }

          // Wait for all parts to finish loading
          await Promise.all(loadPromises);
          console.log('All parts for gender change loaded (hidden)');

          // 4. Dispose old parts and update references
          console.log('🗑️ Disposing old parts and updating references...');

          // Dispose all old parts
          Object.entries(loadedAvatarPartsRef.current).forEach(([partType, meshes]) => {
            meshes.forEach(mesh => {
              if (!mesh.isDisposed()) {
                mesh.dispose();
              }
            });
          });

          // Clear old references
          loadedAvatarPartsRef.current = {};

          // Update loadedAvatarPartsRef with new parts
          Object.entries(loadingGenderPartsRef.current.parts).forEach(([partType, meshes]) => {
            loadedAvatarPartsRef.current[partType] = meshes;
          });

          // Restore avatar position and rotation
          if (avatarRef.current) {
            avatarRef.current.position = currentAvatarPosition;
            avatarRef.current.rotation = currentAvatarRotation;
            console.log('✅ Restored avatar position and rotation after gender change');
          }

          // Reset loadingGenderPartsRef
          loadingGenderPartsRef.current = { isLoading: false, gender: null, parts: {} };
          console.log('🎭 Gender change completed - new parts loaded but hidden until animation ready');
        }
        // If not changing gender, handle normally
        else {
          // Load body (fixed part) - reload on first load
          if (genderData.fixedParts.body && needReloadBody) {
            console.log(`Loading body for gender: ${avatarConfig.gender}, needReloadBody: ${needReloadBody}`);

            try {
              // Clear existing body if any
              if (currentBodyMeshes) {
                currentBodyMeshes.forEach(mesh => {
                  if (!mesh.isDisposed()) {
                    mesh.dispose();
                  }
                });
              }

              // Ensure correct path
              const bodyPath = genderData.fixedParts.body;
              console.log(`Attempting to load body from path: ${bodyPath}`);

              // Check if avatarRef exists
              if (!avatarRef.current) {
                console.error('Avatar container is null, creating new one');
                const avatarContainer = new TransformNode('avatarContainer', sceneRef.current!);
                avatarRef.current = avatarContainer;
              }

              // Load body with timeout to ensure scene is ready
              const fullBodyUrl = bodyPath.startsWith('http') ? bodyPath : `${domainConfig.baseDomain}${bodyPath}`;
              const bodyResult = await SceneLoader.ImportMeshAsync(
                '',
                fullBodyUrl,
                '',
                sceneRef.current!
              );

              console.log(`Body loaded successfully with ${bodyResult.meshes.length} meshes`);

              // Ensure all meshes are visible
              bodyResult.meshes.forEach(mesh => {
                if (mesh.parent === null && avatarRef.current) {
                  mesh.parent = avatarRef.current;
                }
                // Don't enable immediately - wait for animation to be ready
                mesh.setEnabled(false);
                mesh.isVisible = false;
                console.log(`🔄 Loaded body mesh but keeping disabled until animation ready`);
                // Save gender metadata for identification
                mesh.metadata = { gender: avatarConfig.gender };
              });

              loadedAvatarPartsRef.current['body'] = bodyResult.meshes;
              console.log(`Body loaded for gender: ${avatarConfig.gender}`);
            } catch (error) {
              console.error(`Error loading body for gender ${avatarConfig.gender}:`, error);
            }
          } else {
            console.log(`Skipping body load, needReloadBody: ${needReloadBody}`);
          }

          // Load changeable avatar parts (hair, clothes, ...)
          for (const [partType, partKey] of Object.entries(avatarConfig.parts)) {
            // Skip body part as it's already handled above
            if (partType === 'body') {
              continue;
            }

            console.log(`[AVATAR_PARTS] Processing part ${partType} with key ${partKey}`);

            // Check if this part exists in the list of selectable parts
            if (partKey && genderData.selectableParts[partType as keyof typeof genderData.selectableParts]) {
              const partsList = genderData.selectableParts[partType as keyof typeof genderData.selectableParts];
              const partData = partsList?.find(item => item.fileName === partKey);

              if (partData && partData.fileName) {
                // Check if this part is already loaded
                const currentPart = loadedAvatarPartsRef.current[partType];
                const isCurrentPartSame = currentPart && currentPart.some(mesh =>
                  mesh.metadata?.fileName === partData.fileName
                );

                console.log(`[AVATAR_PARTS] Status of part ${partType}:`, {
                  isLoaded: !!currentPart,
                  isSame: isCurrentPartSame,
                  currentFile: currentPart?.[0]?.metadata?.fileName,
                  newFile: partData.fileName
                });

                if (!isCurrentPartSame) {
                  console.log(`[AVATAR_PARTS] Starting to load new ${partType} part: ${partData.fileName}`);

                  // Step 1: Hide old part immediately but keep reference for smooth transition
                  let oldPartToDispose = null;
                  if (currentPart) {
                    console.log(`[AVATAR_PARTS] Hiding old ${partType} part for transition`);
                    currentPart.forEach(mesh => {
                      if (!mesh.isDisposed()) {
                        mesh.setEnabled(false);
                        mesh.isVisible = false;
                      }
                    });
                    // Store reference to old part for disposal after new part is ready
                     oldPartToDispose = currentPart;
                     oldPartsToDisposeRef.current[partType] = currentPart;
                     delete loadedAvatarPartsRef.current[partType];
                     console.log(`[AVATAR_PARTS] Old ${partType} part hidden, will dispose after new part is ready`);
                  }

                  // Step 2: Load new part and hide it initially
                  const partFileName = partData.fileName as string;
                  const fullPartUrl = partFileName.startsWith('http') ? partFileName : `${domainConfig.baseDomain}${partFileName}`;
                  const partResult = await SceneLoader.ImportMeshAsync(
                    '',
                    fullPartUrl,
                    '',
                    sceneRef.current!
                  );
                  console.log(`[AVATAR_PARTS] Finished loading meshes for ${partType}:`, {
                    meshCount: partResult.meshes.length,
                    meshNames: partResult.meshes.map(m => m.name)
                  });

                  // Assign parent and show part based on animation readiness
                  partResult.meshes.forEach(mesh => {
                    if (mesh.parent === null && avatarRef.current) {
                      mesh.parent = avatarRef.current;
                      console.log(`[AVATAR_PARTS] Assigned parent for mesh ${mesh.name}`);
                    }
                    
                    // If animations are already ready, show the part immediately
                    // Otherwise, keep it hidden until animations are ready
                    if (isAnimationReady && idleAnimRef.current) {
                      mesh.setEnabled(true);
                      mesh.isVisible = true;
                      console.log(`[AVATAR_PARTS] ${partType} part shown immediately - animations already ready`);
                    } else {
                      mesh.setEnabled(false);
                      mesh.isVisible = false;
                      console.log(`[AVATAR_PARTS] ${partType} part loaded but kept hidden until animation ready`);
                    }
                    
                    mesh.metadata = { fileName: partData.fileName };
                  });

                  // Move directly to loaded parts instead of pending
                  loadedAvatarPartsRef.current[partType] = partResult.meshes;
                  console.log(`[AVATAR_PARTS] ${partType} part immediately added to loaded list`);

                  // Handle animation synchronization and part activation
                  const activatePartAfterAnimationSync = async () => {
                    try {
                      console.log(`[AVATAR_PARTS] Starting animation sync for ${partType}`);
                      
                      // Find and apply skeleton to new meshes
                      const foundMeshWithSkeleton = Object.values(loadedAvatarPartsRef.current)
                        .flat()
                        .find(mesh => (mesh as any).skeleton);
                      
                      if (foundMeshWithSkeleton) {
                        // Apply skeleton to new part
                        partResult.meshes.forEach(mesh => {
                          if (!mesh.skeleton) {
                            mesh.skeleton = foundMeshWithSkeleton.skeleton;
                            console.log(`[AVATAR_PARTS] Applied skeleton to mesh ${mesh.name}`);
                          }
                        });
                        
                        console.log(`[AVATAR_PARTS] Found main skeleton:`, {
                          fromAvatar: !!(avatarRef.current as any)?.skeleton,
                          fromOtherMesh: !!foundMeshWithSkeleton
                        });
                        
                        // Step 1: Load and synchronize animations for the new part
                        if (loadAnimationFromGLB) {
                          console.log(`[AVATAR_PARTS] Loading animations for new ${partType} part`);
                          
                          // Load idle animation with synchronization
                          await loadAnimationFromGLB('idle', { 
                            playImmediately: false,
                            synchronizeAnimations: true 
                          });
                          
                          // Load walk animation if it exists
                          if (walkAnimRef.current) {
                            await loadAnimationFromGLB('walk', { 
                              playImmediately: false,
                              synchronizeAnimations: true 
                            });
                          }
                          
                          console.log(`[AVATAR_PARTS] Animations loaded and synchronized for ${partType}`);
                        }
                        
                        // Step 2: Part is already in loaded list and activated immediately
                        console.log(`[AVATAR_PARTS] ${partType} part already activated and in loaded list`);
                        
                        // Step 3: Dispose old part immediately since new part is already active
                        if (oldPartToDispose) {
                          console.log(`[AVATAR_PARTS] Disposing old ${partType} part immediately after new part activation`);
                          oldPartToDispose.forEach(mesh => {
                            if (!mesh.isDisposed()) {
                              mesh.dispose();
                            }
                          });
                          // Remove from disposal tracking since it's disposed now
                          delete oldPartsToDisposeRef.current[partType];
                          console.log(`[AVATAR_PARTS] ✅ Old ${partType} part safely disposed immediately`);
                        }
                        
                        // Step 4: Sync animations in background without affecting visibility
                        if (currentAnimRef.current) {
                          console.log(`[AVATAR_PARTS] Background syncing ${partType} with current animation: ${currentAnimRef.current.name}`);
                          // Animation sync happens in background, part is already visible
                        }
                        
                        console.log(`[AVATAR_PARTS] ✅ ${partType} part successfully activated with immediate transition`);
                      } else {
                        console.warn(`[AVATAR_PARTS] ⚠️ No skeleton found for ${partType}, cannot sync animations`);
                        // Still move to loaded parts but without animation
                        loadedAvatarPartsRef.current[partType] = partResult.meshes;
                        delete pendingPartsRef.current[partType];
                      }
                    } catch (error) {
                      console.error(`[AVATAR_PARTS] ❌ Error during animation sync for ${partType}:`, error);
                      // Fallback: still move to loaded parts
                      loadedAvatarPartsRef.current[partType] = partResult.meshes;
                      delete pendingPartsRef.current[partType];
                    }
                  };
                  
                  // Execute animation sync immediately for seamless transition
                  setTimeout(activatePartAfterAnimationSync, 0);
                }
              }
            } else {
              // If partKey is null or undefined, dispose current part
              const currentPart = loadedAvatarPartsRef.current[partType];
              if (currentPart) {
                currentPart.forEach(mesh => {
                  if (!mesh.isDisposed()) {
                    mesh.dispose();
                  }
                });
                delete loadedAvatarPartsRef.current[partType];
                console.log(`Disposed ${partType}`);
              }
            }
          }
        }

        console.log('Avatar loading process completed with config:', avatarConfig);

        // Wait until all parts are loaded
        const allPartsLoaded = () => {
          const partsStatus = Object.keys(avatarConfig.parts).map(partType => {
            const loadedParts = loadedAvatarPartsRef.current[partType];

            const isLoaded = (avatarConfig.parts[partType] == null) || (loadedParts && loadedParts.length > 0);
            console.log(`Part ${partType} status:`, {
              isLoaded,
              loadedPartsCount: loadedParts?.length || 0,
            });
            return isLoaded;
          });
          const allLoaded = partsStatus.every(status => status);
          console.log('All parts loaded status:', allLoaded);
          return allLoaded;
        };

        console.log('Checking if all parts are loaded...');
        while (!allPartsLoaded()) {
          console.log('Waiting for parts to load...');
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('All avatar parts have been loaded successfully!');

        // Load animations after avatar has finished loading
        if (sceneRef.current) {
          const scene = sceneRef.current;
          if (avatarRef.current) {
            // // Find available animation groups in avatar
            // scene.animationGroups.forEach((animGroup) => {

            //   const animName = animGroup.name.toLowerCase();
            //   // console.log('ANIMATION NAME :', animName);
            //   if (animName === ('breathing_idle')) {
            //     // Prioritize neutral_idle animation
            //     idleAnimRef.current = animGroup;
            //     console.log('✅ Found idle animation:', animGroup.name);
            //   } else if (animName === ('standard_walk')) {
            //     walkAnimRef.current = animGroup;
            //     console.log('✅ Found walk animation:', animGroup.name);
            //   }
            // });

            // Load walk animation from standard_walk.glb if not found in avatar
            if (!walkAnimRef.current) {
              console.log('🎬 No walk animation found in avatar, loading from standard_walk.glb...');
              await loadAnimationFromGLB('standard_walk');
            }

            // Ensure idle animation is applied immediately after avatar is loaded
            if (idleAnimRef.current) {
              idleAnimRef.current.play(true);
              currentAnimRef.current = idleAnimRef.current;
              console.log('🧍 Playing idle animation after avatar loaded:', idleAnimRef.current.name);

              // Animation is now ready - show all avatar parts
              setTimeout(() => {
                setIsAnimationReady(true);
                console.log('✅ Idle animation ready after avatar loaded - setting animation ready state');
              }, 10);
            } else {
              console.log('⚠️ No idle animation found after avatar loaded, loading from all_animation.glb...');

              // Load idle animation from all_animation.glb using new function
              try {
                // Try loading different types of idle animations in priority order
                // Use playImmediately option to play animation right after loading
                await loadAnimationFromGLB('breathing_idle', { playImmediately: true });

                // Apply idle animation if found
                if (idleAnimRef.current) {
                  console.log('🧍 Applying idle animation from all_animation.glb:', idleAnimRef.current.name);
                  console.log('🔄 Previous animation state:', currentAnimRef.current?.name || 'none');

                  // Stop current animation if exists
                  if (currentAnimRef.current) {
                    console.log('⏹️ Stopping current animation:', currentAnimRef.current.name);
                    currentAnimRef.current.stop();
                  }

                  // Play new idle animation
                  idleAnimRef.current.play(true);
                  currentAnimRef.current = idleAnimRef.current;
                  console.log('▶️ Now playing idle animation from all_animation.glb:', idleAnimRef.current.name);

                  // Animation is now ready - show all avatar parts
                  setTimeout(() => {
                    setIsAnimationReady(true);
                    console.log('✅ Idle animation from GLB ready - setting animation ready state');
                  }, 10);
                } else {
                  console.log('❌ No suitable idle animation found in all_animation.glb');
                }
              } catch (error) {
                console.error('❌ Error loading idle animations from all_animation.glb:', error);
                console.error('📋 Error details:', {
                  message: error instanceof Error ? error.message : 'Unknown error',
                  stack: error instanceof Error ? error.stack : 'No stack trace available',
                  currentState: {
                    sceneReady: !!sceneRef.current,
                    avatarReady: !!avatarRef.current,
                    currentAnimation: currentAnimRef.current?.name || 'none',
                    walkAnimation: walkAnimRef.current?.name || 'none',
                    idleAnimation: idleAnimRef.current?.name || 'none'
                  }
                });

                // Try loading with alternative method if possible
                console.log('🔄 Attempting alternative animation loading method...');
                try {
                  // Check if there are any animations in the scene
                  if (sceneRef.current && sceneRef.current.animationGroups && sceneRef.current.animationGroups.length > 0) {
                    console.log(`🔍 Found ${sceneRef.current.animationGroups.length} animations in scene, checking for idle animations...`);

                    // Search for idle animation in scene
                    sceneRef.current.animationGroups.forEach((animGroup, index) => {
                      console.log(`🎬 Scene animation ${index}:`, animGroup.name);

                      const animName = animGroup.name.toLowerCase();
                      if (animName.includes('idle') && !idleAnimRef.current) {
                        idleAnimRef.current = animGroup;
                        console.log('✅ Found idle animation in scene:', animGroup.name);
                      }
                    });

                    // Apply idle animation if found
                    if (idleAnimRef.current) {
                      console.log('🧍 Applying idle animation from scene:', idleAnimRef.current.name);
                      currentAnimRef.current?.stop();
                      idleAnimRef.current.play(true);
                      currentAnimRef.current = idleAnimRef.current;
                    }
                  }
                } catch (fallbackError) {
                  console.error('❌ Fallback animation loading also failed:', fallbackError);
                  console.error('📋 Fallback error details:', {
                    message: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
                    stack: fallbackError instanceof Error ? fallbackError.stack : 'No stack trace available'
                  });
                }
              }
            }

            // Load walk animation from all_animation.glb
            if (!walkAnimRef.current) {
              loadAnimationFromGLB("standard_walk", { synchronizeAnimations: true }).then(() => {
                console.log('🚶 Walk animation loaded from all_animation.glb');
              }).catch(error => {
                console.error('❌ Error loading walk animation:', error);
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    };

    loadAvatar();
  }, [isSceneReady, avatarConfig]);

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      // Clear all loaded avatar parts
      Object.values(loadedAvatarPartsRef.current).forEach(meshes => {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });
      });

      // Clear all pending parts
      Object.values(pendingPartsRef.current).forEach(meshes => {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });
      });

      // Clear all loading gender parts
      Object.values(loadingGenderPartsRef.current.parts).forEach(meshes => {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });
      });

      // Clear all old parts waiting for disposal
      Object.values(oldPartsToDisposeRef.current).forEach(meshes => {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });
      });

      // Cleanup animation sync intervals
      [walkAnimRef.current, idleAnimRef.current, currentAnimRef.current].forEach(anim => {
        if (anim && anim._cleanup) {
          anim._cleanup();
        }
      });

      // Reset refs
      loadedAvatarPartsRef.current = {};
      pendingPartsRef.current = {};
      oldPartsToDisposeRef.current = {};
      loadingGenderPartsRef.current = { isLoading: false, gender: null, parts: {} };
    };
  }, []);

  // Use item loader component
  useItemLoader({
    scene: sceneRef.current,
    loadedItems,
    isSceneReady,
    itemsRef,
    loadedItemMeshesRef
  });

  // Use skybox hook
  useSkybox({
    scene: sceneRef.current,
    isSceneReady: isSceneReady
  });

  // Use post-processing hook
  usePostProcessing({
    scene: sceneRef.current,
    camera: cameraRef.current,
    isSceneReady: isSceneReady,
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

  // Handle avatar movement with touchMovement and animation
  useEffect(() => {
    if (!isSceneReady || !sceneRef.current || !avatarRef.current) return;

    // Remove existing observer if any
    if (avatarMovementObserverRef.current) {
      sceneRef.current.onBeforeRenderObservable.remove(avatarMovementObserverRef.current);
    }

    // Setup avatar movement observer
    avatarMovementObserverRef.current = sceneRef.current!.onBeforeRenderObservable.add(() => {
      if (!avatarRef.current) return;

      // Initialize camera follow target if not set
      if (cameraFollowStateRef.current.currentTarget.equals(Vector3.Zero())) {
        const headPosition = avatarRef.current.position.clone();
        headPosition.y += CAMERA_TARGET_HEAD_OFFSET;
        cameraFollowStateRef.current.currentTarget = headPosition;
      }

      // Variable to track movement state
      let isMoving = false;

      // Handle touchMovement to move avatar smoothly
      if (touchMovement && (Math.abs(touchMovement.x) > 0.001 || Math.abs(touchMovement.y) > 0.001)) {
        isMoving = true;
        const moveSpeed = 1.25; // Reduced by 50% from 2.5
        const deltaTime = sceneRef.current!.getEngine().getDeltaTime() / 1000; // Convert to seconds

        // Calculate movement direction based on touchMovement
        const moveX = touchMovement.x * moveSpeed * deltaTime;
        const moveZ = -touchMovement.y * moveSpeed * deltaTime; // Negative Y means forward

        // Calculate rotation angle based on movement direction with faster speed
        if (Math.abs(moveX) > 0.001 || Math.abs(moveZ) > 0.001) {
          const targetRotationY = Math.atan2(moveX, moveZ);

          // Rotate quickly within 0.1s
          const currentRotY = avatarRef.current.rotation.y;
          let rotDiff = targetRotationY - currentRotY;

          // Find shortest rotation path
          if (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
          if (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;

          // Use fixed time of 0.1s for rotation
          const rotationDuration = 0.1; // 0.1 seconds

          // Calculate completion percentage of rotation based on elapsed time
          const elapsedTime = Math.min(deltaTime, rotationDuration);
          const completionRatio = elapsedTime / rotationDuration;

          // Apply rotation based on completion ratio
          if (completionRatio < 1) {
            avatarRef.current.rotation.y += rotDiff * completionRatio;
          } else {
            avatarRef.current.rotation.y = targetRotationY;
          }
        }

        // Move avatar with boundary constraints
        const newX = avatarRef.current.position.x + moveX;
        const newZ = avatarRef.current.position.z + moveZ;
        
        // Apply constraints: limit to boundary square centered at (0,0,0)
        avatarRef.current.position.x = Math.max(-AVATAR_BOUNDARY_LIMIT, Math.min(AVATAR_BOUNDARY_LIMIT, newX));
        avatarRef.current.position.z = Math.max(-AVATAR_BOUNDARY_LIMIT, Math.min(AVATAR_BOUNDARY_LIMIT, newZ));
      }

      // Handle movement animation to target position (from double-click) with fixed speed
      const movementState = avatarMovementStateRef.current;
      if (movementState.isMoving && movementState.targetPosition && movementState.startPosition) {
        isMoving = true;
        const deltaTime = sceneRef.current!.getEngine().getDeltaTime() / 1000; // Convert to seconds

        if (movementState.totalDistance > 0) {
          // Calculate progress based on fixed speed (units per second)
          const progressIncrement = (movementState.movementSpeed * deltaTime) / movementState.totalDistance;
          movementState.animationProgress += progressIncrement;
        } else {
          // If distance = 0, complete immediately
          movementState.animationProgress = 1.0;
        }

        if (movementState.animationProgress >= 1.0) {
          // Animation completed
          avatarRef.current.position.copyFrom(movementState.targetPosition);
          // No need to rotate anymore as rotation was done before movement
          movementState.isMoving = false;
          movementState.shouldRotate = false;
          movementState.targetPosition = null;
          movementState.startPosition = null;
          movementState.totalDistance = 0;
          movementState.animationProgress = 0;
        } else {
          // Interpolate position
          const currentPos = Vector3.Lerp(
            movementState.startPosition,
            movementState.targetPosition,
            movementState.animationProgress
          );
          avatarRef.current.position.copyFrom(currentPos);

          // No need to rotate during movement as it was done before
          // Only rotate if necessary (for legacy cases not yet updated)
          if (movementState.shouldRotate) {
            // Handle interpolation for rotation angle (need to handle case where angle exceeds 2π)
            let startRot = movementState.startRotation;
            let targetRot = movementState.targetRotation;

            // Find shortest rotation path
            let diff = targetRot - startRot;
            if (diff > Math.PI) {
              startRot += 2 * Math.PI;
            } else if (diff < -Math.PI) {
              targetRot += 2 * Math.PI;
            }

            const currentRotY = startRot + (targetRot - startRot) * movementState.animationProgress;
            avatarRef.current.rotation.y = currentRotY;
          }

          // Update camera target (only when shouldFollowAvatar is true)
        if (cameraRef.current && cameraFollowStateRef.current.shouldFollowAvatar) {
          const headPosition = avatarRef.current.position.clone();
          headPosition.y += CAMERA_TARGET_HEAD_OFFSET;
          cameraRef.current.setTarget(headPosition);
        }
        }
      }

      // Handle animation blending and switching based on movement state
      const blendState = animationBlendingRef.current;
      const currentTime = performance.now() / 1000; // Current time in seconds
      
      // Update blend progress if currently blending
      if (blendState.isBlending) {
        const elapsedTime = currentTime - blendState.startTime;
        blendState.blendProgress = Math.min(elapsedTime / blendState.blendDuration, 1.0);
        
        // Apply blend weights to ALL animations (all parts)
        if (blendState.fromAnimations.length > 0 && blendState.toAnimations.length > 0) {
          const fromWeight = 1.0 - blendState.blendProgress;
          const toWeight = blendState.blendProgress;
          
          // Set animation weights for all FROM animations
          blendState.fromAnimations.forEach((anim, index) => {
            if (anim && !anim.isDisposed) {
              anim.setWeightForAllAnimatables(fromWeight);
            }
          });
          
          // Set animation weights for all TO animations
          blendState.toAnimations.forEach((anim, index) => {
            if (anim && !anim.isDisposed) {
              anim.setWeightForAllAnimatables(toWeight);
            }
          });
        }
        
        // Check if blending is complete
        if (blendState.blendProgress >= 1.0) {
          // Blend complete - stop all old animations and finalize all new ones
          blendState.fromAnimations.forEach(anim => {
            if (anim && !anim.isDisposed) {
              anim.stop();
              anim.setWeightForAllAnimatables(0);
            }
          });
          
          blendState.toAnimations.forEach(anim => {
            if (anim && !anim.isDisposed) {
              anim.setWeightForAllAnimatables(1.0);
            }
          });
          
          // Update current animation references
          allCurrentAnimationsRef.current = [...blendState.toAnimations];
          currentAnimRef.current = blendState.toAnimations[0]; // Keep main reference for compatibility
          
          // Reset blend state
          blendState.isBlending = false;
          blendState.fromAnimations = [];
          blendState.toAnimations = [];
          blendState.blendProgress = 0;
          
          console.log(`✅ Animation blend completed for ${allCurrentAnimationsRef.current.length} parts`);
        }
      }
      
      // Determine target animations based on movement state
      const targetAnimations = isMoving ? allWalkAnimationsRef.current : allIdleAnimationsRef.current;
      const targetMainAnimation = isMoving ? walkAnimRef.current : idleAnimRef.current;
      
      // Start blending if target animation is different from current
      if (targetMainAnimation && targetMainAnimation !== currentAnimRef.current && !blendState.isBlending && targetAnimations.length > 0) {
        const animationType = isMoving ? 'walk' : 'idle';
        console.log(`🎭 Starting blend to ${animationType} animations: ${targetAnimations.length} parts`);
        console.log('🔄 Blending from animations:', allCurrentAnimationsRef.current.length, 'parts');
        
        // Initialize blend state
        blendState.isBlending = true;
        blendState.fromAnimations = [...allCurrentAnimationsRef.current];
        blendState.toAnimations = [...targetAnimations];
        blendState.blendProgress = 0;
        blendState.startTime = currentTime;
        
        // Start all target animations with zero weight
        blendState.toAnimations.forEach(anim => {
          if (anim && !anim.isDisposed) {
            anim.setWeightForAllAnimatables(0);
            anim.play(true);
          }
        });
        
        // Set all current animations weight to 1.0
        blendState.fromAnimations.forEach(anim => {
          if (anim && !anim.isDisposed) {
            anim.setWeightForAllAnimatables(1.0);
          }
        });
        
        console.log(`🎬 Started blending ${blendState.fromAnimations.length} → ${blendState.toAnimations.length} animations`);
      }

      // Camera follow with damping (only when shouldFollowAvatar is true and not using right mouse)
      if (cameraRef.current && avatarRef.current && !isRightMouseDownRef.current && cameraFollowStateRef.current.shouldFollowAvatar) {
        const cameraFollowState = cameraFollowStateRef.current;
        const avatarHeadPosition = avatarRef.current.position.clone();
        avatarHeadPosition.y += CAMERA_TARGET_HEAD_OFFSET;

        // Lerp camera target with damping
        cameraFollowState.currentTarget = Vector3.Lerp(
          cameraFollowState.currentTarget,
          avatarHeadPosition,
          cameraFollowState.dampingFactor
        );

        // Update camera target with damped position
        cameraRef.current.setTarget(cameraFollowState.currentTarget);
      }
    });

    // Cleanup function
    return () => {
      if (avatarMovementObserverRef.current && sceneRef.current) {
        sceneRef.current.onBeforeRenderObservable.remove(avatarMovementObserverRef.current);
        avatarMovementObserverRef.current = null;
      }
    };
  }, [isSceneReady, touchMovement]);

  // Update gizmo when mode changes (handled by ItemManipulator component)
  useEffect(() => {
    if (selectedItemRef.current) {
      updateGizmo(selectedItemRef.current);
    }
  }, [gizmoMode, updateGizmo]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimationReady, setIsAnimationReady] = useState(false);

  // Function to enable all avatar parts when animation is ready
  const enableAvatarPartsWhenAnimationReady = useCallback(() => {
    if (!isAnimationReady || !idleAnimRef.current) {
      console.log('🚫 Animation not ready yet, keeping avatar parts hidden');
      console.log('🔍 Animation state:', {
        isAnimationReady,
        hasIdleAnim: !!idleAnimRef.current,
        isIdlePlaying: idleAnimRef.current?.isPlaying,
        currentAnim: currentAnimRef.current?.name || 'none'
      });
      return;
    }

    console.log('✅ Animation ready - enabling all avatar parts');
    console.log('🔍 Current animation state:', {
      idleAnim: idleAnimRef.current?.name,
      currentAnim: currentAnimRef.current?.name,
      isPlaying: currentAnimRef.current?.isPlaying
    });
    
    // Enable all loaded avatar parts (these have completed animation sync)
    Object.entries(loadedAvatarPartsRef.current).forEach(([partType, meshes]) => {
      meshes.forEach(mesh => {
        if (!mesh.isDisposed()) {
          mesh.setEnabled(true);
          mesh.isVisible = true;
          
          // Ensure proper parent relationship for new parts
          if (mesh.parent === null && avatarRef.current) {
            mesh.parent = avatarRef.current;
            console.log(`🔗 Set parent for ${partType} mesh: ${mesh.name}`);
          }
          
          // For body meshes, ensure they have proper interaction capabilities
          if (partType === 'body') {
            mesh.isPickable = true;
            console.log(`👆 Enabled picking for body mesh: ${mesh.name}`);
          }
          
          console.log(`👁️ ✅ Enabled ${partType} part - animation ready and synced`);
        }
      });
    });

    // For pending parts, only enable if they have completed animation sync
    // (This should be rare as parts should move from pending to loaded after sync)
    Object.entries(pendingPartsRef.current).forEach(([partType, meshes]) => {
      console.log(`⚠️ Found pending ${partType} part during animation ready - this may indicate incomplete sync`);
      
      // Check if this part has a skeleton (indicating it's ready for animation)
      const hasValidSkeleton = meshes.some(mesh => mesh.skeleton);
      
      if (hasValidSkeleton) {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.setEnabled(true);
            mesh.isVisible = true;
            
            // Ensure proper parent relationship for pending parts
            if (mesh.parent === null && avatarRef.current) {
              mesh.parent = avatarRef.current;
              console.log(`🔗 Set parent for pending ${partType} mesh: ${mesh.name}`);
            }
            
            // For body meshes, ensure they have proper interaction capabilities
            if (partType === 'body') {
              mesh.isPickable = true;
              console.log(`👆 Enabled picking for pending body mesh: ${mesh.name}`);
            }
            
            console.log(`👁️ ⚠️ Enabled pending ${partType} part - has skeleton`);
          }
        });
      } else {
        console.log(`🚫 Keeping pending ${partType} part hidden - no skeleton for animation`);
      }
    });
    
    // Dispose of old parts that were waiting for animation ready state
     Object.entries(oldPartsToDisposeRef.current).forEach(([partType, oldMeshes]) => {
       console.log(`[AVATAR_PARTS] Disposing old ${partType} part after animation ready`);
       oldMeshes.forEach(mesh => {
         if (!mesh.isDisposed()) {
           mesh.dispose();
         }
       });
       delete oldPartsToDisposeRef.current[partType];
       console.log(`[AVATAR_PARTS] ✅ Old ${partType} part disposed after animation ready`);
     });
     
     // Final check: ensure avatar container is properly positioned and interactive
     if (avatarRef.current) {
       // Make sure all avatar meshes are pickable for interactions
       avatarRef.current.getChildMeshes().forEach(mesh => {
         if (mesh.name.toLowerCase().includes('body') || mesh.name.toLowerCase().includes('torso')) {
           mesh.isPickable = true;
           console.log(`👆 Ensured picking enabled for avatar mesh: ${mesh.name}`);
         }
       });
       
       console.log(`📍 Final avatar position: ${avatarRef.current.position}`);
       console.log(`🔄 Final avatar rotation: ${avatarRef.current.rotation}`);
     }
     
     console.log('🎭 Avatar parts activation completed - ready for interaction');
   }, [isAnimationReady]);

  // Effect to enable avatar parts when animation becomes ready
  useEffect(() => {
    if (isAnimationReady) {
      enableAvatarPartsWhenAnimationReady();
    }
  }, [isAnimationReady, enableAvatarPartsWhenAnimationReady]);

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

      {/* Control Buttons */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '0',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        gap: '10px'
      }}>
        <button
          onClick={resetAll}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(2px)',
            transition: 'background-color 0.2s ease',
            outline: 'none'
          }}
          title="Reset Camera and Avatar"
        >
          🔄
        </button>
        
        {/* Toggle UI Overlay Button */}
        <button
          onClick={toggleFullscreen}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(2px)',
            transition: 'background-color 0.2s ease',
            outline: 'none'
          }}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? '⤓' : '⤢'}
        </button>
           {/* Fullscreen Toggle Button - Aligned to right */}
           <button
          onClick={onToggleUIOverlay}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(2px)',
            transition: 'background-color 0.2s ease',
            outline: 'none'
          }}
          
          title="Toggle UI Controls"
        >
          ⚙
        </button>
 

     
      </div>

      {/* Item Manipulation Toggle Buttons - Only show when item is selected */}
      {selectedItem && (
        <ItemManipulationControls
          gizmoMode={gizmoMode}
          onGizmoModeChange={onGizmoModeChange}
        />
      )}
    </div>
  );
});

IntegratedBabylonScene.displayName = 'IntegratedBabylonScene';

export { IntegratedBabylonScene };
export default IntegratedBabylonScene;