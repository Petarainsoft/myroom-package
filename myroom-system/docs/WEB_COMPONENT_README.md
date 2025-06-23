# MyRoom Web Component

A custom HTML element for integrating 3D avatar rooms into any website. Built with Babylon.js and React.

## ✨ Features

- 🎮 **3D Avatar Room** - Interactive 3D rooms with customizable avatars
- 🎨 **Avatar Customization** - Change gender, clothing, hairstyles
- 📱 **Responsive** - Works on all devices
- 🔧 **Easy Integration** - Just add one HTML tag
- ⚡ **High Performance** - Optimized with Babylon.js
- 🎯 **Event System** - Listen and handle events
- 🌐 **Cross-browser** - Supports all modern browsers

## 🚀 Installation

### CDN (Recommended)

```html
<script src="https://your-domain.com/myroom-webcomponent.es.js"></script>
```

### Local Development

```bash
# Install and build
npm install
npm run build:webcomponent
npm run preview
```
## 📖 Usage

### HTML Element

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://your-domain.com/myroom-webcomponent.es.js"></script>
</head>
<body>
  <my-room-scene 
    room="/models/rooms/cate001/MR_KHROOM_0001.glb"
    gender="female"
    width="800px"
    height="600px"
    autoplay="true"
    enable-controls="true"
    camera-controls="true"
    gizmo-mode="position">
  </my-room-scene>
</body>
</html>
```

### JavaScript API

```javascript
// Create component programmatically
const container = document.getElementById('my-container');

const scene = MyRoom.create(container, {
  room: '/models/rooms/cate001/MR_KHROOM_0001.glb',
  gender: 'male',
  width: '800px',
  height: '600px',
  autoplay: true,
  enableControls: true,
  
  // Event handlers
  onSceneReady: (event) => {
    console.log('Scene ready!', event.detail.scene);
  },
  onAvatarChanged: (event) => {
    console.log('Avatar changed:', event.detail.config);
  }
});

// Control methods
scene.resetCamera();
scene.changeAvatar({ gender: 'male' });

// Access Babylon.js objects
const babylonScene = scene.getScene();
const engine = scene.getEngine();
```

### Framework Integration

#### React

```jsx
import React, { useRef, useEffect } from 'react';

function MyComponent() {
  const containerRef = useRef();
  const sceneRef = useRef();
  
  useEffect(() => {
    if (containerRef.current && !sceneRef.current) {
      sceneRef.current = MyRoom.create(containerRef.current, {
        room: '/models/rooms/cate001/MR_KHROOM_0001.glb',
        gender: 'male',
        width: '100%',
        height: '400px',
        onSceneReady: (event) => console.log('Scene ready!')
      });
    }
    // Cleanup handled automatically
    return () => {};
  }, []);
  
  return (
    <div>
      <h1>My 3D Scene</h1>
      <div ref={containerRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
}
```

#### Vue

```vue
<template>
  <div>
    <h1>My 3D Scene</h1>
    <div ref="container" style="width: 100%; height: 400px;"></div>
  </div>
</template>

<script>
export default {
  mounted() {
    this.scene = MyRoom.create(this.$refs.container, {
      room: '/models/rooms/cate001/MR_KHROOM_0001.glb',
      gender: 'female',
      width: '100%',
      height: '400px'
    });
  }
  // Cleanup handled automatically
}
</script>
```

## 🔧 Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `room` | string | `/models/rooms/cate001/MR_KHROOM_0001.glb` | Path to 3D room model |
| `gender` | `male` \| `female` | `female` | Avatar gender |
| `width` | string | `800px` | Component width |
| `height` | string | `600px` | Component height |
| `autoplay` | boolean | `true` | Auto-start scene |
| `avatar-config` | string (JSON) | auto | Detailed avatar configuration |
| `loaded-items` | string (JSON) | `[]` | List of items to load |
| `enable-controls` | boolean | `true` | Show controls UI |
| `camera-controls` | boolean | `true` | Enable camera controls |
| `gizmo-mode` | `position` \| `rotation` \| `scale` | `position` | Gizmo mode for manipulation |

## 📡 Events

```javascript
// Scene loaded and ready
scene.addEventListener('scene-ready', (event) => {
  const { scene, engine } = event.detail;
  console.log('Scene ready:', scene);
});

// Avatar configuration changed
scene.addEventListener('avatar-changed', (event) => {
  const { config } = event.detail;
  console.log('New avatar config:', config);
});

// Item selected in scene
scene.addEventListener('item-selected', (event) => {
  const { item } = event.detail;
  console.log('Selected item:', item);
});

// Camera position changed
scene.addEventListener('camera-moved', (event) => {
  const { position, target } = event.detail;
  console.log('Camera moved:', position, target);
});

// Error occurred
scene.addEventListener('error', (event) => {
  const { message, error } = event.detail;
  console.error('Scene error:', message, error);
});
```

## 🎮 API Methods

```javascript
// Reset camera to default position
scene.resetCamera();

// Change avatar configuration
scene.changeAvatar({
  gender: 'male',
  parts: {
    body: '/models/male/body.glb',
    hair: '/models/male/hair1.glb',
    top: '/models/male/shirt1.glb'
  }
});

// Load items into scene
scene.loadItems([
  {
    id: 'chair1',
    path: '/models/items/chair.glb',
    position: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'table1', 
    path: '/models/items/table.glb',
    position: { x: 2, y: 0, z: 0 }
  }
]);

// Get Babylon.js Scene object
const babylonScene = scene.getScene();
babylonScene.registerBeforeRender(() => {
  // Custom render logic
});

// Get Babylon.js Engine object
const engine = scene.getEngine();
console.log('Engine info:', engine.getInfo());
```

## 🎨 Customization

### Avatar Configuration

```javascript
const avatarConfig = {
  gender: 'female',
  parts: {
    body: '/models/female/body.glb',
    hair: '/models/female/hair2.glb',
    top: '/models/female/dress1.glb',
    bottom: '/models/female/pants1.glb',
    shoes: '/models/female/shoes1.glb'
  }
};

// Use in HTML
const configStr = JSON.stringify(avatarConfig);
document.querySelector('my-room-scene')
  .setAttribute('avatar-config', configStr);

// Or via API
scene.changeAvatar(avatarConfig);
```

### CSS Styling

```css
/* Custom size */
my-room-scene {
  width: 100vw;
  height: 100vh;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

/* Responsive */
@media (max-width: 768px) {
  my-room-scene {
    width: 100%;
    height: 300px;
  }
}
```

## 🔧 Development

```bash
# Development
npm run dev

# Build for production
npm run build:webcomponent

# Preview build
npm run preview

# Test demo
open http://localhost:5173/webcomponent-demo.html
```

<!-- ## 🌐 Browser Support

- ✅ Chrome 54+, Firefox 63+, Safari 10.1+, Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📦 Bundle Size

- **Gzipped**: ~500KB (includes Babylon.js core)
- **Uncompressed**: ~2MB
- **Dependencies**: React, Babylon.js, loaders

## 📄 License & Support

- **License**: MIT License
- **Email**: support@example.com
- **Documentation**: [Full docs](https://docs.example.com)
- **Issues**: [GitHub Issues](https://github.com/example/issues) -->

---