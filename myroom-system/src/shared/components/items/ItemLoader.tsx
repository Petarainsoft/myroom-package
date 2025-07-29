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

        // Get currently loaded item IDs
        const currentItemIds = new Set(
          loadedItemMeshesRef.current
            .filter(mesh => mesh.metadata && (mesh.metadata.itemId || mesh.metadata.id))
            .map(mesh => mesh.metadata.itemId || mesh.metadata.id)
        );

        // Find items that need to be loaded (new items only)
        const itemsToLoad = loadedItems.filter(item => !currentItemIds.has(item.id));

        // Find items that need to be removed (no longer in loadedItems)
        const newItemIds = new Set(loadedItems.map(item => item.id));
        const meshesToRemove = loadedItemMeshesRef.current.filter(
          mesh => mesh.metadata && 
                 (mesh.metadata.itemId || mesh.metadata.id) && 
                 !newItemIds.has(mesh.metadata.itemId || mesh.metadata.id)
        );

        // Remove items that are no longer needed
        meshesToRemove.forEach(mesh => {
          if (mesh && mesh.dispose) {
            mesh.dispose();
          }
        });
        
        // Update the tracking array to remove disposed meshes
        loadedItemMeshesRef.current = loadedItemMeshesRef.current.filter(
          mesh => !meshesToRemove.includes(mesh)
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
                const presignedUrl = data.data.downloadUrl;
                console.log(`✅ [ItemLoader] Got presigned URL for item ${resourceIdToUse}:`, presignedUrl);
                fullItemUrl = presignedUrl;
              } else {
                console.warn(`⚠️ [ItemLoader] Failed to get presigned URL for item ${resourceIdToUse}, falling back to direct path`);
                fullItemUrl = item.path.startsWith('http') ? item.path : `${domainConfig.baseDomain}${item.path}`;
              }
            } catch (error) {
              console.warn(`⚠️ [ItemLoader] Error getting presigned URL for item ${resourceIdToUse}:`, error);
              fullItemUrl = item.path.startsWith('http') ? item.path : `${domainConfig.baseDomain}${item.path}`;
            }
          } else {
            // Use direct path when useResourceId is disabled or no backend config
            // This matches the behavior of myroom-systemc
            fullItemUrl = item.path.startsWith('http') ? item.path : `${domainConfig.baseDomain}${item.path}`;
          }

          // Split URL into root and filename for proper SceneLoader usage
          const lastSlashIndex = fullItemUrl.lastIndexOf('/');
          const rootUrl = fullItemUrl.substring(0, lastSlashIndex + 1);
          const filename = fullItemUrl.substring(lastSlashIndex + 1);

          const result = await SceneLoader.ImportMeshAsync(
            '',
            rootUrl,
            filename,
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
            // Add metadata to identify furniture and item id
            mesh.metadata = { 
              isFurniture: true,
              itemId: item.id,
              id: item.id
            };
            if (shadowGeneratorRef.current)
              shadowGeneratorRef.current.addShadowCaster(mesh);
          });

          // Add meshes to tracking array instead of container
          loadedItemMeshesRef.current.push(...result.meshes);
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