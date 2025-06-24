# MyRoom Web Component Props Documentation

## Overview

This document provides a comprehensive guide to the props available for the `<my-room-scene>` web component, including their descriptions, data types, default values, and usage examples.

## Component Props

### Core Props

#### `room`
- **Type**: `string`
- **Default**: `'bedroom'`
- **Description**: Specifies which 3D room environment to load. Available options include bedroom, living room, kitchen, etc.
- **Example**: `<my-room-scene room="living-room"></my-room-scene>`

#### `gender`
- **Type**: `'male' | 'female'`
- **Default**: `'female'`
- **Description**: Determines the gender of the avatar to be displayed in the scene.
- **Example**: `<my-room-scene gender="male"></my-room-scene>`

### Display Configuration

#### `width`
- **Type**: `string`
- **Default**: `'800px'`
- **Description**: Sets the width of the 3D scene canvas.
- **Example**: `<my-room-scene width="1200px"></my-room-scene>`

#### `height`
- **Type**: `string`
- **Default**: `'600px'`
- **Description**: Sets the height of the 3D scene canvas.
- **Example**: `<my-room-scene height="800px"></my-room-scene>`

### Behavior Configuration

#### `autoplay`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Controls whether animations start automatically when the scene loads.
- **Example**: `<my-room-scene autoplay="false"></my-room-scene>`

#### `enable-controls`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Shows or hides the avatar customization controls panel.
- **Example**: `<my-room-scene enable-controls="false"></my-room-scene>`

#### `camera-controls`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enables or disables camera movement controls (zoom, pan, rotate).
- **Example**: `<my-room-scene camera-controls="false"></my-room-scene>`

#### `gizmo-mode`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enables 3D manipulation gizmos for advanced object positioning.
- **Example**: `<my-room-scene gizmo-mode="true"></my-room-scene>`

### Advanced Configuration

#### `avatar-config`
- **Type**: `string` (JSON)
- **Default**: Auto-generated based on gender
- **Description**: JSON string containing detailed avatar configuration including clothing, accessories, and appearance settings.
- **Example**: 
```html
<my-room-scene avatar-config='{"hair":"style1","top":"shirt1","bottom":"pants1"}'></my-room-scene>
```

#### `loaded-items`
- **Type**: `string` (JSON)
- **Default**: `'[]'`
- **Description**: JSON array of items to be pre-loaded in the scene.
- **Example**: 
```html
<my-room-scene loaded-items='[{"id":"chair1","position":{"x":0,"y":0,"z":0}}]'></my-room-scene>
```

## Implementation Logic

### Props Definition
The props are defined through several key interfaces:

- **`MyRoomComponentAttributes`**: Defines the HTML attributes interface
- **`observedAttributes`**: Static array listing all attributes that trigger change callbacks
- **`getReactProps()`**: Method that parses HTML attributes and converts them to React props
- **`attributeChangedCallback()`**: Handles attribute changes and updates the component accordingly

### Attribute Processing Flow

1. **HTML Attributes**: Props are set as HTML attributes on the web component
2. **Observation**: Changes are detected through `observedAttributes`
3. **Parsing**: `getReactProps()` converts string attributes to appropriate data types
4. **React Integration**: Parsed props are passed to the underlying React component
5. **Re-rendering**: Component updates when props change

## Events

The web component dispatches the following custom events:

### `scene-ready`
- **Description**: Fired when the 3D scene has finished loading
- **Detail**: Scene and engine references

### `avatar-changed`
- **Description**: Fired when avatar configuration changes
- **Detail**: New avatar configuration object

### `item-selected`
- **Description**: Fired when a 3D item is selected in the scene
- **Detail**: Selected item information

### `camera-moved`
- **Description**: Fired when camera position or rotation changes
- **Detail**: Camera position and rotation data

### `error`
- **Description**: Fired when an error occurs during scene loading or operation
- **Detail**: Error message and context

## Usage Examples

### Basic HTML Usage
```html
<!DOCTYPE html>
<html>
<head>
    <script src="./dist/webcomponent.js"></script>
</head>
<body>
    <my-room-scene 
        room="bedroom"
        gender="female"
        width="1000px"
        height="700px"
        enable-controls="true">
    </my-room-scene>
</body>
</html>
```

### JavaScript API Usage
```javascript
// Create component programmatically
const scene = MyRoom.create({
    room: 'living-room',
    gender: 'male',
    width: '1200px',
    height: '800px',
    avatarConfig: {
        hair: 'style2',
        top: 'hoodie1',
        bottom: 'jeans1'
    },
    onSceneReady: (event) => {
        console.log('Scene loaded:', event.detail);
    },
    onAvatarChanged: (event) => {
        console.log('Avatar updated:', event.detail);
    }
});

// Append to DOM
document.body.appendChild(scene);
```

### Event Handling
```javascript
const sceneElement = document.querySelector('my-room-scene');

sceneElement.addEventListener('scene-ready', (event) => {
    console.log('Scene is ready!');
});

sceneElement.addEventListener('avatar-changed', (event) => {
    console.log('Avatar changed:', event.detail);
});

sceneElement.addEventListener('error', (event) => {
    console.error('Scene error:', event.detail);
});
```

## Public API Methods

The web component also exposes several public methods:

- **`resetCamera()`**: Resets camera to default position
- **`changeAvatar(config)`**: Programmatically change avatar configuration
- **`loadItems(items)`**: Load new items into the scene
- **`getScene()`**: Get reference to Babylon.js scene
- **`getEngine()`**: Get reference to Babylon.js engine

## File Locations

- **Main Component**: `src/components/MyRoomWebComponent.ts`
- **API Interface**: `src/apps/webcomponent/index.ts`
- **Type Definitions**: `src/shared/types/AvatarTypes.ts`
- **Default Configurations**: `src/shared/data/avatarPartsData.ts`

This documentation provides a complete reference for integrating and customizing the MyRoom web component in any web application.