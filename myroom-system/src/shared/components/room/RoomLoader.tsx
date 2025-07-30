import React, { useEffect } from 'react';
import { SceneLoader, TransformNode, Scene } from '@babylonjs/core';
import { domainConfig } from '../../config/appConfig';

interface RoomLoaderProps {
  scene: Scene | null;
  roomPath?: string;
  roomResourceId?: string;
  isSceneReady: boolean;
  roomRef: React.MutableRefObject<TransformNode | null>;
}

export const useRoomLoader = ({ scene, roomPath, roomResourceId, isSceneReady, roomRef }: RoomLoaderProps) => {
  // Load room when roomPath or roomResourceId changes
  useEffect(() => {
    console.log('🏠 [RoomLoader] useEffect triggered with:', {
      isSceneReady,
      scene: !!scene,
      roomRef: !!roomRef.current,
      roomResourceId,
      roomPath
    });
    
    if (!isSceneReady || !scene || !roomRef.current) {
      console.log('🏠 [RoomLoader] Early return - missing requirements:', {
        isSceneReady,
        scene: !!scene,
        roomRef: !!roomRef.current
      });
      return;
    }
    
    if (!roomResourceId && !roomPath) {
      console.log('🏠 [RoomLoader] Early return - no roomResourceId or roomPath provided');
      return;
    }

    const loadRoom = async () => {
      console.log('🏠 [RoomLoader] Starting loadRoom function...');
      console.log('🏠 [RoomLoader] Input parameters:', {
        roomResourceId,
        roomPath,
        domainConfig: {
          backendDomain: domainConfig.backendDomain,
          hasApiKey: !!domainConfig.apiKey
        }
      });
      
      try {
        // Clear existing room
        console.log('🏠 [RoomLoader] Clearing existing room meshes...');
        const existingMeshes = roomRef.current!.getChildMeshes();
        console.log('🏠 [RoomLoader] Found', existingMeshes.length, 'existing meshes to dispose');
        existingMeshes.forEach(mesh => mesh.dispose());
        console.log('🏠 [RoomLoader] Existing meshes cleared');

        let fullRoomUrl: string;

        // Prioritize resourceId for backend API loading
        if (roomResourceId) {
          console.log('🏠 [RoomLoader] Using roomResourceId for backend API loading:', roomResourceId);
          
          if (!domainConfig.backendDomain || !domainConfig.apiKey) {
            console.error('🏠 [RoomLoader] Missing backend configuration:', {
              backendDomain: domainConfig.backendDomain,
              hasApiKey: !!domainConfig.apiKey
            });
            throw new Error('Backend domain and API key are required for room loading');
          }

          const apiUrl = `${domainConfig.backendDomain}/api/rooms/resource/${roomResourceId}/presigned-download`;
          console.log('🏠 [RoomLoader] Fetching from backend API:', apiUrl);
          console.log('🏠 [RoomLoader] Request headers:', {
            'x-api-key': domainConfig.apiKey ? 'present' : 'missing'
          });
          
          const response = await fetch(apiUrl, {
            headers: {
              'x-api-key': domainConfig.apiKey
            }
          });
          
          console.log('🏠 [RoomLoader] Backend API response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('🏠 [RoomLoader] Backend response data:', data);
            fullRoomUrl = data.data.downloadUrl;
            console.log('🏠 [RoomLoader] Extracted presigned URL:', fullRoomUrl);
          } else {
            const errorText = await response.text();
            console.error('🏠 [RoomLoader] Backend API error response:', {
              status: response.status,
              statusText: response.statusText,
              errorText
            });
            throw new Error(`Backend fetch failed with status ${response.status}: ${errorText}`);
          }
        } else if (roomPath) {
          console.log('🏠 [RoomLoader] Using direct path loading (fallback):', roomPath);
          console.log('🏠 [RoomLoader] roomPath analysis:', {
            original: roomPath,
            startsWithHttp: roomPath.startsWith('http'),
            length: roomPath.length
          });
          
          // Fallback to direct path loading
          fullRoomUrl = roomPath.startsWith('http') ? roomPath : roomPath;
          console.log('🏠 [RoomLoader] Final direct path URL:', fullRoomUrl);
          console.log('🏠 [RoomLoader] Direct path loading reason: No roomResourceId provided or backend API failed');
        } else {
          console.error('🏠 [RoomLoader] No valid room source provided');
          throw new Error('Either roomResourceId or roomPath is required');
        }

        // Validate that we have a proper URL before proceeding
        console.log('🏠 [RoomLoader] Validating room URL:', fullRoomUrl);
        console.log('🏠 [RoomLoader] URL validation checks:', {
          exists: !!fullRoomUrl,
          startsWithHttp: fullRoomUrl?.startsWith('http'),
          includesDot: fullRoomUrl?.includes('.'),
          length: fullRoomUrl?.length
        });
        
        if (!fullRoomUrl || (!fullRoomUrl.startsWith('http') && !fullRoomUrl.includes('.'))) {
          console.error('🏠 [RoomLoader] Invalid room URL detected:', fullRoomUrl);
          throw new Error(`Invalid room URL: ${fullRoomUrl}. Expected a valid HTTP URL or file path.`);
        }
        console.log('🏠 [RoomLoader] URL validation passed');

        // Load new room
        console.log('🏠 [RoomLoader] Preparing SceneLoader.ImportMeshAsync...');
        const lastSlashIndex = fullRoomUrl.lastIndexOf('/');
        const rootUrl = fullRoomUrl.substring(0, lastSlashIndex + 1);
        const filename = fullRoomUrl.substring(lastSlashIndex + 1);
        
        console.log('🏠 [RoomLoader] SceneLoader parameters:', {
          fullUrl: fullRoomUrl,
          rootUrl,
          filename,
          lastSlashIndex,
          scene: !!scene
        });
        
        console.log('🏠 [RoomLoader] Calling SceneLoader.ImportMeshAsync...');
        const result = await SceneLoader.ImportMeshAsync(
          '',
          rootUrl,
          filename,
          scene
        );
        
        console.log('🏠 [RoomLoader] SceneLoader.ImportMeshAsync completed:', {
          meshesCount: result.meshes.length,
          particleSystemsCount: result.particleSystems.length,
          skeletonsCount: result.skeletons.length,
          animationGroupsCount: result.animationGroups.length
        });
        
        if (result.meshes.length === 0) {
          console.warn('🏠 [RoomLoader] Warning: No meshes loaded from room file');
        }

        // Parent to room container
        console.log('🏠 [RoomLoader] Setting up mesh parenting and properties...');
        result.meshes.forEach((mesh, index) => {
          console.log(`🏠 [RoomLoader] Processing mesh ${index + 1}/${result.meshes.length}:`, {
            name: mesh.name,
            id: mesh.id,
            hasParent: !!mesh.parent,
            parentName: mesh.parent?.name
          });
          
          if (mesh.parent === null) {
            mesh.parent = roomRef.current;
            console.log(`🏠 [RoomLoader] Set parent for mesh: ${mesh.name}`);
          }
          mesh.receiveShadows = true;
        });
        
        console.log('🏠 [RoomLoader] Room loaded successfully!');
        console.log('🏠 [RoomLoader] Final room state:', {
          url: fullRoomUrl,
          meshCount: result.meshes.length,
          roomRefChildren: roomRef.current?.getChildMeshes().length
        });
      } catch (error) {
        console.error('🏠 [RoomLoader] Error loading room - Full details:');
        console.error('🏠 [RoomLoader] Error type:', error.constructor.name);
        console.error('🏠 [RoomLoader] Error message:', error.message);
        console.error('🏠 [RoomLoader] Error stack:', error.stack);
        console.error('🏠 [RoomLoader] Context at error:', {
          roomResourceId,
          roomPath,
          isSceneReady,
          hasScene: !!scene,
          hasRoomRef: !!roomRef.current
        });
      }
    };

    console.log('🏠 [RoomLoader] Calling loadRoom function...');
    loadRoom();
  }, [isSceneReady, roomPath, roomResourceId, scene, roomRef]);
};

export default useRoomLoader;