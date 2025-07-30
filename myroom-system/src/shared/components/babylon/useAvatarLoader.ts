import { useRef, useState, useCallback, useEffect } from 'react';
import { Scene, TransformNode, SceneLoader, Vector3, ShadowGenerator } from '@babylonjs/core';
import { availablePartsData } from '../../data/avatarPartsData';
import { AvatarConfig } from '../../types/AvatarTypes';
import { findMappedBone } from '../../data/skeletonMapping';

interface UseAvatarLoaderParams {
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
  shadowGeneratorRef?: React.MutableRefObject<ShadowGenerator | null>;
}

// Helper function to get avatar part URL - exclusively uses backend API
const getAvatarPartUrl = async (partData: any, domainConfig: any): Promise<string> => {
  console.log('🔍 [getAvatarPartUrl] Loading avatar part via backend API');
  console.log('🔍 [getAvatarPartUrl] partData:', { name: partData.name, resourceId: partData.resourceId });
  
  if (!partData.resourceId) {
    throw new Error(`Avatar part resourceId is required for part: ${partData.name || 'Unknown'}`);
  }
  
  if (!domainConfig.backendDomain || !domainConfig.apiKey) {
    throw new Error('Backend domain and API key are required for avatar loading');
  }
  
  try {
    const apiUrl = `${domainConfig.backendDomain}/api/avatar/resources/${partData.resourceId}/presigned`;
    console.log('🔍 [getAvatarPartUrl] Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': domainConfig.apiKey
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.data && data.data.url) {
        console.log('🔍 [getAvatarPartUrl] ✅ Got presigned URL from backend');
        console.log(`🔗 [Avatar Loader] Loading GLB: ${partData.resourceId} -> ${data.data.url}`);
        return data.data.url;
      } else {
        throw new Error('Backend returned invalid response structure');
      }
    } else {
      const errorText = await response.text();
      throw new Error(`Backend fetch failed with status ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('🔍 [getAvatarPartUrl] Backend fetch error:', error);
    throw error;
  }
};

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
    avatarRef,
    shadowGeneratorRef
  }: UseAvatarLoaderParams) {
    console.log('🚀 [useAvatarLoader] Hook initialized with avatarConfig:', avatarConfig);
    console.log('🚀 [useAvatarLoader] domainConfig:', domainConfig);
    // Refs for avatar parts
    const loadedAvatarPartsRef = useRef<Record<string, any[]>>({});
    const pendingPartsRef = useRef<Record<string, any[]>>({});
    const oldPartsToDisposeRef = useRef<Record<string, any[]>>({});
    const loadingGenderPartsRef = useRef<{ isLoading: boolean, gender: string | null, parts: Record<string, any[]> }>({ isLoading: false, gender: null, parts: {} });
  
    // Animation readiness state
    const [isAnimationReady, setIsAnimationReady] = useState(false);
  
    const addAnimationTargets = useCallback((newMeshes: any[]) => {
      const newSkeletons = newMeshes
        .filter(mesh => mesh && mesh.skeleton)
        .map(mesh => mesh.skeleton);
  
      if (newSkeletons.length === 0) return;
  
      const applyToAnimGroup = (animGroup: any) => {
        if (!animGroup || animGroup.targetedAnimations.length === 0) return;
  
        // For each animation track in the group
        animGroup.targetedAnimations.forEach((sourceTa: any) => {
          const animation = sourceTa.animation;
          const oldTargetName = sourceTa.target.name;
  
          newSkeletons.forEach(newSkeleton => {
            const mappedBone = findMappedBone(oldTargetName, newSkeleton);
            if (mappedBone) {
              const newTargetNode = mappedBone.getTransformNode() || mappedBone;
              const alreadyExists = animGroup.targetedAnimations.some(
                (ta: any) => ta.animation === animation && ta.target === newTargetNode
              );
              if (!alreadyExists) {
                animGroup.addTargetedAnimation(animation, newTargetNode);
              }
            }
          });
        });
      };
  
      applyToAnimGroup(idleAnimRef.current);
      applyToAnimGroup(walkAnimRef.current);
    }, [idleAnimRef, walkAnimRef]);
  
    /**
     * Loads an animation from a GLB file and synchronizes it across all avatar parts.
     */
    const loadAnimationFromGLB = useCallback(async (animationName: string, options?: {
      playImmediately?: boolean;
      synchronizeAnimations?: boolean;
    }) => {
      if (!sceneRef.current || !avatarRef.current) return;
      try {
        // Check if local GLB loading is disabled
        // if (DISABLE_LOCAL_GLB_LOADING) {
        //   console.warn('⚠️ [loadAnimationFromGLB] Local GLB loading is disabled by DISABLE_LOCAL_GLB_LOADING flag');
        //   throw new Error('Local GLB animation loading is temporarily disabled');
        // }
        
        const currentGender = avatarConfig.gender;
        const animationFileName = currentGender === 'male' ? 'male_anims.glb' : 'female_anims.glb';
        const animationUrl = `${domainConfig.baseDomain}/animations/${animationFileName}`;
        console.log('🎬 [loadAnimationFromGLB] Loading animation from:', animationUrl);
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
          const allClonedAnims = clonedAnimations.map(ca => ca?.animation).filter(Boolean);
          if (animationName.toLowerCase().includes('walk')) {
            allWalkAnimationsRef.current.forEach((anim: any) => anim._cleanup && anim._cleanup());
            allWalkAnimationsRef.current = allClonedAnims;
            walkAnimRef.current = allClonedAnims[0];
          } else if (animationName.toLowerCase().includes('idle')) {
            allIdleAnimationsRef.current.forEach((anim: any) => anim._cleanup && anim._cleanup());
            allIdleAnimationsRef.current = allClonedAnims;
            idleAnimRef.current = allClonedAnims[0];
          }
          // Synchronize animations if needed
          const shouldSynchronize = options?.synchronizeAnimations !== false;
          if (shouldSynchronize && clonedAnimations.length > 1) {
            const mainAnim = clonedAnimations[0]?.animation;
            if (!mainAnim) return;
            const allAnimations = clonedAnimations.map(ca => ca?.animation).filter(Boolean);
            const originalPlay = mainAnim.play.bind(mainAnim);
            const originalStop = mainAnim.stop.bind(mainAnim);
            const originalPause = mainAnim.pause.bind(mainAnim);
            mainAnim.play = (loop) => {
              const result = originalPlay(loop);
              window.setTimeout(() => {
                for (let i = 1; i < allAnimations.length; i++) {
                  if (allAnimations[i] && mainAnim.isPlaying && allAnimations[i]) {
                    try {
                      allAnimations[i]?.play(loop);
                    } catch (e) {
                      // Animation might be disposed
                    }
                  }
                }
              }, 50);
              return result;
            };
            mainAnim.stop = () => {
              const result = originalStop();
              for (let i = 1; i < allAnimations.length; i++) {
                if (allAnimations[i]) {
                  try {
                    allAnimations[i]?.stop();
                  } catch (e) {
                    // Animation might be disposed
                  }
                }
              }
              return result;
            };
            mainAnim.pause = () => {
              const result = originalPause();
              for (let i = 1; i < allAnimations.length; i++) {
                if (allAnimations[i]) {
                  try {
                    allAnimations[i]?.pause();
                  } catch (e) {
                    // Animation might be disposed
                  }
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
            clonedAnimations.forEach(clonedAnim => {
              if (clonedAnim && clonedAnim.animation.animatables && clonedAnim.animation.animatables.length > 0) {
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
      if (!sceneRef.current || !avatarConfig || !avatarConfig.parts || !avatarRef.current) return;
      const genderData = (availablePartsData as any)[avatarConfig.gender];
      const currentBodyMeshes = loadedAvatarPartsRef.current['body'];
      const isGenderChanged = currentBodyMeshes &&
        Array.isArray(currentBodyMeshes) &&
        currentBodyMeshes.length > 0 &&
        currentBodyMeshes[0].metadata?.gender !== avatarConfig.gender;
      const needReloadBody = !currentBodyMeshes ||
        !Array.isArray(currentBodyMeshes) ||
        currentBodyMeshes.length === 0 ||
        isGenderChanged;
      let wasPartSwapped = false;
      const wasWalking = walkAnimRef.current && walkAnimRef.current.isPlaying;
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
        Object.entries(loadedAvatarPartsRef.current || {}).forEach(([partType, meshes]) => {
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
        for (const [partType, partKey] of Object.entries(avatarConfig.parts || {})) {
          if (partType === 'body') continue;
          if (partKey && genderData.selectableParts[partType]) {
            const partsList = genderData.selectableParts[partType];
            // Find part by resourceId first, then fallback to fileName
            console.log(`🔍 [useAvatarLoader] Looking for ${partType} with partKey: ${partKey}`);
            console.log(`🔍 [useAvatarLoader] Available parts for ${partType}:`, partsList?.map((p: any) => ({name: p.name, fileName: p.fileName, resourceId: p.resourceId})));
            const partData = partsList?.find((item: any) => item.resourceId === partKey) || partsList?.find((item: any) => item.fileName === partKey);
            console.log(`🔍 [useAvatarLoader] Found partData for ${partType}:`, partData ? {name: partData.name, fileName: partData.fileName, resourceId: partData.resourceId} : 'NOT FOUND');
            if (partData && partData.resourceId) {
              const loadPartPromise = (async () => {
                try {
                  const fullPartUrl = await getAvatarPartUrl(partData, domainConfig);
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
                    mesh.metadata = { resourceId: partData.resourceId };
                  });
                  loadingGenderPartsRef.current.parts[partType] = partResult.meshes;
                } catch (error) {}
              })();
              loadPromises.push(loadPartPromise);
            }
          }
        }
        await Promise.all(loadPromises);
        Object.entries(loadedAvatarPartsRef.current || {}).forEach(([partType, meshes]) => {
          meshes.forEach(mesh => {
            if (!mesh.isDisposed()) {
              mesh.dispose();
            }
          });
        });
        loadedAvatarPartsRef.current = {};
        Object.entries(loadingGenderPartsRef.current.parts || {}).forEach(([partType, meshes]) => {
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
            const bodyData = genderData.fixedParts.body;
            
            // Check if bodyData is null or undefined
            if (!bodyData) {
              console.error('🔍 [useAvatarLoader] bodyData is null or undefined:', genderData.fixedParts);
              throw new Error('Avatar body data is null or undefined');
            }
            
            console.log('🔍 [useAvatarLoader] Loading body with data:', bodyData);
            const fullBodyUrl = await getAvatarPartUrl(bodyData, domainConfig);
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
          } catch (error) {
            console.error('🔍 [useAvatarLoader] Error loading body:', error);
          }
        }
        for (const [partType, partKey] of Object.entries(avatarConfig.parts || {})) {
          if (partType === 'body') continue;
          if (partKey && genderData.selectableParts[partType]) {
            const partsList = genderData.selectableParts[partType];
            // Find part by resourceId first, then fallback to fileName
            console.log(`🔍 [useAvatarLoader] Looking for ${partType} with partKey: ${partKey}`);
            console.log(`🔍 [useAvatarLoader] Available parts for ${partType}:`, partsList?.map((p: any) => ({name: p.name, fileName: p.fileName, resourceId: p.resourceId})));
            const partData = partsList?.find((item: any) => item.resourceId === partKey) || partsList?.find((item: any) => item.fileName === partKey);
            console.log(`🔍 [useAvatarLoader] Found partData for ${partType}:`, partData ? {name: partData.name, fileName: partData.fileName, resourceId: partData.resourceId} : 'NOT FOUND');
            if (partData && partData.resourceId) {
              const currentPart = loadedAvatarPartsRef.current[partType];
              const isCurrentPartSame = currentPart && currentPart.some(mesh =>
                mesh.metadata?.resourceId === partData.resourceId
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
                const fullPartUrl = await getAvatarPartUrl(partData, domainConfig);
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
                  mesh.metadata = { resourceId: partData.resourceId };
                });
                loadedAvatarPartsRef.current[partType] = partResult.meshes;
                wasPartSwapped = true;
  
                if (idleAnimRef.current && walkAnimRef.current) {
                  addAnimationTargets(partResult.meshes);
                  if (currentAnimRef.current) {
                    currentAnimRef.current.stop();
                    currentAnimRef.current.play(true);
                  }
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
        const partsStatus = Object.keys(avatarConfig.parts || {}).map(partType => {
          const loadedParts = loadedAvatarPartsRef.current[partType];
          const isLoaded = (avatarConfig.parts?.[partType] == null) || (loadedParts && loadedParts.length > 0);
          return isLoaded;
        });
        return partsStatus.every(status => status);
      };
      while (!allPartsLoaded()) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // Load animations after avatar has finished loading
      if (sceneRef.current && avatarRef.current) {
        const isInitialLoad = !walkAnimRef.current || !idleAnimRef.current;
        if (isInitialLoad) {
          if (currentAnimRef.current) {
            currentAnimRef.current.stop();
          }
          await loadAnimationFromGLB('standard_walk');
          await loadAnimationFromGLB('breathing_idle', { playImmediately: true });
        }
  
        setIsAnimationReady(true);
        Object.entries(loadedAvatarPartsRef.current || {}).forEach(([partType, meshes]) => {
          meshes.forEach(mesh => {
            if (!mesh.isDisposed()) {
              mesh.setEnabled(true);
              mesh.isVisible = true;
              if (shadowGeneratorRef.current)
                shadowGeneratorRef.current.addShadowCaster(mesh);
            }
          });
        });
        if (idleAnimRef.current && !currentAnimRef.current?.isPlaying) {
          idleAnimRef.current.play(true);
          currentAnimRef.current = idleAnimRef.current;
        }
      }
    }, [sceneRef, avatarConfig, domainConfig, avatarRef, loadedAvatarPartsRef, oldPartsToDisposeRef, idleAnimRef, walkAnimRef, currentAnimRef, allIdleAnimationsRef, allWalkAnimationsRef, loadAnimationFromGLB, addAnimationTargets]);
  
    // Effect to load avatar when config changes
    useEffect(() => {
      loadAvatar();
    }, [sceneRef.current, avatarConfig]);

    // Effect to load avatar parts immediately on component mount
    useEffect(() => {
      if (sceneRef.current && avatarConfig && avatarRef.current) {
        console.log('🔍 [useAvatarLoader] Component mounted, loading avatar parts immediately');
        loadAvatar();
      }
    }, [sceneRef.current, avatarRef.current]); // Only depend on scene and avatar ref being ready
  
    // Cleanup function when component unmounts
    useEffect(() => {
      return () => {
        Object.values(loadedAvatarPartsRef.current || {}).forEach(meshes => {
          meshes.forEach(mesh => {
            if (!mesh.isDisposed()) {
              mesh.dispose();
            }
          });
        });
        Object.values(pendingPartsRef.current || {}).forEach(meshes => {
          meshes.forEach(mesh => {
            if (!mesh.isDisposed()) {
              mesh.dispose();
            }
          });
        });
        Object.values(loadingGenderPartsRef.current.parts || {}).forEach(meshes => {
          meshes.forEach(mesh => {
            if (!mesh.isDisposed()) {
              mesh.dispose();
            }
          });
        });
        Object.values(oldPartsToDisposeRef.current || {}).forEach(meshes => {
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