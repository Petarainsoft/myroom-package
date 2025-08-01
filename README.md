# MyRoom System

A comprehensive 3D room customization system for React and Next.js applications, built with Babylon.js.

## Features

- 🏠 **3D Room Customization**: Interactive 3D room builder with drag-and-drop functionality
- 👤 **Avatar System**: Full avatar customization with clothing, accessories, and animations
- 🎨 **Item Management**: Extensive library of 3D furniture and decorations
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Performance Optimized**: Built with performance in mind using Babylon.js
- 🔧 **Developer Friendly**: Easy integration with React and Next.js applications

## Installation

```bash
npm install @petarain/myroom-system
```

or

```bash
yarn add @petarain/myroom-system
```

## Quick Start

### React Integration

```jsx
import React from 'react';
import { MyRoom } from '@petarain/myroom-system';
import '@petarain/myroom-system/myroom-system.es.js';

function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MyRoom 
        apiKey="your-api-key"
        userId="user-id"
        onSceneReady={(scene) => console.log('Scene ready:', scene)}
      />
    </div>
  );
}

export default App;
```

### Next.js Integration

```jsx
// pages/index.js or app/page.tsx
import dynamic from 'next/dynamic';

const MyRoom = dynamic(
  () => import('@petarain/myroom-system').then(mod => mod.MyRoom),
  { ssr: false }
);

export default function HomePage() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MyRoom 
        apiKey="your-api-key"
        userId="user-id"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | - | Your API key for accessing the service |
| `userId` | `string` | - | Unique identifier for the user |
| `presetId` | `string` | - | Initial room preset to load |
| `roomId` | `string` | - | Specific room ID to load |
| `onSceneReady` | `function` | - | Callback fired when the 3D scene is ready |
| `onSave` | `function` | - | Callback fired when user saves their room |
| `onItemSelect` | `function` | - | Callback fired when an item is selected |
| `showUI` | `boolean` | `true` | Whether to show the built-in UI |
| `enableVR` | `boolean` | `false` | Enable VR mode support |

## Advanced Usage

### Custom Configuration

```jsx
import { MyRoom } from '@petarain/myroom-system';

function CustomRoom() {
  const handleSave = (data) => {
    console.log('Room saved:', data);
    // Save to your backend
  };

  return (
    <MyRoom
      apiKey="your-api-key"
      userId="user-123"
      presetId="modern-living"
      onSceneReady={(scene) => {
        // Custom scene initialization
        scene.clearColor = new BABYLON.Color4(0.9, 0.9, 0.9, 1);
      }}
      onSave={handleSave}
      showUI={true}
    />
  );
}
```

### Using Hooks

```jsx
import { useMyRoom, useAvatar, useItems } from '@petarain/myroom-system';

function RoomManager() {
  const { room, updateRoom } = useMyRoom();
  const { avatar, updateAvatar } = useAvatar();
  const { items, addItem, removeItem } = useItems();

  return (
    <div>
      {/* Your custom UI */}
    </div>
  );
}
```

## Web Component Usage

You can also use the web component directly in HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@petarain/myroom-system/myroom-system.es.js"></script>
</head>
<body>
  <my-room-system
    api-key="your-api-key"
    user-id="user-id"
    style="width: 100%; height: 100vh; display: block;"
  ></my-room-system>
</body>
</html>
```

## API Reference

### MyRoom Component

The main component for 3D room customization.

```typescript
interface MyRoomProps {
  apiKey: string;
  userId: string;
  presetId?: string;
  roomId?: string;
  onSceneReady?: (scene: BABYLON.Scene) => void;
  onSave?: (data: RoomData) => void;
  onItemSelect?: (item: ItemData) => void;
  showUI?: boolean;
  enableVR?: boolean;
}
```

### Types

```typescript
interface RoomData {
  id: string;
  name: string;
  items: ItemData[];
  avatar?: AvatarData;
  settings: RoomSettings;
}

interface ItemData {
  id: string;
  type: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  metadata?: Record<string, any>;
}

interface AvatarData {
  gender: 'male' | 'female';
  outfit: string;
  accessories: string[];
  position: Vector3;
  rotation: Vector3;
}
```

## Development

### Building from Source

```bash
git clone https://github.com/Petarainsoft/myroom-package.git
cd myroom-package
npm install
npm run build
```

### Local Development

```bash
npm run dev
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For support, please visit:
- [GitHub Issues](https://github.com/Petarainsoft/myroom-package/issues)
- [Documentation](https://github.com/Petarainsoft/myroom-package/wiki)
- [Discord Community](https://discord.gg/myroom-system)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.