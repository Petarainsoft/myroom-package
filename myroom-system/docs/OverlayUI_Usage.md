# OverlayUI Component Usage Guide

The `OverlayUI` component is a reusable overlay interface that provides room and item controls for 3D applications. It was extracted from the `InteractiveRoom` component to be used as a standalone package feature.

## Installation

```bash
npm install myroom-system
```

## Basic Usage

```tsx
import React, { useState } from 'react';
import { OverlayUI } from 'myroom-system';

function MyApp() {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loadedItems, setLoadedItems] = useState([]);

  const rooms = [
    { id: 'room1', name: 'Living Room', resourceId: 'living-room-001' },
    { id: 'room2', name: 'Bedroom', resourceId: 'bedroom-001' }
  ];

  const items = [
    { id: 'chair1', name: 'Modern Chair', path: '/models/chair.glb', category: 'furniture' },
    { id: 'table1', name: 'Coffee Table', path: '/models/table.glb', category: 'furniture' }
  ];

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Your 3D scene goes here */}
      <div>3D Scene Content</div>
      
      {/* OverlayUI */}
      <OverlayUI
        isVisible={isVisible}
        rooms={rooms}
        items={items}
        loadedItems={loadedItems}
        selectedRoomId={selectedRoom}
        onRoomChange={setSelectedRoom}
        onItemAdd={(item) => setLoadedItems(prev => [...prev, item])}
        onItemRemove={(id) => setLoadedItems(prev => prev.filter(item => item.id !== id))}
        onClearAllItems={() => setLoadedItems([])}
      />
    </div>
  );
}
```

## Props

### Visibility Control

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isVisible` | `boolean` | `true` | Controls overlay visibility |
| `onToggle` | `() => void` | - | Callback when toggle is requested |

### Position and Styling

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `object` | `{top: '70px', right: '20px'}` | CSS position properties |
| `className` | `string` | `''` | Additional CSS class |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles |

### Room Controls

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rooms` | `Room[]` | `[]` | Array of available rooms |
| `selectedRoomId` | `string` | `''` | Currently selected room ID |
| `onRoomChange` | `(roomId: string) => void` | - | Callback when room changes |

### Item Controls

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Item[]` | `[]` | Array of available items |
| `loadedItems` | `LoadedItem[]` | `[]` | Array of currently loaded items |
| `onItemAdd` | `(item: any) => void` | - | Callback when item is added |
| `onItemRemove` | `(itemId: string) => void` | - | Callback when item is removed |
| `onClearAllItems` | `() => void` | - | Callback when all items are cleared |

### UI Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showRoomControls` | `boolean` | `true` | Show/hide room controls section |
| `showItemControls` | `boolean` | `true` | Show/hide item controls section |
| `compactMode` | `boolean` | `false` | Enable compact layout |

### Custom Content

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Custom content to render inside overlay |

## Type Definitions

```tsx
interface Room {
  id: string;
  name: string;
  resourceId?: string;
}

interface Item {
  id: string;
  name: string;
  path: string;
  category: string;
  resourceId?: string;
}

interface LoadedItem {
  id: string;
  name: string;
  path: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}
```

## Advanced Usage

### Custom Positioning

```tsx
<OverlayUI
  position={{
    top: '100px',
    left: '20px',  // Position on left instead of right
    right: 'auto'
  }}
  // ... other props
/>
```

### Compact Mode

```tsx
<OverlayUI
  compactMode={true}
  style={{
    minWidth: '200px',
    maxWidth: '300px'
  }}
  // ... other props
/>
```

### Custom Content

```tsx
<OverlayUI
  // ... other props
>
  <div style={{ marginTop: '20px', padding: '15px', background: '#f0f8ff' }}>
    <h4>Custom Section</h4>
    <p>Add your custom controls here</p>
    <button onClick={handleCustomAction}>Custom Action</button>
  </div>
</OverlayUI>
```

### Integration with 3D Scene

```tsx
import { OverlayUI } from 'myroom-system';
import { Engine, Scene } from '@babylonjs/core';

function My3DApp() {
  const [scene, setScene] = useState(null);
  const [loadedItems, setLoadedItems] = useState([]);

  const handleItemAdd = async (item) => {
    if (!scene) return;
    
    // Load 3D model into Babylon.js scene
    const result = await SceneLoader.ImportMeshAsync('', item.path, '', scene);
    const mesh = result.meshes[0];
    
    // Add to loaded items state
    const newItem = {
      ...item,
      id: `${item.id}_${Date.now()}`,
      position: { x: 0, y: 0, z: 0 },
      babylonMesh: mesh  // Store reference to Babylon.js mesh
    };
    
    setLoadedItems(prev => [...prev, newItem]);
  };

  const handleItemRemove = (itemId) => {
    const item = loadedItems.find(item => item.id === itemId);
    if (item && item.babylonMesh) {
      item.babylonMesh.dispose();  // Remove from Babylon.js scene
    }
    setLoadedItems(prev => prev.filter(item => item.id !== itemId));
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Babylon.js canvas */}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      
      {/* OverlayUI */}
      <OverlayUI
        items={availableItems}
        loadedItems={loadedItems}
        onItemAdd={handleItemAdd}
        onItemRemove={handleItemRemove}
        onClearAllItems={() => {
          // Dispose all meshes
          loadedItems.forEach(item => {
            if (item.babylonMesh) item.babylonMesh.dispose();
          });
          setLoadedItems([]);
        }}
      />
    </div>
  );
}
```

## Styling

The component uses inline styles by default but can be customized:

```css
/* Custom CSS for OverlayUI */
.overlay-ui-integrated {
  /* Override default styles */
  backdrop-filter: blur(20px) !important;
  background: rgba(0, 0, 0, 0.8) !important;
  color: white !important;
}

.overlay-ui-integrated .item-category-btn:hover {
  background: #1890ff !important;
  color: white !important;
}
```

## Examples

See the complete example in `/src/examples/OverlayUIExample.tsx` for a full implementation.

## Features

- ✅ **Room Selection**: Dropdown to select different 3D rooms
- ✅ **Item Categories**: Organized item selection by categories
- ✅ **Item Management**: Add, remove, and clear items
- ✅ **Responsive Design**: Works on different screen sizes
- ✅ **Customizable**: Flexible styling and positioning
- ✅ **TypeScript Support**: Full type definitions included
- ✅ **Compact Mode**: Space-efficient layout option
- ✅ **Custom Content**: Extensible with children prop

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - see LICENSE file for details.