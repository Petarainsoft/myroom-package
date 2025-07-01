import { useRef, useEffect, useCallback } from 'react';
import { Vector3, Scene, ArcRotateCamera, TransformNode, Matrix, Mesh } from '@babylonjs/core';
import { TouchMovement } from '../../types/AvatarTypes';

interface UseAvatarMovementProps {
  sceneRef: React.MutableRefObject<Scene | null>;
  cameraRef: React.MutableRefObject<ArcRotateCamera | null>;
  avatarRef: React.MutableRefObject<TransformNode | null>;
  touchMovement?: TouchMovement;
  isSceneReady: boolean;
  // Animation refs
  idleAnimRef: React.MutableRefObject<any>;
  walkAnimRef: React.MutableRefObject<any>;
  currentAnimRef: React.MutableRefObject<any>;
  allIdleAnimationsRef: React.MutableRefObject<any[]>;
  allWalkAnimationsRef: React.MutableRefObject<any[]>;
  allCurrentAnimationsRef: React.MutableRefObject<any[]>;
  // Configuration
  AVATAR_BOUNDARY_LIMIT?: number;
  CAMERA_TARGET_HEAD_OFFSET?: number;
}

export function useAvatarMovement({
  sceneRef,
  cameraRef,
  avatarRef,
  touchMovement,
  isSceneReady,
  idleAnimRef,
  walkAnimRef,
  currentAnimRef,
  allIdleAnimationsRef,
  allWalkAnimationsRef,
  allCurrentAnimationsRef,
  AVATAR_BOUNDARY_LIMIT = 2.2,
  CAMERA_TARGET_HEAD_OFFSET = 1
}: UseAvatarMovementProps) {
  // Avatar movement state
  const avatarMovementStateRef = useRef({
    isMoving: false,
    targetPosition: null as Vector3 | null,
    startPosition: null as Vector3 | null,
    animationProgress: 0,
    movementSpeed: 1.5,
    totalDistance: 0,
    targetRotation: 0,
    startRotation: 0,
    shouldRotate: false
  });

  // Camera follow state
  const cameraFollowStateRef = useRef({
    currentTarget: new Vector3(0, 0, 0),
    dampingFactor: 0.1,
    shouldFollowAvatar: false
  });

  // Right mouse button state
  const isRightMouseDownRef = useRef(false);

  // Animation blending state
  const animationBlendingRef = useRef({
    isBlending: false,
    blendDuration: 0.3,
    blendProgress: 0,
    fromAnimations: [] as any[],
    toAnimations: [] as any[],
    startTime: 0
  });

  // Observer for movement
  const avatarMovementObserverRef = useRef<any>(null);

  // Function to move avatar to target position (for double-click movement)
  const moveAvatarToPosition = useCallback((targetPosition: Vector3, targetDisc: Mesh) => {
    if (!avatarRef.current || !sceneRef.current) return;

    console.log('Moving avatar to position:', targetPosition);

    // Apply movement constraints
    const constrainedX = Math.max(-AVATAR_BOUNDARY_LIMIT, Math.min(AVATAR_BOUNDARY_LIMIT, targetPosition.x));
    const constrainedZ = Math.max(-AVATAR_BOUNDARY_LIMIT, Math.min(AVATAR_BOUNDARY_LIMIT, targetPosition.z));
    
    const targetPos = new Vector3(constrainedX, 0, constrainedZ);
    const currentPos = avatarRef.current.position;

    // Show and position the target circle
    if (targetDisc) {
      targetDisc.position = targetPos.clone();
      targetDisc.position.y += 0.02;
      targetDisc.isVisible = true;
    }

    // Calculate rotation angle for avatar to face destination
    const direction = targetPos.subtract(currentPos);
    const targetRotationY = Math.atan2(direction.x, direction.z);

    const distance = Vector3.Distance(currentPos, targetPos);

    // Quickly rotate avatar in 0.1s before moving
    const currentRotY = avatarRef.current.rotation.y;
    let rotDiff = targetRotationY - currentRotY;

    // Find shortest rotation path
    if (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
    if (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;

    const rotationDuration = 0.1;
    let accumulatedRotationTime = 0;

    // Setup quick rotation animation
    sceneRef.current.registerBeforeRender(function rotateBeforeMove() {
      const deltaTime = sceneRef.current!.getEngine().getDeltaTime() / 1000;
      accumulatedRotationTime += deltaTime;
      const completionRatio = Math.min(accumulatedRotationTime / rotationDuration, 1.0);
      const newRotationY = currentRotY + rotDiff * completionRatio;

      if (avatarRef.current) {
        avatarRef.current.rotation.y = newRotationY;
      }

      if (completionRatio >= 1.0 && avatarRef.current) {
        avatarRef.current.rotation.y = targetRotationY;

        // Setup movement after rotation is complete
        avatarMovementStateRef.current.startPosition = avatarRef.current.position.clone();
        avatarMovementStateRef.current.targetPosition = targetPos;
        avatarMovementStateRef.current.totalDistance = distance;
        avatarMovementStateRef.current.startRotation = targetRotationY;
        avatarMovementStateRef.current.targetRotation = targetRotationY;
        avatarMovementStateRef.current.isMoving = true;
        avatarMovementStateRef.current.shouldRotate = false;
        avatarMovementStateRef.current.animationProgress = 0;

        sceneRef.current.unregisterBeforeRender(rotateBeforeMove);
      }
    });

    // Set shouldFollowAvatar to true when avatar moves
    cameraFollowStateRef.current.shouldFollowAvatar = true;

    // Hide the target circle after the avatar reaches the target
    if (targetDisc) {
      const movementObserver = sceneRef.current.onBeforeRenderObservable.add(() => {
        const movementState = avatarMovementStateRef.current;
  
        if (movementState.targetPosition && Vector3.Distance(avatarRef.current!.position, movementState.targetPosition) < 0.1) {
          targetDisc.isVisible = false; // Hide the circle
          sceneRef.current!.onBeforeRenderObservable.remove(movementObserver);
        }
      });
    }
  }, [avatarRef, sceneRef, AVATAR_BOUNDARY_LIMIT]);

  // Function to reset avatar movement state
  const resetAvatarMovement = useCallback(() => {
    if (avatarRef.current) {
      avatarRef.current.position = new Vector3(0, 0, 0);
      avatarRef.current.rotation = new Vector3(0, 0, 0);
      
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
  }, [avatarRef]);

  // Setup avatar movement observer
  useEffect(() => {
    if (!isSceneReady || !sceneRef.current || !avatarRef.current) return;

    // Remove existing observer if any
    if (avatarMovementObserverRef.current) {
      sceneRef.current.onBeforeRenderObservable.remove(avatarMovementObserverRef.current);
    }

    // Setup avatar movement observer
    avatarMovementObserverRef.current = sceneRef.current.onBeforeRenderObservable.add(() => {
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
        const moveSpeed = 1.25;
        const deltaTime = sceneRef.current!.getEngine().getDeltaTime() / 1000;

        // Calculate movement direction based on touchMovement
        const moveX = touchMovement.x * moveSpeed * deltaTime;
        const moveZ = -touchMovement.y * moveSpeed * deltaTime;

        // Calculate rotation angle based on movement direction
        if (Math.abs(moveX) > 0.001 || Math.abs(moveZ) > 0.001) {
          const targetRotationY = Math.atan2(moveX, moveZ);
          const currentRotY = avatarRef.current.rotation.y;
          let rotDiff = targetRotationY - currentRotY;

          // Find shortest rotation path
          if (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
          if (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;

          const rotationDuration = 0.1;
          const elapsedTime = Math.min(deltaTime, rotationDuration);
          const completionRatio = elapsedTime / rotationDuration;

          if (completionRatio < 1) {
            avatarRef.current.rotation.y += rotDiff * completionRatio;
          } else {
            avatarRef.current.rotation.y = targetRotationY;
          }
        }

        // Move avatar with boundary constraints
        const newX = avatarRef.current.position.x + moveX;
        const newZ = avatarRef.current.position.z + moveZ;
        
        avatarRef.current.position.x = Math.max(-AVATAR_BOUNDARY_LIMIT, Math.min(AVATAR_BOUNDARY_LIMIT, newX));
        avatarRef.current.position.z = Math.max(-AVATAR_BOUNDARY_LIMIT, Math.min(AVATAR_BOUNDARY_LIMIT, newZ));
      }

      // Handle movement animation to target position (from double-click)
      const movementState = avatarMovementStateRef.current;
      if (movementState.isMoving && movementState.targetPosition && movementState.startPosition) {
        isMoving = true;
        const deltaTime = sceneRef.current!.getEngine().getDeltaTime() / 1000;

        if (movementState.totalDistance > 0) {
          const progressIncrement = (movementState.movementSpeed * deltaTime) / movementState.totalDistance;
          movementState.animationProgress += progressIncrement;
        } else {
          movementState.animationProgress = 1.0;
        }

        if (movementState.animationProgress >= 1.0) {
          // Animation completed
          avatarRef.current.position.copyFrom(movementState.targetPosition);
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

          // Handle rotation if necessary
          if (movementState.shouldRotate) {
            let startRot = movementState.startRotation;
            let targetRot = movementState.targetRotation;

            let diff = targetRot - startRot;
            if (diff > Math.PI) {
              startRot += 2 * Math.PI;
            } else if (diff < -Math.PI) {
              targetRot += 2 * Math.PI;
            }

            const currentRotY = startRot + (targetRot - startRot) * movementState.animationProgress;
            avatarRef.current.rotation.y = currentRotY;
          }

          // Update camera target
          if (cameraRef.current && cameraFollowStateRef.current.shouldFollowAvatar) {
            const headPosition = avatarRef.current.position.clone();
            headPosition.y += CAMERA_TARGET_HEAD_OFFSET;
            cameraRef.current.setTarget(headPosition);
          }
        }
      }

      // Handle animation blending and switching based on movement state
      const blendState = animationBlendingRef.current;
      const currentTime = performance.now() / 1000;
      
      // Update blend progress if currently blending
      if (blendState.isBlending) {
        const elapsedTime = currentTime - blendState.startTime;
        blendState.blendProgress = Math.min(elapsedTime / blendState.blendDuration, 1.0);
        
        // Apply blend weights to ALL animations
        if (blendState.fromAnimations.length > 0 && blendState.toAnimations.length > 0) {
          const fromWeight = 1.0 - blendState.blendProgress;
          const toWeight = blendState.blendProgress;
          
          blendState.fromAnimations.forEach((anim) => {
            if (anim && !anim.isDisposed) {
              anim.setWeightForAllAnimatables(fromWeight);
            }
          });
          
          blendState.toAnimations.forEach((anim) => {
            if (anim && !anim.isDisposed) {
              anim.setWeightForAllAnimatables(toWeight);
            }
          });
        }
        
        // Check if blending is complete
        if (blendState.blendProgress >= 1.0) {
          // Blend complete
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
          currentAnimRef.current = blendState.toAnimations[0];
          
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

      // Camera follow with damping
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
  }, [isSceneReady, touchMovement, sceneRef, avatarRef, cameraRef, AVATAR_BOUNDARY_LIMIT, CAMERA_TARGET_HEAD_OFFSET, idleAnimRef, walkAnimRef, currentAnimRef, allIdleAnimationsRef, allWalkAnimationsRef, allCurrentAnimationsRef]);

  return {
    // State refs
    avatarMovementStateRef,
    cameraFollowStateRef,
    isRightMouseDownRef,
    animationBlendingRef,
    avatarMovementObserverRef,
    
    // Functions
    moveAvatarToPosition,
    resetAvatarMovement,
    
    // Constants
    AVATAR_BOUNDARY_LIMIT,
    CAMERA_TARGET_HEAD_OFFSET
  };
} 