import { useEffect, useRef } from 'react';
import { SceneLoader, TransformNode, Scene } from '@babylonjs/core';

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
        const result = await SceneLoader.ImportMeshAsync(
          '',
          roomPath,
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