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
  src="/embed.html?room=/models/rooms/cate001/MR_KHROOM_0001.glb&gender=female&autoplay=true" 
  width="800" 
  height="600" 
  frameborder="0"
  style="border: none; border-radius: 8px;">
</iframe>
```

**Key Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `room` | `/models/rooms/cate001/MR_KHROOM_0001.glb` | Full path to 3D room model |
| `gender` | `female` | Avatar gender (`male`/`female`) |
| `autoplay` | `true` | Auto start scene |
| `width` | Not used in URL | Set via iframe width attribute |
| `height` | Not used in URL | Set via iframe height attribute |
| `controls` | `true` | Show UI controls |
| `camera` | `true` | Enable camera controls |

**Communication API (JavaScript):**

```javascript
// Listen for iframe ready event
window.addEventListener('message', (event) => {
  if (event.data.type === 'MYROOM_EMBED_READY') {
    console.log('3D Scene is ready!', event.data);
    // Scene is now ready for interaction
  }
});

// The iframe automatically displays embed parameters
// Parameters are shown in the info panel for 5 seconds
```

**Iframe Features:**
- Automatic parameter display in info panel
- Responsive fullscreen design
- Loading indicator
- Auto-hide info panel after 5 seconds
- Parent-child communication via postMessage

### 4.2. Web Component

This method uses a custom HTML element (`<my-room-scene>`) for modern and easy integration. It's built with Babylon.js and React.

**Installation:**

For local development:
```html
<script src="http://localhost:5173/dist/myroom-webcomponent.umd.js"></script>
```

For production (CDN):
```html
<script src="https://myroom.petarainsoft.com/dist/myroom-webcomponent.umd.js"></script>
```

**Example HTML Usage:**

```html
<my-room-scene 
  id="mainScene"
  room="/models/rooms/cate001/MR_KHROOM_0001.glb"
  gender="female"
  width="100%"
  height="600px"
  enable-controls="true"
  camera-controls="true"
  gizmo-mode="position">
</my-room-scene>
```

**Key Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | string | - | Unique identifier for the component |
| `room` | string | `/models/rooms/cate001/MR_KHROOM_0001.glb` | Path to 3D room model |
| `gender` | `male` \| `female` | `female` | Avatar gender |
| `width` | string | `100%` | Component width (supports %, px) |
| `height` | string | `600px` | Component height (supports %, px) |
| `avatar-config` | string (JSON) | auto | Detailed avatar configuration |
| `loaded-items` | string (JSON) | `[]` | List of items to load |
| `enable-controls` | boolean | `true` | Show controls UI |
| `camera-controls` | boolean | `true` | Enable camera controls |
| `gizmo-mode` | `position` \| `rotation` \| `scale` | `position` | Gizmo mode for manipulation |

**JavaScript API (Programmatic Control):**

```javascript
// Get reference to the web component
const mainScene = document.getElementById('mainScene');

// Control Methods
mainScene.changeAvatar(avatarConfig);       // Change avatar configuration
mainScene.loadItems(itemsArray);           // Load items into scene
mainScene.setAttribute('gender', 'male');   // Change gender

```

**Events:**

```javascript
// Scene Events
mainScene.addEventListener('scene-ready', (e) => {
  console.log('Scene loaded:', e.detail.scene);
  console.log('Engine available:', e.detail.engine);
});

mainScene.addEventListener('error', (e) => {
  console.log('Error occurred:', e.detail.message);
});

// Avatar Events
mainScene.addEventListener('avatar-changed', (e) => {
  console.log('Avatar changed:', e.detail.config);
});


// Item Events
mainScene.addEventListener('item-selected', (e) => {
  console.log('Item selected:', e.detail.item);
});
```

**Available Events:**
- `scene-ready`: Fired when the 3D scene is loaded and ready
- `avatar-changed`: Fired when the avatar configuration changes
- `item-selected`: Fired when an item in the scene is selected
- `error`: Fired when an error occurs

### 4.3. Practical Examples

**Multiple Scenes:**

```html
<!-- Scene 1 - Kitchen with Male Avatar -->
<my-room-scene 
  id="scene1"
  room="/models/rooms/cate001/MR_KHROOM_0001.glb"
  gender="male"
  width="100%"
  height="300px"
  enable-controls="true">
</my-room-scene>

<!-- Scene 2 - Bedroom with Female Avatar -->
<my-room-scene 
  id="scene2"
  room="/models/rooms/cate002/MR_BEDROOM_0001.glb"
  gender="female"
  width="100%"
  height="300px"
  enable-controls="true">
</my-room-scene>
```

**Pre-loaded Items:**

```html
<my-room-scene 
  room="/models/rooms/cate001/MR_KHROOM_0001.glb"
  gender="male"
  loaded-items='[{"id":"item1","path":"/models/items/chair.glb","position":{"x":0,"y":0,"z":2}}]'
  width="100%"
  height="400px">
</my-room-scene>
```

**Custom Avatar Configuration:**

```html
<my-room-scene 
  avatar-config='{"hair":"style1","top":"shirt2","bottom":"pants1","shoes":"sneakers"}'
  gender="female"
  width="100%"
  height="400px">
</my-room-scene>
```

## 5. Security and Mobile Support

- **Security**: Use HTTPS, validate parameters, implement rate limiting, and use CSP headers in production.
- **Mobile Support**: Compatible with iOS Safari 12+, Chrome Mobile 70+, Samsung Internet 10+, Firefox Mobile 68+.

## 6. Development

For local development and building:

- `npm install`: Install dependencies
- `npm run dev`: Start development server (http://localhost:5173)
- `npm run build:webcomponent`: Build web component for production
- `npm run preview`: Preview the build

**Demo Files:**

- `iframe-demo.html`: Complete iframe integration demo
- `webcomponent-demo-fullapi.html`: Full web component API demonstration
- `embed.html`: Iframe embed page with parameter display

**Local Development URLs:**

- Main app: `http://localhost:5173/`
- Iframe demo: `http://localhost:5173/iframe-demo.html`
- Web component demo: `http://localhost:5173/webcomponent-demo-fullapi.html`
- Embed page: `http://localhost:5173/embed.html`

**Build Output:**

- Web component: `dist/myroom-webcomponent.umd.js`
- Ready for CDN deployment or local hosting
