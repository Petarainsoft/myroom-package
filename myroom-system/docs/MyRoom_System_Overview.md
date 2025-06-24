# MyRoom System Overview

This document provides a summary of the MyRoom System, a 3D room and avatar integration solution for websites. It covers key features, underlying technology, and integration methods.

## 1. Introduction

MyRoom System allows users to customize and interact with 3D environments directly in their web browser. It offers seamless embedding of 3D rooms and avatars into any website.

## 2. Key Features

- **Interactive 3D Rooms**: Engage with 3D environments and items.
- **Personalized Avatar Customization**: Create and customize avatars, including gender, clothing, and hairstyles.
- **Multiple Integration Options**: Supports various methods for embedding.
- **Responsive Design**: Works well on all devices.
- **High Performance**: Optimized with Babylon.js for smooth experiences.
- **Event System**: Provides events for interaction and control.
- **Cross-browser Compatibility**: Supports modern web browsers.

## 3. Technology Stack

MyRoom Service is built using modern web technologies:

- **Babylon.js**: For 3D rendering and scene management.
- **TypeScript**: For type-safe and scalable code.
- **React**: For building interactive user interfaces.
- **Vite**: As a fast build tool and development server.

## 4. Integration Methods

MyRoom System offers flexible integration options:

### 4.1. Embed Service (iframe)

This is a simple method for quick embedding using an `<iframe>` tag. It's ideal for basic integration with minimal setup.

**Example HTML:**

```html
<iframe 
  src="https://myroom.petarainsoft.com/embed-demo.html?room=cate001&gender=female&width=800&height=600" 
  width="800" 
  height="600" 
  frameborder="0">
</iframe>
```

**Key Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `room` | `cate001` | Room model ID |
| `gender` | `female` | Avatar gender (`male`/`female`) |
| `width` | `800px` | Container width |
| `height` | `600px` | Container height |
| `autoplay` | `true` | Auto start scene |
| `controls` | `true` | Show UI controls |
| `camera` | `true` | Enable camera controls |

**Communication API (JavaScript):**

- **Send Messages**: Use `postMessage` to control the iframe (e.g., `changeAvatar`, `resetCamera`).
- **Listen to Events**: Add `message` event listener to `window` to receive events like `sceneReady` and `avatarChanged`.

### 4.2. Web Component

This method uses a custom HTML element (`<my-room-scene>`) for modern and easy integration. It's built with Babylon.js and React.

**Installation (CDN Recommended):**

```html
<script src="https://myroom.petarainsoft.com/dist/myroom-webcomponent.umd.js"></script>
```

**Example HTML Usage:**

```html
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
```

**Key Attributes:**

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

**JavaScript API (Programmatic Control):**

- **Create Component**: Use `MyRoom.create(container, options)` to programmatically create and configure the component.
- **Control Methods**: Access methods like `resetCamera()`, `changeAvatar()`, `loadItems()`.
- **Access Babylon.js Objects**: Get the underlying Babylon.js `Scene` and `Engine` objects.

**Events:**

- `scene-ready`: Fired when the 3D scene is loaded and ready.
- `avatar-changed`: Fired when the avatar configuration changes.
- `item-selected`: Fired when an item in the scene is selected.
- `camera-moved`: Fired when the camera position changes.
- `error`: Fired when an error occurs.

### 4.3. JavaScript API (Advanced)

This method provides advanced integration with full control over the MyRoom instance.

**Example JavaScript:**

```javascript
MyRoom.create({
  container: '#myroom-container',
  room: 'cate001',
  gender: 'female',
  width: 800,
  height: 600,
  onReady: function(scene) {
    console.log('MyRoom ready!', scene);
  }
});
```

## 5. Security and Mobile Support

- **Security**: Use HTTPS, validate parameters, implement rate limiting, and use CSP headers in production.
- **Mobile Support**: Compatible with iOS Safari 12+, Chrome Mobile 70+, Samsung Internet 10+, Firefox Mobile 68+.

## 6. Development

For local development and building:

- `npm install`: Install dependencies.
- `npm run dev`: Start development server.
- `npm run build:webcomponent`: Build for production.
- `npm run preview`: Preview the build.
