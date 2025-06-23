import React from 'react';
import ReactDOM from 'react-dom/client';
import EmbedApp from './EmbedApp';
import { domainConfig, getEmbedUrl } from '../../shared/config/appConfig';
import '../../shared/styles/index.css';

// Render embed demo
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EmbedApp />
  </React.StrictMode>,
);

// Export for external usage
(window as any).MyRoomEmbed = {
  version: '1.0.0',
  ready: false,
  
  // API methods for external control
  sendCommand: (command: string, data?: any) => {
    window.postMessage({
      type: 'MYROOM_3D_COMMAND',
      command,
      data
    }, '*');
  },
  
  // Helper to create embed iframe
  createEmbed: (container: HTMLElement, options: any = {}) => {
    const {
      room = '/models/rooms/cate001/MR_KHROOM_0001.glb',
      gender = 'female',
      width = '800px',
      height = '600px',
      autoplay = true
    } = options;
    
    const params = new URLSearchParams({
      room,
      gender,
      width,
      height,
      autoplay: autoplay.toString()
    });
    
    const iframe = document.createElement('iframe');
    iframe.src = getEmbedUrl({
      room,
      gender,
      width,
      height,
      autoplay: autoplay.toString()
    });
    iframe.width = width;
    iframe.height = height;
    iframe.frameBorder = '0';
    iframe.style.border = 'none';
    
    container.appendChild(iframe);
    
    return {
      iframe,
      sendCommand: (command: string, data?: any) => {
        iframe.contentWindow?.postMessage({
          type: 'MYROOM_3D_COMMAND',
          command,
          data
        }, '*');
      }
    };
  }
};

console.log('MyRoom 3D Embed loaded successfully!');
console.log('Available API:', (window as any).MyRoomEmbed);