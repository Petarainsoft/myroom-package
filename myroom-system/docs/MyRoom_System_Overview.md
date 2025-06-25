# MyRoom System Overview

This document provides a summary of the MyRoom System, a 3D room and avatar integration solution for websites. It briefly covers key features, used technology, and integration methods.

## 1. Introduction

MyRoom System allows users to customize and interact with 3D environments directly in their web browser. It offers seamless embedding of 3D rooms and avatars into any website.

## 2. Key Features

- **Interactive 3D Rooms**: Engage with 3D environments and items.
- **Personalized Avatar Customization**: Create and customize avatars, including gender, clothing, and hairstyles, polish with accessories.
- **Multiple Integration Options**: Supports various methods for embedding.

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
  src="https://myroom.petarainsoft.com/embed.html?room=/models/rooms/cate001/MR_KHROOM_0001.glb&gender=male" 
  width="800" 
  height="600" 
  frameborder="0"
  style="border: none; border-radius: 8px;"
  allow="fullscreen">
</iframe>
```

**Key Parameters:**


| Parameter  | Default                                    | Description                     |
| ------------ | -------------------------------------------- | --------------------------------- |
| `room`     | `/models/rooms/cate001/MR_KHROOM_0001.glb` | Full path to 3D room model      |
| `gender`   | `female`                                   | Avatar gender (`male`/`female`) |
| `autoplay` | `true`                                     | Auto start scene                |
| `width`    | Not used in URL                            | Set via iframe width attribute  |
| `height`   | Not used in URL                            | Set via iframe height attribute |

### 4.2. Web Component

This method uses a custom HTML element (`<my-room-scene>`) for modern and easy integration. It's built with Babylon.js and React.

**Installation:**

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
  height="600px">
</my-room-scene>
```

**Key Props:**


| Prop     | Description                         | Example                                                                                                                                |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `id`     | Unique identifier for the component | `mainScene`                                                                                                                            |
| `room`   | Path to the room model              | `/models/rooms/cate001/MR_KHROOM_0001.glb`<br>`/models/rooms/cate001/MR_KHROOM_0002.glb`<br>`/models/rooms/cate002/MR_KHROOM_0001.glb` |
| `gender` | Avatar gender (`male` / `female`)   | `female`                                                                                                                               |
| `width`  | Component width                     | `100%`                                                                                                                                 |
| `height` | Component height                    | `600px`                                                                                                                                |

**JavaScript API (Programmatic Control):**

```javascript
// Get reference to the component
const mainScene = document.getElementById('mainScene');

// Change avatar gender
mainScene.setAttribute('gender', 'male');
// or
mainScene.setAttribute('gender', 'female');

// Change room
mainScene.setAttribute('room', '/models/rooms/cate002/MR_BEDROOM_0001.glb');

// Customize avatar with detailed configuration
const avatarConfig = {
  "gender": "male",
  "parts": {
    "body": "/models/male/male_body/male_body.glb",
    "hair": "/models/male/male_hair/male_hair_001.glb",
    "fullset": "/models/male/male_fullset/male_fullset_003.glb"
  }
};
if (mainScene && mainScene.changeAvatar) {
  mainScene.changeAvatar(avatarConfig);
}

// Add items to the scene
const items = [{
  "id": "item_001",
  "name": "Chair",
  "path": "/models/items/catelv1_01/catelv2_01/catelv3_01/MR_CHAIR_0001.glb",
  "position": { "x": 0.37, "y": 0, "z": -0.67 },
  "rotation": { "x": 0, "y": 0, "z": 0 },
  "scale": { "x": 1, "y": 1, "z": 1 }
}];
if (mainScene && mainScene.loadItems) {
  mainScene.loadItems(items);
}

// Camera controls
if (mainScene && mainScene.resetCamera) {
  mainScene.resetCamera();
}

// Listen for events
mainScene.addEventListener('scene-ready', (event) => {
  console.log('Scene loaded:', event.detail.scene);
});

mainScene.addEventListener('avatar-changed', (event) => {
  console.log('Avatar changed:', event.detail);
});

mainScene.addEventListener('item-selected', (event) => {
  console.log('Item selected:', event.detail.item);
});

```

**Available Events:**

- `scene-ready`: Fired when the 3D scene is loaded and ready
- `avatar-changed`: Fired when the avatar configuration changes
- `item-selected`: Fired when an item in the scene is selected
- `error`: Fired when an error occurs

**Demo Pages:**

- `iframe-demo.html`: Complete iframe integration demo
- `webcomponent-simple-demo.html`: Full web component API demonstration
