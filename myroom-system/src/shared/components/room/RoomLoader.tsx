// import { useEffect, useRef } from 'react';
import React, { useEffect } from 'react';
import { SceneLoader, TransformNode, Scene } from '@babylonjs/core';
import { domainConfig, DISABLE_LOCAL_GLB_LOADING } from '../../config/appConfig';

interface RoomLoaderProps {
  scene: Scene | null;
  roomPath?: string;
  roomResourceId?: string;
  isSceneReady: boolean;
  roomRef: React.MutableRefObject<TransformNode | null>;
}

export const useRoomLoader = ({ scene, roomPath, roomResourceId, isSceneReady, roomRef }: RoomLoaderProps) => {
  // Load room when roomPath changes
  useEffect(() => {
    if (!isSceneReady || !scene || !roomPath || !roomRef.current) return;

    const loadRoom = async () => {
      try {
        // Check if local GLB loading is disabled
        if (DISABLE_LOCAL_GLB_LOADING) {
          console.warn('⚠️ [RoomLoader] Local GLB loading is disabled by DISABLE_LOCAL_GLB_LOADING flag');
          // throw new Error('Local GLB resource loading is temporarily disabled');
        }
        
        // Clear existing room
        roomRef.current!.getChildMeshes().forEach(mesh => mesh.dispose());

        let fullRoomUrl: string;
        if (domainConfig.useResourceId && roomResourceId && domainConfig.backendDomain && domainConfig.apiKey) {
          try {
            // Call API to get S3 presigned download URL using resourceId
            const apiUrl = `${domainConfig.backendDomain}/api/rooms/resource/${roomResourceId}/presigned-download`;
            console.log('🏠 Loading room from BACKEND:', { resourceId: roomResourceId, apiUrl });
            const response = await fetch(apiUrl, {
              headers: {
                'x-api-key': domainConfig.apiKey
              }
            });
            if (response.ok) {
              const data = await response.json();
              fullRoomUrl = data.data.downloadUrl; // API returns { success: true, data: { downloadUrl: 'presigned-s3-url' } }
              console.log('🏠 Backend room URL obtained:', fullRoomUrl);
            } else {
              throw new Error(`API call failed: ${response.status}`);
            }
          } catch (error) {
            console.warn('Failed to fetch room from backend, falling back to local path:', error);
            fullRoomUrl = roomPath!.startsWith('http') ? roomPath! : `${domainConfig.baseDomain}${roomPath!}`;
            console.log('🏠 Fallback to BASE DOMAIN:', fullRoomUrl);
          }
        } else {
          if (!DISABLE_LOCAL_GLB_LOADING) {
          // Use old method (local path)
          fullRoomUrl = roomPath!.startsWith('http') ? roomPath! : `${domainConfig.baseDomain}${roomPath!}`;
          console.log('🏠 Loading room from BASE DOMAIN:', { roomPath, finalUrl: fullRoomUrl });
          }
        }

        // Load new room
        const result = await SceneLoader.ImportMeshAsync(
          '',
          fullRoomUrl,
          '',
          scene
        );

        // Parent to room container
        result.meshes.forEach(mesh => {
          if (mesh.parent === null) {
            mesh.parent = roomRef.current;
          }
          mesh.receiveShadows = true;
        });

        console.log('Room loaded:', fullRoomUrl);
      } catch (error) {
        console.error('Error loading room:', error);
      }
    };

    loadRoom();
  }, [isSceneReady, roomPath, roomResourceId, scene, roomRef]);
};

export default useRoomLoader;