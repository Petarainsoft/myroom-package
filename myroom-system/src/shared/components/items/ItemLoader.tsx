import { useEffect } from 'react';
import { SceneLoader, TransformNode, Scene, Vector3, ShadowGenerator } from '@babylonjs/core';
import { LoadedItem } from '../../types/LoadedItem';
import { domainConfig } from '../../config/appConfig';

interface ItemLoaderProps {
  scene: Scene | null;
  loadedItems?: LoadedItem[];
  isSceneReady: boolean;
  itemsRef: React.MutableRefObject<TransformNode | null>;
  loadedItemMeshesRef: React.MutableRefObject<any[]>;
  shadowGeneratorRef: React.MutableRefObject<ShadowGenerator | null>;
}

export const useItemLoader = ({
  scene,
  loadedItems,
  isSceneReady,
  itemsRef,
  loadedItemMeshesRef,
  shadowGeneratorRef
}: ItemLoaderProps) => {
  // Load items when loadedItems changes
  useEffect(() => {
    if (!isSceneReady || !scene || !loadedItems || !itemsRef.current) return;

    const loadItems = async () => {
      try {
        // Get currently loaded item IDs
        const currentItemIds = new Set(
          loadedItemMeshesRef.current.map(container => container.name)
        );

        // Find items that need to be loaded (new items only)
        const itemsToLoad = loadedItems.filter(item => !currentItemIds.has(item.id));
        
        // Find items that need to be removed (no longer in loadedItems)
        const newItemIds = new Set(loadedItems.map(item => item.id));
        const containersToRemove = loadedItemMeshesRef.current.filter(
          container => !newItemIds.has(container.name)
        );

        // Remove items that are no longer needed
        containersToRemove.forEach(container => {
          if (container && container.dispose) {
            container.dispose();
          }
        });
        
        // Update the tracking array to remove disposed containers
        loadedItemMeshesRef.current = loadedItemMeshesRef.current.filter(
          container => newItemIds.has(container.name)
        );

        // Load only new items
        for (const item of itemsToLoad) {
          // Validate item has required properties
          if (!item || !item.path || typeof item.path !== 'string') {
            console.warn('Skipping invalid item:', item);
            continue;
          }

          let fullItemUrl: string;
          if (item.resourcePath) {
            // Call API to get S3 path
            const apiUrl = `${domainConfig.backendDomain}/api/customer/item/${item.resourcePath}`;
            const response = await fetch(apiUrl, {
              headers: {
                'Authorization': `Bearer ${domainConfig.apiKey}`
              }
            });
            if (!response.ok) {
              throw new Error(`API call failed: ${response.status}`);
            }
            const data = await response.json();
            fullItemUrl = data.path; // Assuming the API returns { path: 's3url' }
          } else {
            fullItemUrl = item.path.startsWith('http') ? item.path : `${domainConfig.baseDomain}${item.path}`;
          }

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
            // Add metadata to identify furniture
            mesh.metadata = { isFurniture: true };
            if (shadowGeneratorRef.current)
              shadowGeneratorRef.current.addShadowCaster(mesh);
          });

          // Add container to tracking array
          loadedItemMeshesRef.current.push(itemContainer);
        }

        console.log(`Loaded ${itemsToLoad.length} new items (${loadedItemMeshesRef.current.length} total items)`);
      } catch (error) {
        console.error('Error loading items:', error);
      }
    };

    loadItems();
  }, [isSceneReady, loadedItems, scene, itemsRef, loadedItemMeshesRef]);
};

export default useItemLoader;