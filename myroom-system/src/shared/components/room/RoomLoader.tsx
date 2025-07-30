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
    if (!isSceneReady || !scene || !roomRef.current) return;
    if (!roomResourceId && !roomPath) return;

    const loadRoom = async () => {
      try {
        // Clear existing room
        roomRef.current!.getChildMeshes().forEach(mesh => mesh.dispose());

        let fullRoomUrl: string;

        // Prioritize resourceId for backend API loading
        if (roomResourceId) {
          if (!domainConfig.backendDomain || !domainConfig.apiKey) {
            throw new Error('Backend domain and API key are required for room loading');
          }

          const apiUrl = `${domainConfig.backendDomain}/api/rooms/resource/${roomResourceId}/presigned-download`;
          console.log('🏠 Loading room from backend:', { resourceId: roomResourceId, apiUrl });
          
          const response = await fetch(apiUrl, {
            headers: {
              'x-api-key': domainConfig.apiKey
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            fullRoomUrl = data.data.downloadUrl;
            console.log('🏠 Backend room URL obtained:', fullRoomUrl);
          } else {
            const errorText = await response.text();
            throw new Error(`Backend fetch failed with status ${response.status}: ${errorText}`);
          }
        } else if (roomPath) {
          // Fallback to direct path loading
          fullRoomUrl = roomPath.startsWith('http') ? roomPath : roomPath;
          console.log('🏠 Loading room from direct path:', fullRoomUrl);
        } else {
          throw new Error('Either roomResourceId or roomPath is required');
        }

        // Load new room
        const lastSlashIndex = fullRoomUrl.lastIndexOf('/');
        const rootUrl = fullRoomUrl.substring(0, lastSlashIndex + 1);
        const filename = fullRoomUrl.substring(lastSlashIndex + 1);
        
        const result = await SceneLoader.ImportMeshAsync(
          '',
          rootUrl,
          filename,
          scene
        );

        // Parent to room container
        result.meshes.forEach(mesh => {
          if (mesh.parent === null) {
            mesh.parent = roomRef.current;
          }
          mesh.receiveShadows = true;
        });

        console.log('Room loaded successfully:', fullRoomUrl);
      } catch (error) {
        console.error('Error loading room:', error);
      }
    };

    loadRoom();
  }, [isSceneReady, roomPath, roomResourceId, scene, roomRef]);
};

export default useRoomLoader;