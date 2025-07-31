# MyRoom System - React Integration Guide

Hướng dẫn tích hợp MyRoom System vào dự án React và Next.js của bạn.

## Cài đặt

```bash
npm install myroom-system
# hoặc
yarn add myroom-system
```

## Peer Dependencies

Đảm bảo bạn đã cài đặt React 18+:

```bash
npm install react react-dom
```

## Cấu hình Backend

MyRoom System cần kết nối với backend API để lấy dữ liệu. Đảm bảo backend của bạn đang chạy và có thể truy cập được.

### Cấu hình API

```javascript
// Tạo file config/myroom.config.js
export const myroomConfig = {
  backendDomain: 'http://localhost:3579', // URL backend của bạn
  apiKey: 'your-api-key-here', // API key từ backend
  projectId: 'your-project-id' // Project ID (tùy chọn)
};
```

## Sử dụng với React

### Cách sử dụng cơ bản

```jsx
import React from 'react';
import { MyRoom } from 'myroom-system';

function App() {
  const handleSceneReady = (scene) => {
    console.log('3D Scene đã sẵn sàng:', scene);
  };

  const handleAvatarChange = (avatarConfig) => {
    console.log('Avatar đã thay đổi:', avatarConfig);
  };

  const handleRoomChange = (roomId) => {
    console.log('Phòng đã thay đổi:', roomId);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MyRoom
        // Cấu hình backend
        apiEndpoint="http://localhost:3579"
        
        // Cấu hình phòng
        roomConfig={{
          defaultRoom: 'living-room',
          enableRoomSwitching: true
        }}
        
        // Cấu hình avatar
        avatarConfig={{
          defaultGender: 'male',
          enableCustomization: true,
          enableMovement: true
        }}
        
        // Cấu hình UI
        showControls={true}
        compactMode={false}
        
        // Event callbacks
        onSceneReady={handleSceneReady}
        onAvatarChange={handleAvatarChange}
        onRoomChange={handleRoomChange}
        onError={(error) => console.error('MyRoom Error:', error)}
        
        // Style
        className="myroom-container"
        style={{ border: '1px solid #ccc' }}
      />
    </div>
  );
}

export default App;
```

### Sử dụng với Hooks

```jsx
import React from 'react';
import { MyRoom, useMyRoom, useAvatar } from 'myroom-system';

function AdvancedApp() {
  const { scene, isReady, changeRoom, updateAvatar } = useMyRoom();
  const { config: avatarConfig, updateConfig } = useAvatar();

  const handleChangeGender = (gender) => {
    updateConfig({ defaultGender: gender });
  };

  const handleChangeRoom = (roomId) => {
    changeRoom(roomId);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MyRoom
        apiEndpoint="http://localhost:3579"
        roomConfig={{ defaultRoom: 'living-room' }}
        avatarConfig={{ defaultGender: 'male' }}
      />
      
      {/* Custom Controls */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
        <button onClick={() => handleChangeGender('male')}>Nam</button>
        <button onClick={() => handleChangeGender('female')}>Nữ</button>
        <button onClick={() => handleChangeRoom('bedroom')}>Phòng ngủ</button>
        <button onClick={() => handleChangeRoom('living-room')}>Phòng khách</button>
      </div>
      
      {/* Status */}
      <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
        Status: {isReady ? 'Sẵn sàng' : 'Đang tải...'}
      </div>
    </div>
  );
}

export default AdvancedApp;
```

## Sử dụng với Next.js

### SSR Compatible

```jsx
// pages/myroom.js hoặc app/myroom/page.js
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamic import để tránh SSR issues
const MyRoom = dynamic(
  () => import('myroom-system').then(mod => mod.MyRoom),
  { 
    ssr: false,
    loading: () => <div>Đang tải 3D Scene...</div>
  }
);

export default function MyRoomPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MyRoom
        apiEndpoint={process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3579'}
        roomConfig={{
          defaultRoom: 'living-room',
          enableRoomSwitching: true
        }}
        avatarConfig={{
          defaultGender: 'male',
          enableCustomization: true
        }}
        onSceneReady={() => setIsLoaded(true)}
        onError={(error) => console.error('MyRoom Error:', error)}
      />
      
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div>Đang tải MyRoom System...</div>
        </div>
      )}
    </div>
  );
}
```

### Với App Router (Next.js 13+)

```jsx
// app/myroom/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const MyRoom = dynamic(
  () => import('myroom-system').then(mod => mod.MyRoom),
  { ssr: false }
);

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-lg">Đang tải MyRoom System...</p>
      </div>
    </div>
  );
}

export default function MyRoomPage() {
  return (
    <div className="w-screen h-screen">
      <Suspense fallback={<LoadingFallback />}>
        <MyRoom
          apiEndpoint={process.env.NEXT_PUBLIC_BACKEND_URL}
          roomConfig={{
            defaultRoom: 'living-room',
            enableRoomSwitching: true
          }}
          avatarConfig={{
            defaultGender: 'male',
            enableCustomization: true,
            enableMovement: true
          }}
          showControls={true}
          onError={(error) => {
            console.error('MyRoom Error:', error);
            // Có thể gửi error lên monitoring service
          }}
        />
      </Suspense>
    </div>
  );
}
```

## Cấu hình Environment Variables

### .env.local (Next.js)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3579
NEXT_PUBLIC_MYROOM_API_KEY=your-api-key-here
NEXT_PUBLIC_MYROOM_PROJECT_ID=your-project-id
```

### .env (React)

```env
REACT_APP_BACKEND_URL=http://localhost:3579
REACT_APP_MYROOM_API_KEY=your-api-key-here
REACT_APP_MYROOM_PROJECT_ID=your-project-id
```

## API Props

### MyRoom Component Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `apiEndpoint` | string | required | URL backend API |
| `roomConfig` | RoomConfig | {} | Cấu hình phòng |
| `avatarConfig` | AvatarConfig | {} | Cấu hình avatar |
| `sceneConfig` | SceneConfig | {} | Cấu hình 3D scene |
| `showControls` | boolean | true | Hiển thị controls |
| `compactMode` | boolean | false | Chế độ compact |
| `ultraCompactMode` | boolean | false | Chế độ ultra compact |
| `enableDebug` | boolean | false | Bật debug mode |
| `onSceneReady` | function | null | Callback khi scene sẵn sàng |
| `onAvatarChange` | function | null | Callback khi avatar thay đổi |
| `onRoomChange` | function | null | Callback khi phòng thay đổi |
| `onItemAdd` | function | null | Callback khi thêm item |
| `onItemRemove` | function | null | Callback khi xóa item |
| `onError` | function | null | Callback khi có lỗi |

### RoomConfig

```typescript
interface RoomConfig {
  defaultRoom?: string;
  availableRooms?: string[];
  autoLoad?: boolean;
  enableRoomSwitching?: boolean;
  roomAssetPath?: string;
}
```

### AvatarConfig

```typescript
interface AvatarConfig {
  defaultGender?: 'male' | 'female';
  enableCustomization?: boolean;
  enableMovement?: boolean;
  enableAnimations?: boolean;
  avatarAssetPath?: string;
}
```

## Troubleshooting

### Lỗi thường gặp

1. **"Cannot resolve module 'myroom-system'"**
   - Đảm bảo đã cài đặt package: `npm install myroom-system`

2. **"WebGL not supported"**
   - Kiểm tra browser có hỗ trợ WebGL không
   - Thử trên browser khác

3. **"API connection failed"**
   - Kiểm tra backend có đang chạy không
   - Kiểm tra URL và API key
   - Kiểm tra CORS settings

4. **Next.js SSR errors**
   - Sử dụng dynamic import với `ssr: false`
   - Wrap component trong `Suspense`

### Performance Tips

1. **Lazy Loading**: Sử dụng dynamic import cho Next.js
2. **Memory Management**: Cleanup scene khi component unmount
3. **Asset Optimization**: Optimize 3D models và textures
4. **API Caching**: Cache API responses khi có thể

## Ví dụ hoàn chỉnh

Xem thêm ví dụ trong thư mục `/examples` của package.

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console logs
2. Kiểm tra network requests
3. Tạo issue trên GitHub repository