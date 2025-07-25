// Define data structure for a loaded item
export interface LoadedItem {
  id: string; // Unique item ID
  name: string; // Display name of the item
  path: string; // Path to 3D model file
  position: { x: number; y: number; z: number }; // Position in 3D space
  rotation?: { x: number; y: number; z: number }; // Rotation angles (optional)
  scale?: { x: number; y: number; z: number }; // Scale factors (optional)
  resourceId?: string; // Optional resourceId for backend API integration
}