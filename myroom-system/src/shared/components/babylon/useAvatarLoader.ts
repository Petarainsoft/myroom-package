import { useRef, useState, useCallback, useEffect } from 'react';
import { Scene, TransformNode, SceneLoader, Vector3 } from '@babylonjs/core';
import { availablePartsData } from '../../data/avatarPartsData';
import { findMappedBone } from '../../data/skeletonMapping';
import type { AvatarConfig, AvailableParts, GenderSelectableParts } from '../../types/AvatarTypes';

interface UseAvatarLoaderProps {
  sceneRef: React.MutableRefObject<Scene | null>;
  avatarConfig: AvatarConfig;
  domainConfig: any;
  idleAnimRef: React.MutableRefObject<any>;
  walkAnimRef: React.MutableRefObject<any>;
  currentAnimRef: React.MutableRefObject<any>;
  allIdleAnimationsRef: React.MutableRefObject<any[]>;
  allWalkAnimationsRef: React.MutableRefObject<any[]>;
  allCurrentAnimationsRef: React.MutableRefObject<any[]>;
  avatarRef: React.MutableRefObject<TransformNode | null>;
}

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
}: UseAvatarLoaderProps) {
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
              if (!mesh.skeleton && mainSkeleton) {
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
          const clonedAnim = targetAnimGroup.clone(`${targetAnimGroup.name}_${skeletonInfo.partType}_${index}`, (oldTarget: any) => {
            if (oldTarget.name && skeletonInfo.skeleton && skeletonInfo.skeleton.bones) {
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
        const allClonedAnims = clonedAnimations.map((ca: any) => ca.animation);
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
          const mainAnim = clonedAnimations[0]?.animation;
          const allAnimations = clonedAnimations.map((ca: any) => ca.animation);
          if (!mainAnim) return;
          const originalPlay = mainAnim.play.bind(mainAnim);
          const originalStop = mainAnim.stop.bind(mainAnim);
          const originalPause = mainAnim.pause.bind(mainAnim);
          mainAnim.play = (loop) => {
            const result = originalPlay(loop);
            setTimeout(() => {
              for (let i = 1; i < allAnimations.length; i++) {
                if (allAnimations[i] && mainAnim.isPlaying) {
                  allAnimations[i].play(loop);
                }
              }
            }, 50);
            return result;
          };
          mainAnim.stop = () => {
            const result = originalStop();
            for (let i = 1; i < allAnimations.length; i++) {
              if (allAnimations[i]) {
                allAnimations[i].stop();
              }
            }
            return result;
          };
          mainAnim.pause = () => {
            const result = originalPause();
            for (let i = 1; i < allAnimations.length; i++) {
              if (allAnimations[i]) {
                allAnimations[i].pause();
              }
            }
            return result;
          };
        }
        // Play animation immediately if requested
        if (options?.playImmediately === true) {
          const animToPlay = clonedAnimations[0]?.animation;
          if (currentAnimRef.current) {
            currentAnimRef.current.stop();
          }
          clonedAnimations.forEach((clonedAnim: any) => {
            if (clonedAnim && clonedAnim.animation.animatables && clonedAnim.animation.animatables.length > 0) {
              clonedAnim.animation.animatables.forEach((animatable: any) => {
                if (animatable.getAnimations && animatable.getAnimations().length > 0) {
                  animatable.getAnimations().forEach((animation: any) => {
                    if (typeof animation.goToFrame === 'function') {
                      animation.goToFrame(0);
                    }
                  });
                }
              });
            }
          });
          if (animToPlay) {
            animToPlay.play(true);
            currentAnimRef.current = animToPlay;
          }
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
        if (partKey && (genderData.selectableParts as any)[partType as keyof GenderSelectableParts]) {
          const partsList = (genderData.selectableParts as any)[partType as keyof GenderSelectableParts];
          const partData = partsList?.find((item: any) => item.fileName === partKey);
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
                // --- BẮT ĐẦU: Áp dụng animation hiện tại cho part mới ---
                // 1. Gán skeleton body cho mesh mới nếu chưa có skeleton
                const bodyMeshes = loadedAvatarPartsRef.current['body'];
                let mainSkeleton = null;
                if (bodyMeshes && bodyMeshes.length > 0) {
                  for (const mesh of bodyMeshes) {
                    if (mesh.skeleton) {
                      mainSkeleton = mesh.skeleton;
                      break;
                    }
                  }
                }
                partResult.meshes.forEach(mesh => {
                  if (!mesh.skeleton && mainSkeleton) {
                    mesh.skeleton = mainSkeleton;
                    console.log(`🦴 Assigned skeleton to new ${partType} part: ${mesh.name}`);
                  }
                });
                
                // 2. Clone animation hiện tại cho part mới
                const applyAnimToNewPart = (animGroupRef: React.MutableRefObject<any>, animType: 'idle' | 'walk') => {
                  if (!animGroupRef.current) return;
                  const animGroup = animGroupRef.current;
                  console.log(`🎭 Applying ${animType} animation to new ${partType} part`);
                  // Tìm skeleton của part mới
                  partResult.meshes.forEach((mesh: any, meshIdx: number) => {
                    if (!mesh.skeleton) return;
                    // Clone animation group cho skeleton mới
                    const clonedAnim = animGroup.clone(`${animGroup.name}_${partType}_new_${meshIdx}`, (oldTarget: any) => {
                      if (oldTarget.name && mesh.skeleton && mesh.skeleton.bones) {
                        const mappedBone = findMappedBone(oldTarget.name, mesh.skeleton);
                        if (mappedBone) {
                          return mappedBone.getTransformNode() || mappedBone;
                        }
                      }
                      return null;
                    });
                    if (clonedAnim) {
                      console.log(`✅ Cloned ${animType} animation for ${partType} part ${meshIdx}: ${clonedAnim.name}`);
                      // Play nếu animation hiện tại đang play
                      if (typeof animGroup.isPlaying === 'boolean' && animGroup.isPlaying) {
                        clonedAnim.play(true);
                        // --- Đồng bộ frame/time với animation chính ---
                        // Lấy frame hiện tại của animGroup
                        let currentFrame = 0;
                        if (animGroup.animatables && animGroup.animatables.length > 0) {
                          // Lấy frame lớn nhất trong các animatables (phòng trường hợp nhiều animatable)
                          currentFrame = Math.max(...animGroup.animatables.map((a: any) => a.masterFrame || 0));
                        }
                        if (clonedAnim.animatables && clonedAnim.animatables.length > 0) {
                          clonedAnim.animatables.forEach((animatable: any) => {
                            if (typeof animatable.goToFrame === 'function') {
                              animatable.goToFrame(currentFrame);
                            }
                          });
                        }
                        console.log(`🔄 Synced ${animType} animation frame ${currentFrame} for ${partType} part`);
                        // --- END sync frame ---
                      }
                      // Thêm vào mảng allIdleAnimationsRef/allWalkAnimationsRef nếu cần
                      if (animType === 'idle') {
                        allIdleAnimationsRef.current.push(clonedAnim);
                      } else if (animType === 'walk') {
                        allWalkAnimationsRef.current.push(clonedAnim);
                      }
                    } else {
                      console.warn(`⚠️ Failed to clone ${animType} animation for ${partType} part ${meshIdx}`);
                    }
                  });
                };
                
                // Áp dụng cho idle và walk nếu đang có
                if (idleAnimRef.current) applyAnimToNewPart(idleAnimRef, 'idle');
                if (walkAnimRef.current) applyAnimToNewPart(walkAnimRef, 'walk');
                console.log(`🎯 Animation synchronization completed for new ${partType} part`);
                // --- KẾT THÚC: Áp dụng animation hiện tại cho part mới ---
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
        if (partKey && (genderData.selectableParts as any)[partType as keyof GenderSelectableParts]) {
          const partsList = (genderData.selectableParts as any)[partType as keyof GenderSelectableParts];
          const partData = partsList?.find((item: any) => item.fileName === partKey);
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
              
              // --- BẮT ĐẦU: Áp dụng animation hiện tại cho part mới ---
              // 1. Gán skeleton body cho mesh mới nếu chưa có skeleton
              const bodyMeshes = loadedAvatarPartsRef.current['body'];
              let mainSkeleton = null;
              if (bodyMeshes && bodyMeshes.length > 0) {
                for (const mesh of bodyMeshes) {
                  if (mesh.skeleton) {
                    mainSkeleton = mesh.skeleton;
                    break;
                  }
                }
              }
              partResult.meshes.forEach(mesh => {
                if (!mesh.skeleton && mainSkeleton) {
                  mesh.skeleton = mainSkeleton;
                  console.log(`🦴 Assigned skeleton to new ${partType} part: ${mesh.name}`);
                }
              });
              
              // 2. Clone animation hiện tại cho part mới
              const applyAnimToNewPart = (animGroupRef: React.MutableRefObject<any>, animType: 'idle' | 'walk') => {
                if (!animGroupRef.current) return;
                const animGroup = animGroupRef.current;
                console.log(`🎭 Applying ${animType} animation to new ${partType} part`);
                // Tìm skeleton của part mới
                partResult.meshes.forEach((mesh: any, meshIdx: number) => {
                  if (!mesh.skeleton) return;
                  // Clone animation group cho skeleton mới
                  const clonedAnim = animGroup.clone(`${animGroup.name}_${partType}_new_${meshIdx}`, (oldTarget: any) => {
                    if (oldTarget.name && mesh.skeleton && mesh.skeleton.bones) {
                      const mappedBone = findMappedBone(oldTarget.name, mesh.skeleton);
                      if (mappedBone) {
                        return mappedBone.getTransformNode() || mappedBone;
                      }
                    }
                    return null;
                  });
                  if (clonedAnim) {
                    console.log(`✅ Cloned ${animType} animation for ${partType} part ${meshIdx}: ${clonedAnim.name}`);
                    // Play nếu animation hiện tại đang play
                    if (typeof animGroup.isPlaying === 'boolean' && animGroup.isPlaying) {
                      clonedAnim.play(true);
                      // --- Đồng bộ frame/time với animation chính ---
                      // Lấy frame hiện tại của animGroup
                      let currentFrame = 0;
                      if (animGroup.animatables && animGroup.animatables.length > 0) {
                        // Lấy frame lớn nhất trong các animatables (phòng trường hợp nhiều animatable)
                        currentFrame = Math.max(...animGroup.animatables.map((a: any) => a.masterFrame || 0));
                      }
                      if (clonedAnim.animatables && clonedAnim.animatables.length > 0) {
                        clonedAnim.animatables.forEach((animatable: any) => {
                          if (typeof animatable.goToFrame === 'function') {
                            animatable.goToFrame(currentFrame);
                          }
                        });
                      }
                      console.log(`🔄 Synced ${animType} animation frame ${currentFrame} for ${partType} part`);
                      // --- END sync frame ---
                    }
                    // Thêm vào mảng allIdleAnimationsRef/allWalkAnimationsRef nếu cần
                    if (animType === 'idle') {
                      allIdleAnimationsRef.current.push(clonedAnim);
                    } else if (animType === 'walk') {
                      allWalkAnimationsRef.current.push(clonedAnim);
                    }
                  } else {
                    console.warn(`⚠️ Failed to clone ${animType} animation for ${partType} part ${meshIdx}`);
                  }
                });
              };
              
              // Áp dụng cho idle và walk nếu đang có
              if (idleAnimRef.current) applyAnimToNewPart(idleAnimRef, 'idle');
              if (walkAnimRef.current) applyAnimToNewPart(walkAnimRef, 'walk');
              console.log(`🎯 Animation synchronization completed for new ${partType} part`);
              // --- KẾT THÚC: Áp dụng animation hiện tại cho part mới ---
              
              if (oldPartToDispose) {
                oldPartToDispose.forEach(mesh => {
                  if (!mesh.isDisposed()) {
                    mesh.dispose();
                  }
                });
                delete oldPartsToDisposeRef.current[partType];
              }
              
              // --- BẮT ĐẦU: Cleanup animations cho part cũ ---
              // Remove animations that were specific to the old part
              const cleanupAnimationsForPart = (animArrayRef: React.MutableRefObject<any[]>, partType: string) => {
                const animationsToRemove = animArrayRef.current.filter(anim => 
                  anim && anim.name && anim.name.includes(`${partType}_`)
                );
                if (animationsToRemove.length > 0) {
                  console.log(`🧹 Cleaning up ${animationsToRemove.length} animations for old ${partType} part`);
                  animationsToRemove.forEach(anim => {
                    if (anim && !anim.isDisposed) {
                      anim.stop();
                      if (anim._cleanup) {
                        anim._cleanup();
                      }
                      console.log(`🗑️ Cleaned up animation: ${anim.name}`);
                    }
                  });
                  animArrayRef.current = animArrayRef.current.filter(anim => 
                    !anim || !anim.name || !anim.name.includes(`${partType}_`)
                  );
                }
              };
              
              // Cleanup idle and walk animations for the old part
              cleanupAnimationsForPart(allIdleAnimationsRef, partType);
              cleanupAnimationsForPart(allWalkAnimationsRef, partType);
              // --- KẾT THÚC: Cleanup animations cho part cũ ---
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
              
              // --- BẮT ĐẦU: Cleanup animations cho part bị xóa hoàn toàn ---
              // Remove all animations that were specific to this part type
              const cleanupAllAnimationsForPart = (animArrayRef: React.MutableRefObject<any[]>, partType: string) => {
                const animationsToRemove = animArrayRef.current.filter(anim => 
                  anim && anim.name && anim.name.includes(`${partType}_`)
                );
                if (animationsToRemove.length > 0) {
                  console.log(`🧹 Cleaning up ${animationsToRemove.length} animations for removed ${partType} part`);
                  animationsToRemove.forEach(anim => {
                    if (anim && !anim.isDisposed) {
                      anim.stop();
                      if (anim._cleanup) {
                        anim._cleanup();
                      }
                      console.log(`🗑️ Cleaned up animation: ${anim.name}`);
                    }
                  });
                  animArrayRef.current = animArrayRef.current.filter(anim => 
                    !anim || !anim.name || !anim.name.includes(`${partType}_`)
                  );
                }
              };
              
              // Cleanup all idle and walk animations for the removed part
              cleanupAllAnimationsForPart(allIdleAnimationsRef, partType);
              cleanupAllAnimationsForPart(allWalkAnimationsRef, partType);
              // --- KẾT THÚC: Cleanup animations cho part bị xóa hoàn toàn ---
            }
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