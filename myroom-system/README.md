# MyRoom System - React Library

A powerful 3D room visualization and avatar interaction library built with React and Babylon.js.

## Features

- 🏠 **3D Room Visualization** - Interactive 3D rooms with realistic lighting
- 👤 **Avatar System** - Customizable avatars with animations
- 🪑 **Item Management** - Place and manipulate 3D objects in rooms
- 🎮 **Interactive Controls** - Camera controls, movement, and object manipulation
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔧 **TypeScript Support** - Full TypeScript definitions included

## Installation

```bash
npm install myroom-system
# or
yarn add myroom-system
# or
pnpm add myroom-system
```

### Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install react@^18.0.0 react-dom@^18.0.0
```

### Backend Integration

MyRoom System connects to a backend API for data. Make sure your backend is running and accessible:

```bash
# Example backend URL
REACT_APP_BACKEND_URL=http://localhost:3000
REACT_APP_MYROOM_API_KEY=your-api-key

# For Next.js
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_MYROOM_API_KEY=your-api-key
```

## Usage

### Basic Usage

```jsx
import React from 'react';
import { IntegratedBabylonScene } from 'myroom-system';

function App() {
  const handleSceneReady = (scene) => {
    console.log('3D Scene is ready:', scene);
  };

  const handleAvatarChange = (avatarConfig) => {
    console.log('Avatar changed:', avatarConfig);
  };

  const handleRoomChange = (roomId) => {
    console.log('Room changed:', roomId);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <IntegratedBabylonScene
        // Backend Configuration
        apiBaseUrl={process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000'}
        customDomain={process.env.REACT_APP_BACKEND_URL}
        
        // Component Configuration
        roomConfig={{
          defaultRoom: 'living-room',
          enableRoomSwitching: true
        }}
        avatarConfig={{
          defaultGender: 'male',
          enableCustomization: true
        }}
        sceneConfig={{
          enablePostProcessing: true,
          enableSkybox: true
        }}
        
        // UI Configuration
        enableDebug={false}
        showControls={true}
        compactMode={false}
        
        // Event Handlers
        onSceneReady={handleSceneReady}
        onAvatarChange={handleAvatarChange}
        onRoomChange={handleRoomChange}
        onError={(error) => console.error('MyRoom Error:', error)}
      />
    </div>
  );
}

export default App;
```

### Next.js Integration (SSR Compatible)

```jsx
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const MyRoom = dynamic(
  () => import('myroom-system').then(mod => mod.MyRoom),
  { 
    ssr: false,
    loading: () => <div>Loading MyRoom System...</div>
  }
);

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MyRoom
        // Backend Configuration
        apiEndpoint={process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}
        customDomain={process.env.NEXT_PUBLIC_BACKEND_URL}
        
        // Component Configuration
        roomConfig={{ 
          defaultRoom: 'living-room',
          enableRoomSwitching: true
        }}
        avatarConfig={{ 
          defaultGender: 'male',
          enableCustomization: true
        }}
        sceneConfig={{
          enablePostProcessing: true,
          enableSkybox: true
        }}
        
        // UI Configuration
        showControls={true}
        compactMode={false}
        enableDebug={process.env.NODE_ENV === 'development'}
        
        // Event Handlers
        onSceneReady={(scene) => console.log('Scene ready:', scene)}
        onError={(error) => console.error('MyRoom Error:', error)}
      />
    </div>
  );
}
```

#### Environment Variables for Next.js

Create a `.env.local` file:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_MYROOM_API_KEY=your-api-key
```

### Advanced Usage with Custom Configuration

```jsx
import React, { useState } from 'react';
import { 
  IntegratedBabylonScene, 
  ManifestDropdown,
  ApiService 
} from 'myroom-system';

function AdvancedApp() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <IntegratedBabylonScene
        apiBaseUrl="https://your-api-url.com"
        enableDebug={true}
        selectedRoom={selectedRoom}
        selectedAvatar={selectedAvatar}
        onRoomChange={(room) => setSelectedRoom(room)}
        onAvatarChange={(avatar) => setSelectedAvatar(avatar)}
      />
      
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
        <ManifestDropdown
          type="room"
          onSelect={setSelectedRoom}
        />
        <ManifestDropdown
          type="avatar"
          onSelect={setSelectedAvatar}
        />
      </div>
    </div>
  );
}

export default AdvancedApp;
```

## Available Components

### Core Components
- `IntegratedBabylonScene` - Main 3D scene component
- `BabylonScene` - Basic Babylon.js scene wrapper
- `InteractiveRoom` - Interactive room component

### UI Components
- `ManifestDropdown` - Dropdown for selecting rooms/avatars/items
- `SaveManifestModal` - Modal for saving scene configurations
- `ItemManipulationControls` - Controls for manipulating 3D objects
- `SceneControlButtons` - Camera and scene control buttons

### Utility Components
- `ItemLoader` - Component for loading 3D items
- `ItemManipulator` - Component for item manipulation
- `RoomLoader` - Component for loading rooms
- `CacheDebugPanel` - Debug panel for development

## Hooks

- `useAvatarLoader` - Hook for loading and managing avatars
- `useAvatarMovement` - Hook for avatar movement controls
- `usePostProcessing` - Hook for post-processing effects
- `useSkybox` - Hook for skybox management

## Services

- `ApiService` - Service for API communication
- `ManifestService` - Service for manifest management
- `SceneConfigLogger` - Service for logging scene configurations

## Props

### IntegratedBabylonScene Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiBaseUrl` | string | required | Base URL for API endpoints |
| `enableDebug` | boolean | false | Enable debug mode |
| `selectedRoom` | object | null | Pre-selected room |
| `selectedAvatar` | object | null | Pre-selected avatar |
| `onRoomChange` | function | null | Callback when room changes |
| `onAvatarChange` | function | null | Callback when avatar changes |
| `onSceneReady` | function | null | Callback when scene is ready |

## Examples

Complete integration examples are available in the `examples/` directory:

### React Example
```bash
cd examples/react-example
npm install
npm start
```

### Next.js Example
```bash
cd examples/nextjs-example
npm install
npm run dev
```

## API Reference

### MyRoom Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | - | Backend API URL |
| `customDomain` | `string` | - | Custom domain for resources |
| `roomConfig` | `RoomConfig` | - | Room configuration |
| `avatarConfig` | `AvatarConfig` | - | Avatar configuration |
| `sceneConfig` | `SceneConfig` | - | 3D scene configuration |
| `showControls` | `boolean` | `true` | Show built-in controls |
| `compactMode` | `boolean` | `false` | Enable compact UI mode |
| `ultraCompactMode` | `boolean` | `false` | Enable ultra compact mode |
| `enableDebug` | `boolean` | `false` | Enable debug mode |
| `onSceneReady` | `function` | - | Scene ready callback |
| `onAvatarChange` | `function` | - | Avatar change callback |
| `onRoomChange` | `function` | - | Room change callback |
| `onItemAdd` | `function` | - | Item add callback |
| `onItemRemove` | `function` | - | Item remove callback |
| `onError` | `function` | - | Error callback |

### RoomConfig

```typescript
interface RoomConfig {
  defaultRoom?: string;
  enableRoomSwitching?: boolean;
  autoLoad?: boolean;
  availableRooms?: string[];
}
```

### AvatarConfig

```typescript
interface AvatarConfig {
  defaultGender?: 'male' | 'female';
  enableCustomization?: boolean;
  enableMovement?: boolean;
  enableAnimations?: boolean;
}
```

### SceneConfig

```typescript
interface SceneConfig {
  enablePostProcessing?: boolean;
  enableSkybox?: boolean;
  enableShadows?: boolean;
  enableLighting?: boolean;
  cameraSettings?: {
    fov?: number;
    minDistance?: number;
    maxDistance?: number;
  };
}
```

## Development

### Building the Library

```bash
# Build library for distribution
npm run build:lib

# Build demo application
npm run build

# Build all (library + demo + webcomponent)
npm run build:all
```

### Running Development Server

```bash
npm run dev
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

For support and questions, please open an issue on GitHub.