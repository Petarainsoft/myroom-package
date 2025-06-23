import { useEffect, useRef } from 'react';
import { UtilityLayerRenderer, PositionGizmo, RotationGizmo, ScaleGizmo } from '@babylonjs/core';

interface ItemManipulatorProps {
  gizmoMode?: 'position' | 'rotation' | 'scale';
  selectedItem?: any;
  utilityLayerRef: React.MutableRefObject<UtilityLayerRenderer | null>;
  onItemTransformChange?: (itemId: string, transform: { 
    position: { x: number; y: number; z: number }; 
    rotation: { x: number; y: number; z: number }; 
    scale: { x: number; y: number; z: number } 
  }) => void;
  onSelectItem?: (item: any) => void;
  loadedItemMeshesRef: React.MutableRefObject<any[]>;
}

export const useItemManipulator = ({
  gizmoMode,
  selectedItem,
  utilityLayerRef,
  onItemTransformChange,
  onSelectItem,
  loadedItemMeshesRef
}: ItemManipulatorProps) => {
  const gizmoRef = useRef<PositionGizmo | RotationGizmo | ScaleGizmo | null>(null);
  const selectedItemRef = useRef<any>(null);

  // Update selected item ref when selectedItem changes
  useEffect(() => {
    selectedItemRef.current = selectedItem;
  }, [selectedItem]);

  const selectItem = (mesh: any) => {
    console.log('selectItem called with mesh:', mesh.name);
    // Find the item container that contains this mesh
    const itemContainer = loadedItemMeshesRef.current.find(container => {
      const isDirectChild = mesh.parent === container;
      
      // Check if mesh is descendant by walking up parent chain
      let isDescendant = false;
      let currentParent = mesh.parent;
      while (currentParent && !isDescendant) {
        if (currentParent === container) {
          isDescendant = true;
        }
        currentParent = currentParent.parent;
      }
      
      console.log('Checking container in selectItem:', container.name, 'Direct child:', isDirectChild, 'Descendant:', isDescendant);
      return isDirectChild || isDescendant;
    });
    
    console.log('Found item container:', itemContainer?.name);
    
    if (itemContainer) {
      selectedItemRef.current = itemContainer;
      onSelectItem?.(itemContainer);
      console.log('Item selected:', itemContainer.name);
      
      // Create or update gizmo
      updateGizmo(itemContainer);
    } else {
      console.log('No item container found for mesh:', mesh.name);
    }
  };

  const deselectItem = () => {
    selectedItemRef.current = null;
    onSelectItem?.(null);
    
    // Hide gizmo
    if (gizmoRef.current) {
      gizmoRef.current.dispose();
      gizmoRef.current = null;
    }
  };

  const updateItemTransform = (itemId: string, mesh: any) => {
    if (onItemTransformChange) {
      const transform = {
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
        scale: { x: mesh.scaling.x, y: mesh.scaling.y, z: mesh.scaling.z }
      };
      onItemTransformChange(itemId, transform);
    }
  };

  const updateGizmo = (mesh: any) => {
    if (!utilityLayerRef.current) return;
    
    // Dispose existing gizmo
    if (gizmoRef.current) {
      gizmoRef.current.dispose();
    }
    
    // Create new gizmo based on mode
    const currentGizmoMode = gizmoMode || 'position';
    switch (currentGizmoMode) {
      case 'position':
        gizmoRef.current = new PositionGizmo(utilityLayerRef.current);
        // Improve position gizmo sensitivity
        if (gizmoRef.current) {
          (gizmoRef.current as any).scaleRatio = 1.2;
          (gizmoRef.current as any).sensitivity = 1.5;
        }
        break;
      case 'rotation':
        gizmoRef.current = new RotationGizmo(utilityLayerRef.current);
        // Improve rotation gizmo settings
        if (gizmoRef.current) {
          (gizmoRef.current as any).scaleRatio = 1.2;
          (gizmoRef.current as any).sensitivity = 2.0;
          // Enable snap to grid for better control
          (gizmoRef.current as any).snapDistance = Math.PI / 12; // 15 degrees
        }
        break;
      case 'scale':
        gizmoRef.current = new ScaleGizmo(utilityLayerRef.current);
        // Improve scale gizmo sensitivity
        if (gizmoRef.current) {
          (gizmoRef.current as any).scaleRatio = 1.2;
          (gizmoRef.current as any).sensitivity = 1.8;
        }
        break;
      default:
        return;
    }
    
    // Attach gizmo to mesh
    gizmoRef.current.attachedMesh = mesh;
    if ('updateGizmoRotationToMatchAttachedMesh' in gizmoRef.current) {
      (gizmoRef.current as any).updateGizmoRotationToMatchAttachedMesh = true;
    }
    if ('updateGizmoPositionToMatchAttachedMesh' in gizmoRef.current) {
      (gizmoRef.current as any).updateGizmoPositionToMatchAttachedMesh = true;
    }

    // Add drag callbacks for real-time updates
    if (gizmoRef.current) {
      const gizmo = gizmoRef.current as any;
      
      // Real-time updates during drag
      if (gizmo.onDragObservable) {
        gizmo.onDragObservable.add(() => {
          updateItemTransform(mesh.name, mesh);
        });
      }
      
      // Final update on drag end
      if (gizmo.onDragEndObservable) {
        gizmo.onDragEndObservable.add(() => {
          updateItemTransform(mesh.name, mesh);
        });
      }
      
      // For rotation gizmo, add specific rotation callbacks
      if (currentGizmoMode === 'rotation' && gizmo.xGizmo && gizmo.yGizmo && gizmo.zGizmo) {
        [gizmo.xGizmo, gizmo.yGizmo, gizmo.zGizmo].forEach(axisGizmo => {
          if (axisGizmo.dragBehavior) {
            axisGizmo.dragBehavior.onDragObservable.add(() => {
              updateItemTransform(mesh.name, mesh);
            });
          }
        });
      }
      
      // For position gizmo, add specific position callbacks
      if (currentGizmoMode === 'position' && gizmo.xGizmo && gizmo.yGizmo && gizmo.zGizmo) {
        [gizmo.xGizmo, gizmo.yGizmo, gizmo.zGizmo].forEach(axisGizmo => {
          if (axisGizmo.dragBehavior) {
            axisGizmo.dragBehavior.onDragObservable.add(() => {
              updateItemTransform(mesh.name, mesh);
            });
          }
        });
      }
      
      // For scale gizmo, add specific scale callbacks
      if (currentGizmoMode === 'scale' && gizmo.xGizmo && gizmo.yGizmo && gizmo.zGizmo) {
        [gizmo.xGizmo, gizmo.yGizmo, gizmo.zGizmo].forEach(axisGizmo => {
          if (axisGizmo.dragBehavior) {
            axisGizmo.dragBehavior.onDragObservable.add(() => {
              updateItemTransform(mesh.name, mesh);
            });
          }
        });
      }
    }
  };

  // Update gizmo when mode changes
  useEffect(() => {
    if (selectedItemRef.current) {
      updateGizmo(selectedItemRef.current);
    }
  }, [gizmoMode]);

  // Hide gizmo when no item is selected
  useEffect(() => {
    if (!selectedItem && gizmoRef.current) {
      gizmoRef.current.dispose();
      gizmoRef.current = null;
    }
  }, [selectedItem]);

  // Cleanup gizmo on unmount
  useEffect(() => {
    return () => {
      if (gizmoRef.current) {
        gizmoRef.current.dispose();
        gizmoRef.current = null;
      }
    };
  }, []);

  return {
    selectItem,
    deselectItem,
    updateGizmo,
    updateItemTransform
  };
};

export default useItemManipulator;