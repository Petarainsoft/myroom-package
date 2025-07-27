import { useEffect } from 'react';
import { SceneLoader, TransformNode, Scene, Vector3, ShadowGenerator } from '@babylonjs/core';
import { LoadedItem } from '../../types/LoadedItem';
import { domainConfig, DISABLE_LOCAL_GLB_LOADING } from '../../config/appConfig';

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
        // Check if local GLB loading is disabled
        if (DISABLE_LOCAL_GLB_LOADING) {
          console.warn('⚠️ [ItemLoader] Local GLB loading is disabled by DISABLE_LOCAL_GLB_LOADING flag');
          // throw new Error('Local GLB item loading is temporarily disabled');
        }
        
        // Clear existing items properly
        if (loadedItemMeshesRef.current.length > 0) {
          loadedItemMeshesRef.current.forEach(container => {
            if (container && container.dispose) {
              container.dispose();
            }
          });
          loadedItemMeshesRef.current = [];
        }

        // Get current item IDs from loaded meshes
        const currentItemIds = new Set(loadedItemMeshesRef.current.map(container => container.name));
        
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
          if (!item || (!item.resourceId && !item.id && !item.path)) {
            console.warn('Skipping invalid item (missing resourceId/id and path):', item);
            continue;
          }

          let fullItemUrl: string;
          
          // Check if useResourceId is enabled and use resourceId or fallback to id
          const resourceIdToUse = item.resourceId || item.id;
          if (domainConfig.useResourceId && resourceIdToUse && domainConfig.backendDomain && domainConfig.apiKey) {
            try {
              // Call API to get download URL using resourceId (or id as fallback)
              const apiUrl = `${domainConfig.backendDomain}/api/developer/items/${resourceIdToUse}/download`;
              console.log('🪑 Loading item from BACKEND:', { itemName: item.name, resourceId: resourceIdToUse, apiUrl });
              const response = await fetch(apiUrl, {
                headers: {
                  'x-api-key': domainConfig.apiKey
                }
              });
              if (response.ok) {
                const data = await response.json();
                fullItemUrl = data.presignedUrl; // Use presignedUrl from API response
                console.log('🪑 Backend item URL obtained:', { itemName: item.name, url: fullItemUrl });
              } else {
                throw new Error(`API call failed: ${response.status}`);
              }
            } catch (error) {
              console.warn('Failed to fetch item from backend, falling back to local path:', error);
              // Fallback to path if available
              if (item.path) {
                fullItemUrl = item.path.startsWith('http') ? item.path : `${domainConfig.baseDomain}${item.path}`;
                console.log('🪑 Fallback to BASE DOMAIN:', { itemName: item.name, url: fullItemUrl });
              } else {
                console.error('No fallback path available for item:', item);
                continue;
              }
            }
          } else if (item.path) {
            if (DISABLE_LOCAL_GLB_LOADING) { continue;}
            // Use old method (local path)
            fullItemUrl = item.path.startsWith('http') ? item.path : `${domainConfig.baseDomain}${item.path}`;
            console.log('🪑 Loading item from BASE DOMAIN:', { itemName: item.name, itemPath: item.path, finalUrl: fullItemUrl });
          } else {
            console.warn('Skipping item without resourceId/id or path:', item);
            continue;
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