import { useRef, useState, useCallback, useEffect } from 'react';
import { Scene, TransformNode, SceneLoader, Vector3 } from '@babylonjs/core';
import { availablePartsData, AvatarConfig } from '../../data/avatarPartsData';
import { findMappedBone } from '../../data/skeletonMapping';

/**
 * Custom hook to manage avatar part loading, gender switching, and animation management.
 * @param {object} params
 * @param {React.MutableRefObject<Scene|null>} params.sceneRef - Ref to the Babylon.js scene
 * @param {AvatarConfig} params.avatarConfig - Avatar configuration (gender, parts)
 * @param {object} params.domainConfig - Domain config for asset URLs
 * @param {React.MutableRefObject<any>} params.idleAnimRef - Ref for idle animation
 * @param {React.MutableRefObject<any>} params.walkAnimRef - Ref for walk animation
 * @param {React.MutableRefObject<any>} params.currentAnimRef - Ref for current animation
 * @param {React.MutableRefObject<any[]>} params.allIdleAnimationsRef - Ref for all idle animations
 * @param {React.MutableRefObject<any[]>} params.allWalkAnimationsRef - Ref for all walk animations
 * @param {React.MutableRefObject<any[]>} params.allCurrentAnimationsRef - Ref for all current animations
 * @param {React.MutableRefObject<TransformNode|null>} params.avatarRef - Ref for avatar container node
 * @returns {object} - Avatar part/animation refs, state, and loader functions
 */
export function useAvatarLoader({
  sceneRef,
  avatarConfig,
  domainConfig,
  idleAnimRef,
  walkAnimRef,
  currentAnimRef,
  allIdleAnimationsRef,
  allWalkAnimationsRef,
  allCurrentAnimationsRef,
  avatarRef
}) {
  // Refs for avatar parts
  const loadedAvatarPartsRef = useRef<Record<string, any[]>>({});
  const pendingPartsRef = useRef<Record<string, any[]>>({});
  const oldPartsToDisposeRef = useRef<Record<string, any[]>>({});
  const loadingGenderPartsRef = useRef<{ isLoading: boolean, gender: string | null, parts: Record<string, any[]> }>({ isLoading: false, gender: null, parts: {} });

  // Animation readiness state
  const [isAnimationReady, setIsAnimationReady] = useState(false);

  /**
   * Loads an animation from a GLB file and synchronizes it across all avatar parts.
   */
  const loadAnimationFromGLB = useCallback(async (animationName: string, options?: {
    playImmediately?: boolean;
    synchronizeAnimations?: boolean;
  }) => {
    if (!sceneRef.current || !avatarRef.current) return;
    try {
      const currentGender = avatarConfig.gender;
      const animationFileName = currentGender === 'male' ? 'male_anims.glb' : 'female_anims.glb';
      const animationUrl = `${domainConfig.baseDomain}/animations/${animationFileName}`;
      const result = await SceneLoader.ImportMeshAsync("", animationUrl, "", sceneRef.current);
      if (result.animationGroups && result.animationGroups.length > 0) {
        const targetAnimGroup = result.animationGroups.find(group =>
          group.name.toLowerCase().includes(animationName.toLowerCase()));
        if (!targetAnimGroup) return;
        // Find all skeletons from avatar parts
        const avatarSkeletons = [];
        const allParts = {
          ...loadedAvatarPartsRef.current,
          ...pendingPartsRef.current
        };
        for (const [partType, partMeshes] of Object.entries(allParts)) {
          if (partMeshes && partMeshes.length > 0) {
            for (const mesh of partMeshes) {
              if (mesh.skeleton) {
                avatarSkeletons.push({
                  skeleton: mesh.skeleton,
                  partType,
                  meshName: mesh.name,
                  mesh
                });
              }
            }
          }
        }
        // Apply main skeleton to meshes without skeletons
        const mainSkeleton = avatarSkeletons.find(s => s.partType === 'body')?.skeleton || avatarSkeletons[0]?.skeleton;
        for (const [partType, partMeshes] of Object.entries(allParts)) {
          if (partMeshes && partMeshes.length > 0) {
            for (const mesh of partMeshes) {
              if (!mesh.skeleton) {
                mesh.skeleton = mainSkeleton;
              }
              if (mesh.skeleton) {
                avatarSkeletons.push({
                  skeleton: mesh.skeleton,
                  partType,
                  meshName: mesh.name,
                  mesh
                });
              }
            }
          }
        }
        // Clone animation for each skeleton
        const clonedAnimations = avatarSkeletons.map((skeletonInfo, index) => {
          const clonedAnim = targetAnimGroup.clone(`${targetAnimGroup.name}_${skeletonInfo.partType}_${index}`, (oldTarget) => {
            if (oldTarget.name && skeletonInfo.skeleton.bones) {
              const mappedBone = findMappedBone(oldTarget.name, skeletonInfo.skeleton);
              if (mappedBone) {
                return mappedBone.getTransformNode() || mappedBone;
              }
            }
            return null;
          });
          return clonedAnim ? { animation: clonedAnim, skeletonInfo } : null;
        }).filter(Boolean);
        // Store all animations in appropriate refs
        const allClonedAnims = clonedAnimations.map(ca => ca.animation);
        if (animationName.toLowerCase().includes('walk')) {
          allWalkAnimationsRef.current.forEach(anim => anim._cleanup && anim._cleanup());
          allWalkAnimationsRef.current = allClonedAnims;
          walkAnimRef.current = allClonedAnims[0];
        } else if (animationName.toLowerCase().includes('idle')) {
          allIdleAnimationsRef.current.forEach(anim => anim._cleanup && anim._cleanup());
          allIdleAnimationsRef.current = allClonedAnims;
          idleAnimRef.current = allClonedAnims[0];
        }
        // Synchronize animations if needed
        const shouldSynchronize = options?.synchronizeAnimations !== false;
        if (shouldSynchronize && clonedAnimations.length > 1) {
          const mainAnim = clonedAnimations[0].animation;
          const allAnimations = clonedAnimations.map(ca => ca.animation);
          const originalPlay = mainAnim.play.bind(mainAnim);
          const originalStop = mainAnim.stop.bind(mainAnim);
          const originalPause = mainAnim.pause.bind(mainAnim);
          mainAnim.play = (loop) => {
            const result = originalPlay(loop);
            setTimeout(() => {
              for (let i = 1; i < allAnimations.length; i++) {
                if (allAnimations[i] && mainAnim.isPlaying && !allAnimations[i].isDisposed) {
                  allAnimations[i].play(loop);
                }
              }
            }, 50);
            return result;
          };
          mainAnim.stop = () => {
            const result = originalStop();
            for (let i = 1; i < allAnimations.length; i++) {
              if (allAnimations[i] && !allAnimations[i].isDisposed) {
                allAnimations[i].stop();
              }
            }
            return result;
          };
          mainAnim.pause = () => {
            const result = originalPause();
            for (let i = 1; i < allAnimations.length; i++) {
              if (allAnimations[i] && !allAnimations[i].isDisposed) {
                allAnimations[i].pause();
              }
            }
            return result;
          };
        }
        // Play animation immediately if requested
        if (options?.playImmediately === true) {
          const animToPlay = clonedAnimations[0].animation;
          if (currentAnimRef.current) {
            currentAnimRef.current.stop();
          }
          clonedAnimations.forEach(clonedAnim => {
            if (clonedAnim.animation.animatables && clonedAnim.animation.animatables.length > 0) {
              clonedAnim.animation.animatables.forEach((animatable) => {
                if (animatable.getAnimations && animatable.getAnimations().length > 0) {
                  animatable.getAnimations().forEach((animation) => {
                    if (typeof animation.goToFrame === 'function') {
                      animation.goToFrame(0);
                    }
                  });
                }
              });
            }
          });
          animToPlay.play(true);
          currentAnimRef.current = animToPlay;
        }
        // Dispose original meshes from animation file
        result.meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });
      }
    } catch (error) {
      // Handle error
    }
  }, [sceneRef, avatarConfig, domainConfig, loadedAvatarPartsRef, pendingPartsRef, idleAnimRef, walkAnimRef, currentAnimRef, allIdleAnimationsRef, allWalkAnimationsRef]);

  /**
   * Loads avatar parts and handles gender changes, part switching, and animation setup.
   */
  const loadAvatar = useCallback(async () => {
    if (!sceneRef.current || !avatarConfig || !avatarRef.current) return;
    const genderData = availablePartsData[avatarConfig.gender];
    const currentBodyMeshes = loadedAvatarPartsRef.current['body'];
    const isGenderChanged = currentBodyMeshes &&
      Array.isArray(currentBodyMeshes) &&
      currentBodyMeshes.length > 0 &&
      currentBodyMeshes[0].metadata?.gender !== avatarConfig.gender;
    const needReloadBody = !currentBodyMeshes ||
      !Array.isArray(currentBodyMeshes) ||
      currentBodyMeshes.length === 0 ||
      isGenderChanged;
    if (isGenderChanged) {
      setIsAnimationReady(false);
      if (currentAnimRef.current) {
        currentAnimRef.current.stop();
        if (currentAnimRef.current._cleanup) {
          currentAnimRef.current._cleanup();
        }
      }
      idleAnimRef.current = null;
      walkAnimRef.current = null;
      currentAnimRef.current = null;
      allIdleAnimationsRef.current = [];
      allWalkAnimationsRef.current = [];
      allCurrentAnimationsRef.current = [];
      loadingGenderPartsRef.current = {
        isLoading: true,
        gender: avatarConfig.gender,
        parts: {}
      };
      Object.entries(loadedAvatarPartsRef.current).forEach(([partType, meshes]) => {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.setEnabled(false);
            mesh.isVisible = false;
          }
        });
      });
      try {
        const bodyPath = genderData.fixedParts.body;
        const fullBodyUrl = bodyPath.startsWith('http') ? bodyPath : `${domainConfig.baseDomain}${bodyPath}`;
        const bodyResult = await SceneLoader.ImportMeshAsync(
          '',
          fullBodyUrl,
          '',
          sceneRef.current
        );
        bodyResult.meshes.forEach(mesh => {
          if (mesh.parent === null && avatarRef.current) {
            mesh.parent = avatarRef.current;
          }
          mesh.setEnabled(false);
          mesh.isVisible = false;
          mesh.metadata = { gender: avatarConfig.gender };
        });
        loadingGenderPartsRef.current.parts['body'] = bodyResult.meshes;
      } catch (error) {}
      const loadPromises = [];
      for (const [partType, partKey] of Object.entries(avatarConfig.parts)) {
        if (partType === 'body') continue;
        if (partKey && genderData.selectableParts[partType]) {
          const partsList = genderData.selectableParts[partType];
          const partData = partsList?.find(item => item.fileName === partKey);
          if (partData && partData.fileName) {
            const loadPartPromise = (async () => {
              try {
                const partFileName = partData.fileName as string;
                const fullPartUrl = partFileName.startsWith('http') ? partFileName : `${domainConfig.baseDomain}${partFileName}`;
                const partResult = await SceneLoader.ImportMeshAsync(
                  '',
                  fullPartUrl,
                  '',
                  sceneRef.current
                );
                partResult.meshes.forEach(mesh => {
                  if (mesh.parent === null && avatarRef.current) {
                    mesh.parent = avatarRef.current;
                  }
                  mesh.setEnabled(false);
                  mesh.isVisible = false;
                  mesh.metadata = { fileName: partData.fileName };
                });
                loadingGenderPartsRef.current.parts[partType] = partResult.meshes;
              } catch (error) {}
            })();
            loadPromises.push(loadPartPromise);
          }
        }
      }
      await Promise.all(loadPromises);
      Object.entries(loadedAvatarPartsRef.current).forEach(([partType, meshes]) => {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });
      });
      loadedAvatarPartsRef.current = {};
      Object.entries(loadingGenderPartsRef.current.parts).forEach(([partType, meshes]) => {
        loadedAvatarPartsRef.current[partType] = meshes;
      });
      loadingGenderPartsRef.current = { isLoading: false, gender: null, parts: {} };
    } else {
      if (genderData.fixedParts.body && needReloadBody) {
        try {
          if (currentBodyMeshes) {
            currentBodyMeshes.forEach(mesh => {
              if (!mesh.isDisposed()) {
                mesh.dispose();
              }
            });
          }
          const bodyPath = genderData.fixedParts.body;
          const fullBodyUrl = bodyPath.startsWith('http') ? bodyPath : `${domainConfig.baseDomain}${bodyPath}`;
          const bodyResult = await SceneLoader.ImportMeshAsync(
            '',
            fullBodyUrl,
            '',
            sceneRef.current
          );
          bodyResult.meshes.forEach(mesh => {
            if (mesh.parent === null && avatarRef.current) {
              mesh.parent = avatarRef.current;
            }
            mesh.setEnabled(false);
            mesh.isVisible = false;
            mesh.metadata = { gender: avatarConfig.gender };
          });
          loadedAvatarPartsRef.current['body'] = bodyResult.meshes;
        } catch (error) {}
      }
      for (const [partType, partKey] of Object.entries(avatarConfig.parts)) {
        if (partType === 'body') continue;
        if (partKey && genderData.selectableParts[partType]) {
          const partsList = genderData.selectableParts[partType];
          const partData = partsList?.find(item => item.fileName === partKey);
          if (partData && partData.fileName) {
            const currentPart = loadedAvatarPartsRef.current[partType];
            const isCurrentPartSame = currentPart && currentPart.some(mesh =>
              mesh.metadata?.fileName === partData.fileName
            );
            if (!isCurrentPartSame) {
              let oldPartToDispose = null;
              if (currentPart) {
                currentPart.forEach(mesh => {
                  if (!mesh.isDisposed()) {
                    mesh.setEnabled(false);
                    mesh.isVisible = false;
                  }
                });
                oldPartToDispose = currentPart;
                oldPartsToDisposeRef.current[partType] = currentPart;
                delete loadedAvatarPartsRef.current[partType];
              }
              const partFileName = partData.fileName as string;
              const fullPartUrl = partFileName.startsWith('http') ? partFileName : `${domainConfig.baseDomain}${partFileName}`;
              const partResult = await SceneLoader.ImportMeshAsync(
                '',
                fullPartUrl,
                '',
                sceneRef.current
              );
              partResult.meshes.forEach(mesh => {
                if (mesh.parent === null && avatarRef.current) {
                  mesh.parent = avatarRef.current;
                }
                mesh.setEnabled(false);
                mesh.isVisible = false;
                mesh.metadata = { fileName: partData.fileName };
              });
              loadedAvatarPartsRef.current[partType] = partResult.meshes;
              if (oldPartToDispose) {
                oldPartToDispose.forEach(mesh => {
                  if (!mesh.isDisposed()) {
                    mesh.dispose();
                  }
                });
                delete oldPartsToDisposeRef.current[partType];
              }
            }
          }
        } else {
          const currentPart = loadedAvatarPartsRef.current[partType];
          if (currentPart) {
            currentPart.forEach(mesh => {
              if (!mesh.isDisposed()) {
                mesh.dispose();
              }
            });
            delete loadedAvatarPartsRef.current[partType];
          }
        }
      }
    }
    // Wait until all parts are loaded
    const allPartsLoaded = () => {
      const partsStatus = Object.keys(avatarConfig.parts).map(partType => {
        const loadedParts = loadedAvatarPartsRef.current[partType];
        const isLoaded = (avatarConfig.parts[partType] == null) || (loadedParts && loadedParts.length > 0);
        return isLoaded;
      });
      return partsStatus.every(status => status);
    };
    while (!allPartsLoaded()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Load animations after avatar has finished loading
    if (sceneRef.current && avatarRef.current) {
      if (!walkAnimRef.current) {
        await loadAnimationFromGLB('standard_walk');
      }
      if (idleAnimRef.current) {
        idleAnimRef.current.play(true);
        currentAnimRef.current = idleAnimRef.current;
        setTimeout(() => {
          setIsAnimationReady(true);
          // Bật tất cả mesh avatar khi animation đã sẵn sàng
          Object.entries(loadedAvatarPartsRef.current).forEach(([partType, meshes]) => {
            meshes.forEach(mesh => {
              if (!mesh.isDisposed()) {
                mesh.setEnabled(true);
                mesh.isVisible = true;
              }
            });
          });
        }, 10);
      } else {
        try {
          await loadAnimationFromGLB('breathing_idle', { playImmediately: true });
          if (idleAnimRef.current) {
            if (currentAnimRef.current) {
              currentAnimRef.current.stop();
            }
            idleAnimRef.current.play(true);
            currentAnimRef.current = idleAnimRef.current;
            setTimeout(() => {
              setIsAnimationReady(true);
              // Bật tất cả mesh avatar khi animation đã sẵn sàng
              Object.entries(loadedAvatarPartsRef.current).forEach(([partType, meshes]) => {
                meshes.forEach(mesh => {
                  if (!mesh.isDisposed()) {
                    mesh.setEnabled(true);
                    mesh.isVisible = true;
                  }
                });
              });
            }, 10);
          }
        } catch (error) {}
      }
      if (!walkAnimRef.current) {
        loadAnimationFromGLB("standard_walk", { synchronizeAnimations: true });
      }
    }
  }, [sceneRef, avatarConfig, domainConfig, avatarRef, loadedAvatarPartsRef, oldPartsToDisposeRef, idleAnimRef, walkAnimRef, currentAnimRef, allIdleAnimationsRef, allWalkAnimationsRef, loadAnimationFromGLB]);

  // Effect to load avatar when config changes
  useEffect(() => {
    loadAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneRef.current, avatarConfig]);

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      Object.values(loadedAvatarPartsRef.current).forEach(meshes => {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });
      });
      Object.values(pendingPartsRef.current).forEach(meshes => {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });
      });
      Object.values(loadingGenderPartsRef.current.parts).forEach(meshes => {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });
      });
      Object.values(oldPartsToDisposeRef.current).forEach(meshes => {
        meshes.forEach(mesh => {
          if (!mesh.isDisposed()) {
            mesh.dispose();
          }
        });
      });
      [walkAnimRef.current, idleAnimRef.current, currentAnimRef.current].forEach(anim => {
        if (anim && anim._cleanup) {
          anim._cleanup();
        }
      });
      loadedAvatarPartsRef.current = {};
      pendingPartsRef.current = {};
      oldPartsToDisposeRef.current = {};
      loadingGenderPartsRef.current = { isLoading: false, gender: null, parts: {} };
    };
  }, []);

  return {
    loadedAvatarPartsRef,
    pendingPartsRef,
    oldPartsToDisposeRef,
    loadingGenderPartsRef,
    isAnimationReady,
    setIsAnimationReady,
    loadAvatar,
    loadAnimationFromGLB
  };
} 