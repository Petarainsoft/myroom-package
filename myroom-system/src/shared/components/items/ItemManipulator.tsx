import { useEffect, useRef, useCallback } from 'react';
import { UtilityLayerRenderer, PositionGizmo, RotationGizmo, ScaleGizmo, Mesh } from '@babylonjs/core';

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
  highlightDiscRef: React.MutableRefObject<Mesh | null>;
}

export const useItemManipulator = ({
  gizmoMode,
  selectedItem,
  utilityLayerRef,
  onItemTransformChange,
  onSelectItem,
  loadedItemMeshesRef,
  highlightDiscRef
}: ItemManipulatorProps) => {
  const gizmoRef = useRef<PositionGizmo | RotationGizmo | ScaleGizmo | null>(null);
  const selectedItemRef = useRef<any>(null);
  const transformTimeoutRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

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

      // Position the highlight disc under the selected item
      if (highlightDiscRef.current) {
        highlightDiscRef.current.position = itemContainer.position.clone();
        highlightDiscRef.current.position.y += 0.02;
        highlightDiscRef.current.isVisible = true;
      }

      // Create or update gizmo
      updateGizmo(itemContainer);
    } else {
      console.log('No item container found for mesh:', mesh.name);
    }
  };

  const deselectItem = () => {
    selectedItemRef.current = null;
    onSelectItem?.(null);

    // Hide and dispose gizmo immediately
    if (gizmoRef.current) {
      try {
        // First hide the gizmo immediately
        gizmoRef.current.attachedMesh = null;
        // Then dispose it
        gizmoRef.current.dispose();
        gizmoRef.current = null;
        console.log('Gizmo hidden and disposed in deselectItem');
      } catch (error) {
        console.warn('Error disposing gizmo:', error);
        // Force set to null even if dispose fails
        gizmoRef.current = null;
      }
    }

    // Hide the highlight disc
    if (highlightDiscRef.current) {
      highlightDiscRef.current.isVisible = false;
    }
  };

  const updateItemTransform = useCallback((itemId: string, mesh: any, immediate: boolean = false) => {
    if (!onItemTransformChange) return;

    const doUpdate = () => {
      const transform = {
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
        scale: { x: mesh.scaling.x, y: mesh.scaling.y, z: mesh.scaling.z },
      };
      onItemTransformChange(itemId, transform);

      // Update the highlight disc position
      if (highlightDiscRef.current) {
        highlightDiscRef.current.position = mesh.position.clone();
        highlightDiscRef.current.position.y += 0.02; // Slightly above the ground
      }
    };

    if (immediate) {
      // Clear any pending updates and execute immediately
      if (transformTimeoutRef.current) {
        clearTimeout(transformTimeoutRef.current);
        transformTimeoutRef.current = null;
      }
      doUpdate();
    } else if (isDraggingRef.current) {
      // During dragging, debounce heavily to prevent flickering
      if (transformTimeoutRef.current) {
        clearTimeout(transformTimeoutRef.current);
      }
      transformTimeoutRef.current = window.setTimeout(doUpdate, 150); // Increased debounce time during drag
    } else {
      // Not dragging, update normally but still debounced
      if (transformTimeoutRef.current) {
        clearTimeout(transformTimeoutRef.current);
      }
      transformTimeoutRef.current = window.setTimeout(doUpdate, 50); // Slightly increased for stability
    }
  },
    [onItemTransformChange, highlightDiscRef]
  );

  const updateGizmo = (mesh: any) => {
    if (!utilityLayerRef.current) return;

    // Dispose existing gizmo safely
    if (gizmoRef.current) {
        try {
            gizmoRef.current.dispose();
        } catch (error) {
            console.warn('Error disposing existing gizmo:', error);
        }
        gizmoRef.current = null;
    }

    // Create new gizmo based on mode
    const currentGizmoMode = gizmoMode || 'position';
    switch (currentGizmoMode) {
        case 'position':
            gizmoRef.current = new PositionGizmo(utilityLayerRef.current);
            if (gizmoRef.current) {
                (gizmoRef.current as any).scaleRatio = 1.2;
                (gizmoRef.current as any).sensitivity = 1.5;
                // Disable Y-axis for position changes
                if ((gizmoRef.current as any).yGizmo) {
                    (gizmoRef.current as any).yGizmo.isEnabled = false; // Disable Y-axis
                }
            }
            break;
        case 'rotation':
            gizmoRef.current = new RotationGizmo(utilityLayerRef.current);
            if (gizmoRef.current) {
                (gizmoRef.current as any).scaleRatio = 1.2;
                (gizmoRef.current as any).sensitivity = 2.0;
                (gizmoRef.current as any).snapDistance = Math.PI / 12; // 15 degrees
                if ((gizmoRef.current as any).xGizmo) {
                    (gizmoRef.current as any).xGizmo.isEnabled = false; // Disable X-axis
                }
                if ((gizmoRef.current as any).zGizmo) {
                    (gizmoRef.current as any).zGizmo.isEnabled = false; // Disable Z-axis
                }
                if ((gizmoRef.current as any).yGizmo) {
                    (gizmoRef.current as any).yGizmo.isEnabled = true; // Enable Y-axis
                }
            }
            break;
        case 'scale':
            gizmoRef.current = new ScaleGizmo(utilityLayerRef.current);
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

    // Add optimized drag callbacks for real-time updates
    if (gizmoRef.current) {
        const gizmo = gizmoRef.current as any;

        // Track drag start
        if (gizmo.onDragStartObservable) {
            gizmo.onDragStartObservable.add(() => {
                isDraggingRef.current = true;
            });
        }

        // Real-time updates during drag
        if (gizmo.onDragObservable) {
            gizmo.onDragObservable.add(() => {
                // Apply boundary constraints during drag (for position)
                if (mesh.position) {
                    mesh.position.x = Math.max(-2, Math.min(2, mesh.position.x));
                    mesh.position.z = Math.max(-2, Math.min(2, mesh.position.z));
                }
                // Real-time update for position and rotation
                updateItemTransform(mesh.name, mesh, false);
            });
        }

        // Final update on drag end
        if (gizmo.onDragEndObservable) {
            gizmo.onDragEndObservable.add(() => {
                isDraggingRef.current = false;
                if (transformTimeoutRef.current) {
                    clearTimeout(transformTimeoutRef.current);
                    transformTimeoutRef.current = null;
                }
                // Final boundary check on drag end (for position)
                if (mesh.position) {
                    mesh.position.x = Math.max(-2, Math.min(2, mesh.position.x));
                    mesh.position.z = Math.max(-2, Math.min(2, mesh.position.z));
                }
                updateItemTransform(mesh.name, mesh, true); // Final update
            });
        }
    }
  };

  // Update gizmo when mode changes - only if we have a selected item
  useEffect(() => {
    if (selectedItemRef.current && utilityLayerRef.current) {
      console.log('Updating gizmo due to mode change:', gizmoMode);
      updateGizmo(selectedItemRef.current);
    }
  }, [gizmoMode]);

  // Handle selectedItem changes - hide and dispose gizmo if item no longer exists
  useEffect(() => {
    console.log('selectedItem changed effect triggered', { selectedItem });

    if (!selectedItem && gizmoRef.current) {
      console.log('Attempting to hide and dispose gizmo', {
        gizmoExists: !!gizmoRef.current,
        gizmoType: gizmoRef.current?.constructor.name
      });

      try {
        // First hide the gizmo immediately
        gizmoRef.current.attachedMesh = null;
        // Then dispose it
        gizmoRef.current.dispose();
        gizmoRef.current = null;
        console.log('Gizmo hidden and disposed due to selectedItem being null');
      } catch (error) {
        console.warn('Error disposing gizmo when selectedItem changed:', error);
        console.log('Error details:', {
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack
        });
        // Force set to null even if dispose fails
        gizmoRef.current = null;
      }
    }
  }, [selectedItem]);

  // Cleanup gizmo and timeouts on unmount
  useEffect(() => {
    return () => {
      if (transformTimeoutRef.current) {
        clearTimeout(transformTimeoutRef.current);
      }
      if (gizmoRef.current) {
        try {
          gizmoRef.current.dispose();
        } catch (error) {
          console.warn('Error disposing gizmo on unmount:', error);
        }
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