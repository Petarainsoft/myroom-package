import React from 'react';
import { IntegratedBabylonScene } from '../../shared/components/babylon/IntegratedBabylonScene';
import { getDefaultConfigForGender } from '../../shared/data/avatarPartsData';

// Props from URL parameters for embed
interface EmbedDemoProps {
  room?: string;
  gender?: 'male' | 'female';
  width?: string;
  height?: string;
  autoplay?: boolean;
}

// Parse URL parameters
const getUrlParams = (): EmbedDemoProps => {
  const params = new URLSearchParams(window.location.search);
  return {
    room: params.get('room') || 'relax-mr_khroom_0001',
    gender: (params.get('gender') as 'male' | 'female') || 'female',
    width: params.get('width') || '100%',
    height: params.get('height') || '100vh',
    autoplay: params.get('autoplay') === 'true'
  };
};

// Component cho embed demo
const EmbedDemo: React.FC = () => {
  const params = getUrlParams();
  const avatarConfig = getDefaultConfigForGender(params.gender!);
  const sceneRef = React.useRef<any>(null);

  // Send message to parent window when scene is ready
  const handleSceneReady = (scene: any) => {
    // Notify parent window that embed is ready
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'MYROOM_3D_READY',
        data: {
          sceneId: 'my-room-scene',
          timestamp: Date.now()
        }
      }, '*');
    }
    console.log('Embed scene ready:', scene);
  };

  // Listen for messages from parent
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'MYROOM_3D_COMMAND') {
        console.log('Received command from parent:', event.data);
        // Handle commands from parent window
        switch (event.data.command) {
          case 'RESET_CAMERA':
            // Reset camera using scene ref
            if (sceneRef.current && sceneRef.current.resetCamera) {
              sceneRef.current.resetCamera();
            }
            break;
          case 'CHANGE_AVATAR':
            // Change avatar logic
            break;
          default:
            console.log('Unknown command:', event.data.command);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div 
      className="babylon-scene-container"
      style={{ 
        width: params.width, 
        height: params.height,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#000'
      }}
    >
      <IntegratedBabylonScene
        ref={sceneRef}
        roomPath={params.room}
        avatarConfig={avatarConfig}
        onSceneReady={handleSceneReady}
      />
    </div>
  );
};

export default EmbedDemo;