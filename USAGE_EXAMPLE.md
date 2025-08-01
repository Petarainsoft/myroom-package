# Quick Usage Examples

## 1. Basic React Integration

### Installation
```bash
npm install @petarain/myroom-system
```

### Basic React Component
```jsx
// App.jsx
import React from 'react';
import { MyRoom } from '@petarain/myroom-system';

function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MyRoom 
        apiKey="your-api-key-here"
        userId="user-123"
      />
    </div>
  );
}

export default App;
```

## 2. Next.js Integration

### Installation
```bash
npm install @petarain/myroom-system
```

### Next.js Page (App Router)
```jsx
// app/page.tsx
import dynamic from 'next/dynamic';

const MyRoom = dynamic(
  () => import('@petarain/myroom-system').then(mod => mod.MyRoom),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main style={{ width: '100%', height: '100vh' }}>
      <MyRoom 
        apiKey="your-api-key-here"
        userId="user-123"
        presetId="modern-living"
      />
    </main>
  );
}
```

### Next.js Page (Pages Router)
```jsx
// pages/index.jsx
import dynamic from 'next/dynamic';

const MyRoom = dynamic(
  () => import('@petarain/myroom-system').then(mod => mod.MyRoom),
  { ssr: false }
);

export default function HomePage() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MyRoom 
        apiKey="your-api-key-here"
        userId="user-123"
      />
    </div>
  );
}
```

## 3. TypeScript Support

```tsx
import React from 'react';
import { MyRoom, MyRoomProps } from '@petarain/myroom-system';

interface RoomConfig extends MyRoomProps {
  theme?: string;
}

const RoomDesigner: React.FC<RoomConfig> = ({ 
  apiKey, 
  userId, 
  theme = 'modern' 
}) => {
  const handleSave = (data: any) => {
    console.log('Room saved:', data);
  };

  return (
    <MyRoom
      apiKey={apiKey}
      userId={userId}
      onSave={handleSave}
      showUI={true}
    />
  );
};

export default RoomDesigner;
```

## 4. CDN Usage (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <title>MyRoom System</title>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@petarain/myroom-system/myroom-system.es.js"></script>
</head>
<body>
  <my-room-system
    api-key="your-api-key-here"
    user-id="user-123"
    style="width: 100%; height: 100vh; display: block;"
  ></my-room-system>
</body>
</html>
```

## 5. Advanced Configuration

```jsx
import React, { useRef } from 'react';
import { MyRoom } from '@petarain/myroom-system';

function AdvancedRoom() {
  const roomRef = useRef(null);

  const handleSceneReady = (scene) => {
    // Custom scene initialization
    console.log('Scene ready:', scene);
  };

  const handleSave = (roomData) => {
    // Send to your backend
    fetch('/api/save-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData)
    });
  };

  return (
    <MyRoom
      ref={roomRef}
      apiKey="your-api-key-here"
      userId="user-123"
      roomId="room-456"
      onSceneReady={handleSceneReady}
      onSave={handleSave}
      showUI={true}
      enableVR={false}
    />
  );
}
```

## Getting Started Checklist

- [ ] Get your API key from the MyRoom dashboard
- [ ] Install the package: `npm install @petarain/myroom-system`
- [ ] Choose your integration method (React/Next.js/HTML)
- [ ] Set up your user authentication system
- [ ] Configure your room presets and items
- [ ] Test the integration
- [ ] Deploy to production

## Need Help?

- 📖 [Full Documentation](https://github.com/Petarainsoft/myroom-package)
- 🐛 [Report Issues](https://github.com/Petarainsoft/myroom-package/issues)
- 💬 [Discord Community](https://discord.gg/myroom-system)