// Web Component entry point
import './MyRoomWebComponent';
import { MyRoomWebComponent } from './MyRoomWebComponent';
import { getDefaultConfigForGender, availablePartsData } from '../../shared/data/avatarPartsData';
import { domainConfig, getEmbedUrl } from '../../shared/config/appConfig';
import type { AvatarConfig } from '../../shared/types/AvatarTypes';
import type { LoadedItem } from '../../shared/types/LoadedItem';

// Export types cho TypeScript users
export type { AvatarConfig, LoadedItem };

// Global API object
const MyRoom = {
  version: '1.0.0',
  
  // Helper functions
  getDefaultAvatarConfig: getDefaultConfigForGender,
  availableParts: availablePartsData,
  
  // Create component programmatically
  create: (container: HTMLElement, options: {
    room?: string;
    gender?: 'male' | 'female';
    width?: string;
    height?: string;
    autoplay?: boolean;
    avatarConfig?: AvatarConfig;
    loadedItems?: LoadedItem[];
    enableControls?: boolean;
    cameraControls?: boolean;
    gizmoMode?: 'position' | 'rotation' | 'scale';
    onSceneReady?: (event: CustomEvent) => void;
    onAvatarChanged?: (event: CustomEvent) => void;
    onItemSelected?: (event: CustomEvent) => void;
    onCameraMoved?: (event: CustomEvent) => void;
    onError?: (event: CustomEvent) => void;
  } = {}) => {
    const {
      room = '/models/rooms/cate001/MR_KHROOM_0001.glb',
      gender = 'female',
      width = '800px',
      height = '600px',
      autoplay = true,
      avatarConfig,
      loadedItems,
      enableControls = true,
      cameraControls = true,
      gizmoMode = 'position',
      onSceneReady,
      onAvatarChanged,
      onItemSelected,
      onCameraMoved,
      onError
    } = options;
    
    // Tạo web component
    const component = document.createElement('my-room-scene') as MyRoomWebComponent;
    
    // Set attributes
    component.setAttribute('room', room);
    component.setAttribute('gender', gender);
    component.setAttribute('width', width);
    component.setAttribute('height', height);
    component.setAttribute('autoplay', autoplay.toString());
    component.setAttribute('enable-controls', enableControls.toString());
    component.setAttribute('camera-controls', cameraControls.toString());
    component.setAttribute('gizmo-mode', gizmoMode);
    
    if (avatarConfig) {
      component.setAttribute('avatar-config', JSON.stringify(avatarConfig));
    }
    
    if (loadedItems) {
      component.setAttribute('loaded-items', JSON.stringify(loadedItems));
    }
    
    // Add event listeners
    if (onSceneReady) {
      component.addEventListener('scene-ready', onSceneReady as EventListener);
    }
    if (onAvatarChanged) {
      component.addEventListener('avatar-changed', onAvatarChanged as EventListener);
    }
    if (onItemSelected) {
      component.addEventListener('item-selected', onItemSelected as EventListener);
    }
    if (onCameraMoved) {
      component.addEventListener('camera-moved', onCameraMoved as EventListener);
    }
    if (onError) {
      component.addEventListener('error', onError as EventListener);
    }
    
    // Add to container
    container.appendChild(component);
    
    return component;
  },
  
  // Utility để tạo iframe embed (fallback)
  createIframe: (container: HTMLElement, options: {
    room?: string;
    gender?: 'male' | 'female';
    width?: string;
    height?: string;
    autoplay?: boolean;
    baseUrl?: string;
  } = {}) => {
    const {
      room = '/models/rooms/cate001/MR_KHROOM_0001.glb',
      gender = 'female', 
      width = '800px',
      height = '600px',
      autoplay = true,
      baseUrl = domainConfig.baseDomain
    } = options;
    
    const iframe = document.createElement('iframe');
    // Sử dụng baseUrl nếu được cung cấp, nếu không sử dụng domainConfig.baseDomain
    const embedParams = {
      room,
      gender,
      width,
      height,
      autoplay: autoplay.toString()
    };
    
    // Nếu baseUrl khác với domainConfig.baseDomain, tạo URL thủ công
    if (baseUrl !== domainConfig.baseDomain) {
      const params = new URLSearchParams(embedParams);
      iframe.src = `${baseUrl}/embed.html?${params.toString()}`;
    } else {
      // Sử dụng helper function từ appConfig
      iframe.src = getEmbedUrl(embedParams);
    }
    iframe.width = width;
    iframe.height = height;
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    
    container.appendChild(iframe);
    
    return iframe;
  }
};

// Export cho global usage
(window as any).MyRoom = MyRoom;

// Export cho module usage
export default MyRoom;
export { MyRoomWebComponent };

// Auto-initialize if elements exist in DOM
document.addEventListener('DOMContentLoaded', () => {
  // Automatically initialize existing elements
  const elements = document.querySelectorAll('my-room-scene');
  console.log(`Found ${elements.length} my-room-scene elements`);
});

console.log('MyRoom Web Component loaded successfully!');