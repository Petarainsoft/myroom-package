import { useEffect, useRef } from 'react';
import { SceneLoader, TransformNode, Scene } from '@babylonjs/core';
import { domainConfig } from '../shared/config/appConfig';

interface RoomLoaderProps {
  scene: Scene | null;
  roomPath?: string;
  isSceneReady: boolean;
  roomRef: React.MutableRefObject<TransformNode | null>;
}

export const useRoomLoader = ({ scene, roomPath, isSceneReady, roomRef }: RoomLoaderProps) => {
  // Load room when roomPath changes
  useEffect(() => {
    if (!isSceneReady || !scene || !roomPath || !roomRef.current) return;

    const loadRoom = async () => {
      try {
        // Clear existing room
        roomRef.current!.getChildMeshes().forEach(mesh => mesh.dispose());

        // Load new room
        const fullRoomUrl = roomPath.startsWith('http') ? roomPath : `${domainConfig.baseDomain}${roomPath}`;
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
        });

        console.log('Room loaded:', roomPath);
      } catch (error) {
        console.error('Error loading room:', error);
      }
    };

    loadRoom();
  }, [isSceneReady, roomPath, scene, roomRef]);
};

export default useRoomLoader;