// Minimal web component without external dependencies
class MyRoomWebComponent extends HTMLElement {
  private shadow: ShadowRoot;
  private container: HTMLDivElement;

  static get observedAttributes() {
    return ['width', 'height'];
  }

  constructor() {
    super();
    
    this.shadow = this.attachShadow({ mode: 'open' });
    
    this.container = document.createElement('div');
    this.container.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 18px;
    `;
    
    this.container.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 10px;">🏠</div>
        <div>MyRoom 3D Component</div>
        <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Ready to load 3D content</div>
      </div>
    `;
    
    this.shadow.appendChild(this.container);
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
    `;
    this.shadow.appendChild(style);
  }

  connectedCallback() {
    this.updateSize();
    console.log('MyRoom Web Component connected');
  }

  disconnectedCallback() {
    console.log('MyRoom Web Component disconnected');
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.updateSize();
    }
  }

  private updateSize() {
    const width = this.getAttribute('width') || '800px';
    const height = this.getAttribute('height') || '600px';
    
    this.style.width = width;
    this.style.height = height;
  }

  // Public API methods
  public resetCamera() {
    console.log('Camera reset requested');
    this.dispatchEvent(new CustomEvent('camera-moved', {
      detail: { position: null, target: null }
    }));
  }

  public getVersion(): string {
    return '1.0.0';
  }
}

// Register web component
if (!customElements.get('my-room-scene')) {
  customElements.define('my-room-scene', MyRoomWebComponent);
}

// Global API
const MyRoom = {
  version: '1.0.0',
  create: (container: HTMLElement, options: any = {}) => {
    const component = document.createElement('my-room-scene') as MyRoomWebComponent;
    
    // Set attributes from options
    Object.keys(options).forEach(key => {
      if (typeof options[key] === 'string' || typeof options[key] === 'boolean') {
        component.setAttribute(key, options[key].toString());
      }
    });
    
    container.appendChild(component);
    return component;
  }
};

// Export for global usage
(window as any).MyRoom = MyRoom;

export default MyRoom;
export { MyRoomWebComponent };

console.log('MyRoom Web Component loaded successfully!');