import React, { useEffect, useRef } from 'react';
import { SceneLoader, TransformNode, Scene, Vector3 } from '@babylonjs/core';
import { domainConfig } from '../shared/config/appConfig';

interface LoadedItem {
  id: string;
  name: string;
  path: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}

interface ItemLoaderProps {
  scene: Scene | null;
  loadedItems?: LoadedItem[];
  isSceneReady: boolean;
  itemsRef: React.MutableRefObject<TransformNode | null>;
  loadedItemMeshesRef: React.MutableRefObject<any[]>;
}

export const useItemLoader = ({ 
  scene, 
  loadedItems, 
  isSceneReady, 
  itemsRef, 
  loadedItemMeshesRef 
}: ItemLoaderProps) => {
  // Load items when loadedItems changes
  useEffect(() => {
    if (!isSceneReady || !scene || !loadedItems || !itemsRef.current) return;

    const loadItems = async () => {
      try {
        // Clear existing items
        itemsRef.current!.getChildMeshes().forEach(mesh => mesh.dispose());
        loadedItemMeshesRef.current = [];

        // Load new items
        for (const item of loadedItems) {
          // Validate item has required properties
          if (!item || !item.path || typeof item.path !== 'string') {
            console.warn('Skipping invalid item:', item);
            continue;
          }
          
          // Create full URL with domain
          const fullItemUrl = item.path.startsWith('http') ? item.path : `${domainConfig.baseDomain}${item.path}`;
          
          const result = await SceneLoader.ImportMeshAsync(
            '',
            fullItemUrl,
            '',
            scene
          );

          // Create a container for this item
          const itemContainer = new TransformNode(item.id, scene);
          itemContainer.position = new Vector3(item.position.x, item.position.y, item.position.z);
          
          // Apply rotation if available
          if (item.rotation) {
            itemContainer.rotation = new Vector3(item.rotation.x, item.rotation.y, item.rotation.z);
          }
          
          // Apply scale if available
          if (item.scale) {
            itemContainer.scaling = new Vector3(item.scale.x, item.scale.y, item.scale.z);
          }
          
          itemContainer.parent = itemsRef.current;

          // Parent all meshes to the container and make them pickable
          result.meshes.forEach(mesh => {
            if (mesh.parent === null) {
              mesh.parent = itemContainer;
            }
            // Make mesh pickable
            mesh.isPickable = true;
          });

          // Add container to tracking array
          loadedItemMeshesRef.current.push(itemContainer);
        }

        console.log(`Loaded ${loadedItems.length} items`);
      } catch (error) {
        console.error('Error loading items:', error);
      }
    };

    loadItems();
  }, [isSceneReady, loadedItems, scene, itemsRef, loadedItemMeshesRef]);
};

export default useItemLoader;