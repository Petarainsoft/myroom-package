import React from 'react';
import {
  Scene,
  ArcRotateCamera,
  Vector3,
  PointerEventTypes,
  Matrix,
  AbstractMesh,
  TransformNode,
  Mesh,
  Quaternion,
  MeshBuilder
} from '@babylonjs/core';

interface PointerManagerProps {
  scene: Scene;
  camera: ArcRotateCamera;
  avatarRef: React.MutableRefObject<TransformNode | null>;
  selectedMeshRef: React.MutableRefObject<AbstractMesh | null>;
  highlightDiscRef: React.MutableRefObject<Mesh | null>;
  highlightDiscCircles: Mesh[];
  highlightCirclesRef: React.MutableRefObject<Mesh[] | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  targetDisc: Mesh;
  moveAvatarToPosition: (targetPosition: Vector3, targetDisc: Mesh | null) => void;
  onSelectItem?: (item: any) => void;
  onItemTransformChange?: (itemId: string, transform: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; scale: { x: number; y: number; z: number } }) => void;
  cameraFollowStateRef: React.MutableRefObject<any>;
  isRightMouseDownRef: React.MutableRefObject<boolean>;
  // Ground boundary constants
  groundSize: number;
}

export class PointerManager {
  private scene: Scene;
  private camera: ArcRotateCamera;
  private avatarRef: React.MutableRefObject<TransformNode | null>;
  private selectedMeshRef: React.MutableRefObject<AbstractMesh | null>;
  private isDraggingRef: boolean;
  private isRotatingByDiscRef: boolean;
  private highlightDiscRef: React.MutableRefObject<Mesh | null>;
  private highlightDiscCircles: Mesh[];
  private highlightCirclesRef: React.MutableRefObject<Mesh[] | null>;
  private canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  private targetDisc: Mesh;
  private moveAvatarToPosition: (targetPosition: Vector3, targetDisc: Mesh | null) => void;
  private onSelectItem?: (item: any) => void;
  private onItemTransformChange?: (itemId: string, transform: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; scale: { x: number; y: number; z: number } }) => void;
  private cameraFollowStateRef: React.MutableRefObject<any>;
  private isRightMouseDownRef: React.MutableRefObject<boolean>;
  private groundHalfSize: number;

  // Pointer state variables
  private isAvatarVisible = true;
  private dragStartPoint: Vector3 | null = null;
  private initialMeshPosition: Vector3 | null = null;
  private lastClickTime = 0;
  private readonly doubleClickThreshold = 300;
  private lastPointerX = 0;
  private deltaX = 0;
  private readonly rotationSpeed = 0.02;
  private readonly SNAP_STEP_RAD = Math.PI / 12; // 15 degrees in radians
  private accumulatedRotation = 0;

  constructor(props: PointerManagerProps) {
    this.scene = props.scene;
    this.camera = props.camera;
    this.avatarRef = props.avatarRef;
    this.selectedMeshRef = props.selectedMeshRef;
    this.isDraggingRef = false;
    this.isRotatingByDiscRef = false;
    this.highlightDiscRef = props.highlightDiscRef;
    this.highlightDiscCircles = props.highlightDiscCircles;
    this.highlightCirclesRef = props.highlightCirclesRef;
    this.canvasRef = props.canvasRef;
    this.targetDisc = props.targetDisc;
    this.moveAvatarToPosition = props.moveAvatarToPosition;
    this.onSelectItem = props.onSelectItem;
    this.onItemTransformChange = props.onItemTransformChange;
    this.cameraFollowStateRef = props.cameraFollowStateRef;
    this.isRightMouseDownRef = props.isRightMouseDownRef;
    this.groundHalfSize = props.groundSize / 2;

    this.initializePointerObservable();
  }

  private initializePointerObservable() {
    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN: {
          const currentTime = new Date().getTime();
          const isDoubleClick = (currentTime - this.lastClickTime) < this.doubleClickThreshold;
          this.lastClickTime = currentTime;

          const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);

          // Double click: move avatar
          if (isDoubleClick && this.avatarRef.current && this.isAvatarVisible) {
            const ray = this.scene.createPickingRay(
              this.scene.pointerX,
              this.scene.pointerY,
              Matrix.Identity(),
              this.camera
            );
            const planeNormal = new Vector3(0, 1, 0);
            const planePoint = new Vector3(0, 0, 0);
            const denominator = Vector3.Dot(ray.direction, planeNormal);
            if (Math.abs(denominator) > 0.0001) {
              const t = Vector3.Dot(planePoint.subtract(ray.origin), planeNormal) / denominator;
              if (t >= 0) {
                const intersectionPoint = ray.origin.add(ray.direction.scale(t));
                this.moveAvatarToPosition(intersectionPoint, this.targetDisc);
              }
            }
            return;
          }

          // Single click: item selection
          if (pickResult && pickResult.hit && pickResult.pickedMesh) {
            const pickedMesh = pickResult.pickedMesh as AbstractMesh;

            // Check if it's a furniture item
            if (pickedMesh.metadata && pickedMesh.metadata.isFurniture) {
              // Walk up the parent hierarchy to find the top-level AbstractMesh
              let selectedMesh = pickedMesh;
              while (selectedMesh.parent && selectedMesh.parent instanceof AbstractMesh) {
                selectedMesh = selectedMesh.parent;
              }

              this.selectedMeshRef.current = selectedMesh;
              this.isDraggingRef = false;
              this.isRotatingByDiscRef = false;
              this.dragStartPoint = new Vector3(this.scene.pointerX, this.scene.pointerY, 0);
              this.initialMeshPosition = selectedMesh.position.clone();
              // Initialize accumulated rotation to current mesh rotation (from topmost parent)
              let topMost = selectedMesh;
              while (topMost.parent && topMost.parent instanceof AbstractMesh) {
                topMost = topMost.parent;
              }
              if (topMost.rotationQuaternion) {
                this.accumulatedRotation = topMost.rotationQuaternion.toEulerAngles().y;
              } else {
                this.accumulatedRotation = topMost.rotation.y;
              }

              // Set up highlight disc
              this.scaleHighlightDisc(selectedMesh);
              this.setHighlightDiscPosition(selectedMesh);
              this.setHighlightDiscRotation(selectedMesh);
              this.toggleHighlightDisc(true);
              this.setAvatarVisibility(false);

              // Notify parent component about selection
              if (this.onSelectItem) {
                this.onSelectItem(selectedMesh);
              }

              this.camera.detachControl();
              return;
            }

            // Check if it's a highlight disc child (for rotation)
            if (this.highlightDiscRef.current && this.highlightDiscCircles.includes(pickedMesh as Mesh)) {
              this.isRotatingByDiscRef = true;
              this.lastPointerX = this.scene.pointerX;
              // Initialize accumulated rotation to current mesh rotation when starting rotation
              if (this.selectedMeshRef.current) {
                let topMost = this.selectedMeshRef.current;
                while (topMost.parent && topMost.parent instanceof AbstractMesh) {
                  topMost = topMost.parent;
                }
                if (topMost.rotationQuaternion) {
                  this.accumulatedRotation = topMost.rotationQuaternion.toEulerAngles().y;
                } else {
                  this.accumulatedRotation = topMost.rotation.y;
                }
              }
              this.camera.detachControl();
              return;
            }

            // Check if it's the highlight disc itself
            if (this.highlightDiscRef.current && pickedMesh === this.highlightDiscRef.current) {
              // Don't deselect when clicking on the highlight disc
              return;
            }
          }

          // If no furniture and no highlightDisc or its child circles was clicked, deselect
          this.deselectItem();
          
          // Camera follow/cursor state
          if (pointerInfo.event && pointerInfo.event.button === 2) {
            this.isRightMouseDownRef.current = true;
          }
          if (pointerInfo.event && pointerInfo.event.button === 0) {
            this.cameraFollowStateRef.current.shouldFollowAvatar = true;
          }
          break;
        }

        case PointerEventTypes.POINTERMOVE: {
          if (this.selectedMeshRef.current) {
            if (this.isRotatingByDiscRef) {
              // Rotate by disc
              this.deltaX = this.scene.pointerX - this.lastPointerX;
              this.lastPointerX = this.scene.pointerX;
              // Invert deltaX to fix flipped rotation direction
              this.accumulatedRotation += (-this.deltaX) * this.rotationSpeed;

              // Snap to 15-degree increments
              const snappedRotation = Math.round(this.accumulatedRotation / this.SNAP_STEP_RAD) * this.SNAP_STEP_RAD;
              
              // Find the topmost parent mesh to rotate
              let topMost = this.selectedMeshRef.current;
              while (topMost.parent && topMost.parent instanceof AbstractMesh) {
                topMost = topMost.parent;
              }
              
              // Use rotationQuaternion for proper rotation on the topmost parent
              if (!topMost.rotationQuaternion) {
                topMost.rotationQuaternion = Quaternion.FromEulerAngles(0, 0, 0);
              }
              topMost.rotationQuaternion = Quaternion.FromEulerAngles(0, snappedRotation, 0);
              this.setHighlightDiscRotation(this.selectedMeshRef.current);
              
              // Notify parent about transform change
              this.notifyTransformChange(this.selectedMeshRef.current);
            } else if (this.dragStartPoint && this.initialMeshPosition) {
              // Drag item
              this.isDraggingRef = true;
              
              // Create picking rays for start and current positions
              const startRay = this.scene.createPickingRay(
                this.dragStartPoint.x,
                this.dragStartPoint.y,
                Matrix.Identity(),
                this.camera
              );
              const currentRay = this.scene.createPickingRay(
                this.scene.pointerX,
                this.scene.pointerY,
                Matrix.Identity(),
                this.camera
              );
              
              // Project rays onto the ground plane (y = initial mesh y position)
              const groundY = this.initialMeshPosition.y;
              const planeNormal = new Vector3(0, 1, 0);
              const planePoint = new Vector3(0, groundY, 0);
              
              // Calculate intersection points with the ground plane
              const startIntersection = this.rayPlaneIntersection(startRay, planePoint, planeNormal);
              const currentIntersection = this.rayPlaneIntersection(currentRay, planePoint, planeNormal);
              
              if (startIntersection && currentIntersection) {
                // Calculate world space delta
                const worldDelta = currentIntersection.subtract(startIntersection);
                const newPosition = this.initialMeshPosition.add(worldDelta);
                
                // Apply boundary constraints
                const clampedPosition = this.clampPositionToGround(this.selectedMeshRef.current, newPosition);
                this.selectedMeshRef.current.position.copyFrom(clampedPosition);
                this.setHighlightDiscPosition(this.selectedMeshRef.current);
                
                // Notify parent about transform change
                this.notifyTransformChange(this.selectedMeshRef.current);
              }
            }
          }

          // Update cursor based on hovered mesh
          const hoverPickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
          if (hoverPickResult && hoverPickResult.hit && hoverPickResult.pickedMesh) {
            const hoveredMesh = hoverPickResult.pickedMesh as AbstractMesh;
            if (hoveredMesh.metadata && hoveredMesh.metadata.isFurniture) {
              if (this.canvasRef.current) {
                this.canvasRef.current.style.cursor = 'pointer';
              }
            } else {
              if (this.canvasRef.current) {
                this.canvasRef.current.style.cursor = 'default';
              }
            }
          } else {
            if (this.canvasRef.current) {
              this.canvasRef.current.style.cursor = 'default';
            }
          }
          break;
        }

        case PointerEventTypes.POINTERUP: {
          if (this.selectedMeshRef.current) {
            this.isDraggingRef = false;
            this.isRotatingByDiscRef = false;
            this.dragStartPoint = null;
            this.initialMeshPosition = null;
            this.camera.attachControl(this.canvasRef.current, true);
          }
          
          // Don't reset accumulated rotation - preserve the final rotation value
          if (pointerInfo.event && pointerInfo.event.button === 2) {
            this.isRightMouseDownRef.current = false;
            this.cameraFollowStateRef.current.shouldFollowAvatar = true;
          }
          break;
        }
      }
    });
  }

  private rayPlaneIntersection(ray: any, planePoint: Vector3, planeNormal: Vector3): Vector3 | null {
    const denominator = Vector3.Dot(planeNormal, ray.direction);
    if (Math.abs(denominator) < 0.0001) {
      return null; // Ray is parallel to plane
    }
    
    const t = Vector3.Dot(planePoint.subtract(ray.origin), planeNormal) / denominator;
    if (t < 0) {
      return null; // Intersection is behind ray origin
    }
    
    return ray.origin.add(ray.direction.scale(t));
  }

  private clampPositionToGround(mesh: AbstractMesh, newPosition: Vector3): Vector3 {
    // Get the total bounding box including all children
    const allMeshes = [mesh, ...mesh.getChildMeshes()];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    
    // Calculate the combined bounding box of all meshes
    allMeshes.forEach(childMesh => {
      const boundingInfo = childMesh.getBoundingInfo();
      // Use minimumWorld and maximumWorld directly as they are already in world space
      const min = boundingInfo.boundingBox.minimumWorld;
      const max = boundingInfo.boundingBox.maximumWorld;
      
      minX = Math.min(minX, min.x);
      maxX = Math.max(maxX, max.x);
      minZ = Math.min(minZ, min.z);
      maxZ = Math.max(maxZ, max.z);
    });
    
    // Calculate object size relative to its center position
    const currentCenterX = mesh.position.x;
    const currentCenterZ = mesh.position.z;
    
    const objectHalfSizeX = Math.max(Math.abs(maxX - currentCenterX), Math.abs(minX - currentCenterX));
    const objectHalfSizeZ = Math.max(Math.abs(maxZ - currentCenterZ), Math.abs(minZ - currentCenterZ));
    
    // Calculate the effective boundaries
    const boundaryMinX = -this.groundHalfSize + objectHalfSizeX;
    const boundaryMaxX = this.groundHalfSize - objectHalfSizeX;
    const boundaryMinZ = -this.groundHalfSize + objectHalfSizeZ;
    const boundaryMaxZ = this.groundHalfSize - objectHalfSizeZ;
    
    // Clamp the position within boundaries
    const clampedPosition = newPosition.clone();
    clampedPosition.x = Math.max(boundaryMinX, Math.min(boundaryMaxX, newPosition.x));
    clampedPosition.z = Math.max(boundaryMinZ, Math.min(boundaryMaxZ, newPosition.z));
    
    return clampedPosition;
  }

  private setAvatarVisibility(isVisible: boolean) {
    if (this.avatarRef.current) {
      this.avatarRef.current.getChildMeshes().forEach((mesh) => {
        mesh.isVisible = isVisible;
      });
    }
    this.isAvatarVisible = isVisible;
  }

  private scaleHighlightDisc(selectedMesh: AbstractMesh) {
    if (!this.scene) return;
    // Compute bounding box from all child meshes, using local size and world scale only
    const childMeshes = selectedMesh.getChildMeshes ? selectedMesh.getChildMeshes() : [];
    let maxFootprint = 0;
    let margin = 0.65;
    if (childMeshes.length > 0) {
      childMeshes.forEach(mesh => {
        const b = mesh.getBoundingInfo().boundingBox;
        const min = b.minimum;
        const max = b.maximum;
        // Local size
        const sizeX = Math.abs(max.x - min.x);
        const sizeY = Math.abs(max.y - min.y);
        // Get world scaling (ignoring rotation)
        let scaling = new Vector3(1, 1, 1);
        mesh.getWorldMatrix().decompose(scaling, undefined, undefined);
        // Scaled size in world
        const scaledX = sizeX * Math.abs(scaling.x);
        const scaledY = sizeY * Math.abs(scaling.y);
        const localFootprint = Math.max(scaledX, scaledY);
        if (localFootprint > maxFootprint) maxFootprint = localFootprint;
      });
    } else {
      // fallback: use selectedMesh's own bounding box
      const b = selectedMesh.getBoundingInfo().boundingBox;
      const min = b.minimum;
      const max = b.maximum;
      const sizeX = Math.abs(max.x - min.x);
      const sizeY = Math.abs(max.y - min.y);
      let scaling = new Vector3(1, 1, 1);
      selectedMesh.getWorldMatrix().decompose(scaling, undefined, undefined);
      const scaledX = sizeX * Math.abs(scaling.x);
      const scaledY = sizeY * Math.abs(scaling.y);
      maxFootprint = Math.max(scaledX, scaledY);
    }
    const meshRadius = maxFootprint * margin;
    if (this.highlightDiscRef.current) {
      // Save children (small green circles)
      const children = this.highlightDiscRef.current.getChildren();
      // Save material and rotation
      const oldMaterial = this.highlightDiscRef.current.material;
      const oldRotation = this.highlightDiscRef.current.rotation.clone();
      const oldIsVisible = this.highlightDiscRef.current.isVisible;
      // Remove children from parent (so they aren't disposed)
      children.forEach(child => child.parent = null);
      this.highlightDiscRef.current.dispose();
      // Create new disc
      const newDisc = MeshBuilder.CreateDisc(
        'highlightDisc',
        { radius: meshRadius, tessellation: 64 },
        this.scene
      );
      newDisc.rotation = oldRotation;
      newDisc.isVisible = oldIsVisible;
      newDisc.material = oldMaterial;
      // Re-parent children
      children.forEach(child => child.parent = newDisc);
      this.highlightDiscRef.current = newDisc;

      // Update small green circles' positions to match new radius
      if (this.highlightCirclesRef.current) {
        const angles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
        this.highlightCirclesRef.current.forEach((circle, i) => {
          const x = meshRadius * Math.cos(angles[i]);
          const y = meshRadius * Math.sin(angles[i]);
          circle.position.x = x;
          circle.position.y = y;
          // Z stays at -0.01 (slightly above ground)
        });
      }
    }
  }

  private setHighlightDiscPosition(selectedMesh: AbstractMesh) {
    if (this.highlightDiscRef.current) {
      this.highlightDiscRef.current.position.copyFrom(selectedMesh.getAbsolutePosition());
      this.highlightDiscRef.current.position.y += 0.02;
    }
  }

  private setHighlightDiscRotation(selectedMesh: AbstractMesh) {
    if (this.highlightDiscRef.current) {
      let topMost = selectedMesh;
      while (topMost.parent && topMost.parent instanceof AbstractMesh) {
        topMost = topMost.parent;
      }
      if (topMost.rotationQuaternion) {
        const euler = topMost.rotationQuaternion.toEulerAngles();
        this.highlightDiscRef.current.rotation.y = euler.y;
      } else {
        this.highlightDiscRef.current.rotation.y = topMost.rotation.y;
      }
    }
  }

  private toggleHighlightDisc(isVisible: boolean) {
    if (this.highlightDiscRef.current) {
      this.highlightDiscRef.current.isVisible = isVisible;
      this.highlightDiscCircles.forEach(circle => circle.isVisible = isVisible);
    }
  }

  private deselectItem() {
    if (this.selectedMeshRef.current && !this.isDraggingRef) {
      this.selectedMeshRef.current = null;
      this.isDraggingRef = false;
      this.isRotatingByDiscRef = false;
      this.setAvatarVisibility(true);
      this.toggleHighlightDisc(false);
    }
  }

  private notifyTransformChange(mesh: AbstractMesh) {
    if (!this.onItemTransformChange || !mesh || !mesh.metadata) {
      return;
    }

    // Get the item ID from metadata
    const itemId = mesh.metadata.itemId || mesh.metadata.id || mesh.name;
    if (!itemId) {
      return;
    }

    // Find the topmost parent mesh to get accurate transform
    let topMost = mesh;
    while (topMost.parent && topMost.parent instanceof AbstractMesh) {
      topMost = topMost.parent;
    }

    // Get position
    const position = {
      x: topMost.position.x,
      y: topMost.position.y,
      z: topMost.position.z
    };

    // Get rotation
    let rotation;
    if (topMost.rotationQuaternion) {
      const euler = topMost.rotationQuaternion.toEulerAngles();
      rotation = {
        x: euler.x,
        y: euler.y,
        z: euler.z
      };
    } else {
      rotation = {
        x: topMost.rotation.x,
        y: topMost.rotation.y,
        z: topMost.rotation.z
      };
    }

    // Get scale
    const scale = {
      x: topMost.scaling.x,
      y: topMost.scaling.y,
      z: topMost.scaling.z
    };

    // Call the callback
    this.onItemTransformChange(itemId, { position, rotation, scale });
  }

  public dispose() {
    // Clean up pointer observable if needed
    // The scene will handle disposal of observables when it's disposed
  }

  public handleDeselectItem() {
    this.deselectItem();
  }
}