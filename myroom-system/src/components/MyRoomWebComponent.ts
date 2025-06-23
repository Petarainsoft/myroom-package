import { Engine, Scene, AbstractEngine } from '@babylonjs/core';
import { getDefaultConfigForGender } from '../data/avatarPartsData';
import { AvatarConfig } from '../types/AvatarTypes';
import { LoadedItem } from '../types/LoadedItem';

// Interface for web component properties
interface MyRoomComponentAttributes {
  room?: string;
  gender?: 'male' | 'female';
  width?: string;
  height?: string;
  autoplay?: boolean;
  'avatar-config'?: string; // JSON string
  'loaded-items'?: string; // JSON string
  'enable-controls'?: boolean;
  'camera-controls'?: boolean;
  'gizmo-mode'?: 'position' | 'rotation' | 'scale';
}

// Interface cho events
interface MyRoomEvents {
  'scene-ready': CustomEvent<{ scene: Scene; engine: Engine }>;
  'avatar-changed': CustomEvent<{ config: AvatarConfig }>;
  'item-selected': CustomEvent<{ item: any }>;
  'camera-moved': CustomEvent<{ position: any; target: any }>;
  'error': CustomEvent<{ message: string; error: any }>;
}

// Web Component class
class MyRoomWebComponent extends HTMLElement {
  private shadow: ShadowRoot;
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private engine: AbstractEngine | null = null;
  private scene: Scene | null = null;
  private reactRoot: any = null;
  private isInitialized = false;

  // Observed attributes
  static get observedAttributes() {
    return [
      'room',
      'gender', 
      'width',
      'height',
      'autoplay',
      'avatar-config',
      'loaded-items',
      'enable-controls',
      'camera-controls',
      'gizmo-mode'
    ];
  }

  constructor() {
    super();
    
    // Create Shadow DOM
    this.shadow = this.attachShadow({ mode: 'open' });
    
    // Create container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      background: #000;
      display: block;
    `;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
      outline: none;
      touch-action: none;
    `;
    
    this.container.appendChild(this.canvas);
    this.shadow.appendChild(this.container);
    
    // Add styles
    this.addStyles();
  }

  private addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        width: 800px;
        height: 600px;
        position: relative;
        overflow: hidden;
      }
      
      .myroom-container {
        width: 100%;
        height: 100%;
        position: relative;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      }
      
      .myroom-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-family: Arial, sans-serif;
        font-size: 16px;
        z-index: 1000;
      }
      
      .myroom-error {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #ff6b6b;
        font-family: Arial, sans-serif;
        font-size: 14px;
        text-align: center;
        z-index: 1000;
        background: rgba(0,0,0,0.8);
        padding: 20px;
        border-radius: 8px;
      }
      
      .myroom-controls {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
        display: flex;
        gap: 8px;
      }
      
      .myroom-btn {
        background: rgba(255,255,255,0.9);
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .myroom-btn:hover {
        background: rgba(255,255,255,1);
        transform: translateY(-1px);
      }
    `;
    this.shadow.appendChild(style);
  }

  connectedCallback() {
    this.updateSize();
    if (!this.isInitialized) {
      this.initialize();
    }
  }

  disconnectedCallback() {
    this.cleanup();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'width':
        case 'height':
          this.updateSize();
          break;
        case 'room':
        case 'gender':
        case 'avatar-config':
          if (this.isInitialized) {
            this.reinitialize();
          }
          break;
        default:
          if (this.isInitialized) {
            this.updateProps();
          }
      }
    }
  }

  private updateSize() {
    const width = this.getAttribute('width') || '800px';
    const height = this.getAttribute('height') || '600px';
    
    this.style.width = width;
    this.style.height = height;
  }

  private async initialize() {
    try {
      this.showLoading();
      
      // Dynamically import React and dependencies
      const [React, ReactDOM, IntegratedBabylonScene] = await Promise.all([
        import('react'),
        import('react-dom/client'),
        import('../IntegratedBabylonScene')
      ]);

      // Create React component
      const props = this.getReactProps();
      
      const App = React.createElement(IntegratedBabylonScene.default, {
        ...props,
        onSceneReady: (scene: Scene) => {
          this.scene = scene;
          this.engine = scene.getEngine();
          this.hideLoading();
          this.dispatchEvent(new CustomEvent('scene-ready', {
            detail: { scene, engine: this.engine }
          }));
        },
        onError: (error: any) => {
          this.showError(error.message || 'Failed to load 3D scene');
          this.dispatchEvent(new CustomEvent('error', {
            detail: { message: error.message, error }
          }));
        }
      });

      // Render React component
      this.reactRoot = ReactDOM.createRoot(this.canvas.parentElement!);
      this.reactRoot.render(App);
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize MyRoom component:', error);
      this.showError('Failed to initialize 3D component');
      this.dispatchEvent(new CustomEvent('error', {
        detail: { message: 'Initialization failed', error }
      }));
    }
  }

  private async reinitialize() {
    this.cleanup();
    this.isInitialized = false;
    await this.initialize();
  }

  private getReactProps() {
    const room = this.getAttribute('room') || '/models/rooms/cate001/MR_KHROOM_0001.glb';
    const gender = (this.getAttribute('gender') as 'male' | 'female') || 'female';
    const autoplay = this.getAttribute('autoplay') === 'true';
    const enableControls = this.getAttribute('enable-controls') !== 'false';
    const cameraControls = this.getAttribute('camera-controls') !== 'false';
    const gizmoMode = this.getAttribute('gizmo-mode') as 'position' | 'rotation' | 'scale' || 'position';
    
    let avatarConfig: AvatarConfig;
    try {
      const configStr = this.getAttribute('avatar-config');
      avatarConfig = configStr ? JSON.parse(configStr) : getDefaultConfigForGender(gender);
    } catch {
      avatarConfig = getDefaultConfigForGender(gender);
    }
    
    let loadedItems: LoadedItem[] = [];
    try {
      const itemsStr = this.getAttribute('loaded-items');
      loadedItems = itemsStr ? JSON.parse(itemsStr) : [];
    } catch {
      loadedItems = [];
    }

    return {
      roomPath: room,
      avatarConfig,
      loadedItems,
      gizmoMode,
      enableControls,
      cameraControls
    };
  }

  private updateProps() {
    if (this.reactRoot && this.isInitialized) {
      // Re-render with new props
      this.reinitialize();
    }
  }

  private showLoading() {
    const existing = this.shadow.querySelector('.myroom-loading');
    if (existing) return;
    
    const loading = document.createElement('div');
    loading.className = 'myroom-loading';
    loading.textContent = 'Loading 3D Scene...';
    this.container.appendChild(loading);
  }

  private hideLoading() {
    const loading = this.shadow.querySelector('.myroom-loading');
    if (loading) {
      loading.remove();
    }
  }

  private showError(message: string) {
    this.hideLoading();
    
    const existing = this.shadow.querySelector('.myroom-error');
    if (existing) existing.remove();
    
    const error = document.createElement('div');
    error.className = 'myroom-error';
    error.innerHTML = `
      <div>❌ Error</div>
      <div style="margin-top: 8px; font-size: 12px;">${message}</div>
    `;
    this.container.appendChild(error);
  }

  private cleanup() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
    
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }
    
    this.scene = null;
  }

  // Public API methods
  public resetCamera() {
    if (this.scene) {
      // Reset camera logic
      this.dispatchEvent(new CustomEvent('camera-moved', {
        detail: { position: null, target: null }
      }));
    }
  }

  public changeAvatar(config: AvatarConfig) {
    this.setAttribute('avatar-config', JSON.stringify(config));
    this.dispatchEvent(new CustomEvent('avatar-changed', {
      detail: { config }
    }));
  }

  public loadItems(items: LoadedItem[]) {
    this.setAttribute('loaded-items', JSON.stringify(items));
  }

  public getScene(): Scene | null {
    return this.scene;
  }

  public getEngine(): AbstractEngine | null {
    return this.engine;
  }
}

// Register web component
if (!customElements.get('my-room-scene')) {
  customElements.define('my-room-scene', MyRoomWebComponent);
}

export default MyRoomWebComponent;
export { MyRoomWebComponent };