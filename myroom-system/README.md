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
```

## Peer Dependencies

Make sure you have React 18+ installed:

```bash
npm install react react-dom
```

## Usage

### Basic Usage

```jsx
import React from 'react';
import { IntegratedBabylonScene } from 'myroom-system';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <IntegratedBabylonScene
        apiBaseUrl="https://your-api-url.com"
        enableDebug={false}
      />
    </div>
  );
}

export default App;
```

### Next.js Usage (SSR Compatible)

```jsx
import dynamic from 'next/dynamic';

const MyRoomScene = dynamic(
  () => import('myroom-system').then(mod => mod.IntegratedBabylonScene),
  { ssr: false }
);

function HomePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MyRoomScene
        apiBaseUrl="https://your-api-url.com"
        enableDebug={false}
      />
    </div>
  );
}

export default HomePage;
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