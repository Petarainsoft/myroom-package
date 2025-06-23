import { AnimationGroup, AbstractMesh, Skeleton } from '@babylonjs/core';

export interface ClonedAnimation {
  animation: AnimationGroup; // Cloned animation group
  skeletonInfo: {
    skeleton: Skeleton; // Skeleton that animation is applied to
    partType: string; // Part type (body, head, hair, ...)
    meshName: string; // Mesh name
    mesh: AbstractMesh; // Reference to mesh
  };
}