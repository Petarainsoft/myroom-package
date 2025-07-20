// import { useEffect, useRef } from 'react';
import React, { useEffect } from 'react';
import { SceneLoader, TransformNode, Scene } from '@babylonjs/core';
import { domainConfig } from '../../config/appConfig';

interface RoomLoaderProps {
  scene: Scene | null;
  roomPath?: string;
  roomResourcePath?: string | null;
  isSceneReady: boolean;
  roomRef: React.MutableRefObject<TransformNode | null>;
}

export const useRoomLoader = ({ scene, roomPath, roomResourcePath, isSceneReady, roomRef }: RoomLoaderProps) => {
  // Load room when roomPath changes
  useEffect(() => {
    if (!isSceneReady || !scene || !roomPath || !roomRef.current) return;

    const loadRoom = async () => {
      try {
        // Clear existing room
        roomRef.current!.getChildMeshes().forEach(mesh => mesh.dispose());

        let fullRoomUrl: string;
        if (roomResourcePath) {
          // Call API to get S3 path
          const apiUrl = `${domainConfig.backendDomain}/api/customer/room/${roomResourcePath}`;
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${domainConfig.apiKey}`
            }
          });
          if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
          }
          const data = await response.json();
          fullRoomUrl = data.path; // Assuming the API returns { path: 's3url' }
        } else {
          fullRoomUrl = roomPath!.startsWith('http') ? roomPath! : `${domainConfig.baseDomain}${roomPath!}`;
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
  }, [isSceneReady, roomPath, roomResourcePath, scene, roomRef]);
};

export default useRoomLoader;