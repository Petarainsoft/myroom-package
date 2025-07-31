import React, { useState } from 'react';
import { X, Copy, ExternalLink, Book, Code, Zap, Settings, Users, Home } from 'lucide-react';
import { toast } from 'sonner';

interface GettingStartedProps {
  onClose: () => void;
}

const GettingStarted: React.FC<GettingStartedProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'installation', label: 'Installation', icon: Settings },
    { id: 'basic', label: 'Basic Integration', icon: Code },
    { id: 'advanced', label: 'Advanced Features', icon: Zap },
    { id: 'api', label: 'API Reference', icon: ExternalLink },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Welcome to MyRoom System</h3>
              <p className="text-gray-600 mb-4">
                MyRoom System is a powerful 3D library that allows you to integrate interactive 3D rooms and avatar systems into your web applications.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Home className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">Interactive 3D Rooms</h4>
                  <p className="text-sm text-gray-600">Explore beautifully designed 3D rooms with high interactivity.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <Users className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">Custom Avatars</h4>
                  <p className="text-sm text-gray-600">Create and customize avatars with diverse options.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <Settings className="w-8 h-8 text-purple-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">Dynamic Items</h4>
                  <p className="text-sm text-gray-600">Add and remove furniture to personalize your rooms.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">✅ Easy integration with React/Next.js</li>
                <li className="flex items-center">✅ Full TypeScript support</li>
                <li className="flex items-center">✅ Powerful backend API</li>
                <li className="flex items-center">✅ Performance optimized</li>
                <li className="flex items-center">✅ Responsive design</li>
                <li className="flex items-center">✅ SSR support</li>
              </ul>
            </div>
          </div>
        );

      case 'installation':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Installing MyRoom System</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">1. Install Package</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <code>npm install myroom-system</code>
                    <button
                      onClick={() => handleCopyCode('npm install myroom-system')}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Or using yarn:</p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <code>yarn add myroom-system</code>
                    <button
                      onClick={() => handleCopyCode('yarn add myroom-system')}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">2. TypeScript Configuration (Optional)</h4>
                  <p className="text-gray-600 mb-2">Add to tsconfig.json:</p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre><code>{`{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}`}</code></pre>
                    <button
                      onClick={() => handleCopyCode(`{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}`)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">3. API Configuration</h4>
                  <p className="text-gray-600 mb-2">Set up API endpoint and key:</p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre><code>{`const API_CONFIG = {
  baseUrl: 'http://localhost:3579/api',
  apiKey: 'your-api-key-here'
};`}</code></pre>
                    <button
                      onClick={() => handleCopyCode(`const API_CONFIG = {
  baseUrl: 'http://localhost:3579/api',
  apiKey: 'your-api-key-here'
};`)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Basic Integration</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">1. Basic Import and Usage</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre><code>{`import React from 'react';
import { MyRoom } from 'myroom-system';

function App() {
  return (
    <div className="app">
      <MyRoom
        width="800px"
        height="600px"
        roomPath="/models/rooms/living-room.glb"
        onSceneReady={(scene) => {
          console.log('Scene ready:', scene);
        }}
      />
    </div>
  );
}

export default App;`}</code></pre>
                    <button
                      onClick={() => handleCopyCode(`import React from 'react';
import { MyRoom } from 'myroom-system';

function App() {
  return (
    <div className="app">
      <MyRoom
        width="800px"
        height="600px"
        roomPath="/models/rooms/living-room.glb"
        onSceneReady={(scene) => {
          console.log('Scene ready:', scene);
        }}
      />
    </div>
  );
}

export default App;`)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">2. Avatar Configuration</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre><code>{`const avatarConfig = {
  gender: 'male', // 'male' | 'female'
  parts: {
    body: { path: '/models/male/body.glb', resourceId: 'male-body' },
    hair: { path: '/models/male/hair.glb', resourceId: 'male-hair' },
    top: { path: '/models/male/shirt.glb', resourceId: 'male-shirt' },
    bottom: { path: '/models/male/pants.glb', resourceId: 'male-pants' },
    shoes: { path: '/models/male/shoes.glb', resourceId: 'male-shoes' }
  },
  colors: {
    hair: '#4A301B',
    top: '#1E90FF'
  }
};

<MyRoom
  roomPath="/models/rooms/living-room.glb"
  avatarConfig={avatarConfig}
  onAvatarChange={(config) => {
    console.log('Avatar changed:', config);
  }}
/>`}</code></pre>
                    <button
                      onClick={() => handleCopyCode(`const avatarConfig = {
  gender: 'male', // 'male' | 'female'
  parts: {
    body: { path: '/models/male/body.glb', resourceId: 'male-body' },
    hair: { path: '/models/male/hair.glb', resourceId: 'male-hair' },
    top: { path: '/models/male/shirt.glb', resourceId: 'male-shirt' },
    bottom: { path: '/models/male/pants.glb', resourceId: 'male-pants' },
    shoes: { path: '/models/male/shoes.glb', resourceId: 'male-shoes' }
  },
  colors: {
    hair: '#4A301B',
    top: '#1E90FF'
  }
};

<MyRoom
  roomPath="/models/rooms/living-room.glb"
  avatarConfig={avatarConfig}
  onAvatarChange={(config) => {
    console.log('Avatar changed:', config);
  }}
/>`)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">3. Adding Items to Room</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre><code>{`const items = [
  {
    id: 'chair_1',
    name: 'Sofa Chair',
    path: '/models/furniture/chair.glb',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  }
];

<MyRoom
  roomPath="/models/rooms/living-room.glb"
  items={items}
  onItemAdd={(item) => {
    console.log('Item added:', item);
  }}
  onItemRemove={(itemId) => {
    console.log('Item removed:', itemId);
  }}
/>`}</code></pre>
                    <button
                      onClick={() => handleCopyCode(`const items = [
  {
    id: 'chair_1',
    name: 'Ghế sofa',
    path: '/models/furniture/chair.glb',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  }
];

<MyRoom
  roomPath="/models/rooms/living-room.glb"
  items={items}
  onItemAdd={(item) => {
    console.log('Item added:', item);
  }}
  onItemRemove={(itemId) => {
    console.log('Item removed:', itemId);
  }}
/>`)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Features</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">1. Using with API Service</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre><code>{`import { ApiService } from 'myroom-system';

const apiService = new ApiService({
  baseUrl: 'http://localhost:3579/api',
  apiKey: 'your-api-key'
});

// Get rooms list
const rooms = await apiService.getRooms();

// Get avatar resources
const avatarResources = await apiService.getAvatarResources('male', 'hair');

// Get saved presets
const presets = await apiService.getPresets();`}</code></pre>
                    <button
                      onClick={() => handleCopyCode(`import { ApiService } from 'myroom-system';

const apiService = new ApiService({
  baseUrl: 'http://localhost:3579/api',
  apiKey: 'your-api-key'
});

// Lấy danh sách phòng
const rooms = await apiService.getRooms();

// Lấy tài nguyên avatar
const avatarResources = await apiService.getAvatarResources('male', 'hair');

// Lấy preset đã lưu
const presets = await apiService.getPresets();`)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">2. Custom Hooks</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre><code>{`import { useMyRoom, useAvatar, useRoomItems } from 'myroom-system';

function MyComponent() {
  const { scene, isLoading, error } = useMyRoom({
    roomPath: '/models/rooms/bedroom.glb'
  });
  
  const { avatar, updateAvatar } = useAvatar({
    gender: 'female',
    onAvatarChange: (config) => console.log(config)
  });
  
  const { items, addItem, removeItem } = useRoomItems();
  
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {/* Render MyRoom component */}
    </div>
  );
}`}</code></pre>
                    <button
                      onClick={() => handleCopyCode(`import { useMyRoom, useAvatar, useRoomItems } from 'myroom-system';

function MyComponent() {
  const { scene, isLoading, error } = useMyRoom({
    roomPath: '/models/rooms/bedroom.glb'
  });
  
  const { avatar, updateAvatar } = useAvatar({
    gender: 'female',
    onAvatarChange: (config) => console.log(config)
  });
  
  const { items, addItem, removeItem } = useRoomItems();
  
  return (
    <div>
      {isLoading && <div>Đang tải...</div>}
      {error && <div>Lỗi: {error.message}</div>}
      {/* Render MyRoom component */}
    </div>
  );
}`)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">3. Event Handling</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <pre><code>{`<MyRoom
  roomPath="/models/rooms/office.glb"
  onSceneReady={(scene) => {
    console.log('Scene ready:', scene);
  }}
  onAvatarMove={(position) => {
    console.log('Avatar moved:', position);
  }}
  onItemClick={(item) => {
    console.log('Item clicked:', item);
  }}
  onCameraChange={(camera) => {
    console.log('Camera changed:', camera);
  }}
  onError={(error) => {
    console.error('Error:', error);
  }}
/>`}</code></pre>
                    <button
                      onClick={() => handleCopyCode(`<MyRoom
  roomPath="/models/rooms/office.glb"
  onSceneReady={(scene) => {
    console.log('Scene sẵn sàng:', scene);
  }}
  onAvatarMove={(position) => {
    console.log('Avatar di chuyển:', position);
  }}
  onItemClick={(item) => {
    console.log('Vật phẩm được click:', item);
  }}
  onCameraChange={(camera) => {
    console.log('Camera thay đổi:', camera);
  }}
  onError={(error) => {
    console.error('Lỗi:', error);
  }}
/>`)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">API Reference</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Rooms API</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">GET /api/rooms</code>
                        <p className="text-sm text-gray-600 mt-1">Get all rooms list</p>
                      </div>
                      <div>
                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">GET /api/rooms/:id</code>
                        <p className="text-sm text-gray-600 mt-1">Get room details</p>
                      </div>
                      <div>
                        <code className="bg-green-100 text-green-800 px-2 py-1 rounded">POST /api/rooms</code>
                        <p className="text-sm text-gray-600 mt-1">Create new room</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Avatar API</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">GET /api/avatar/categories</code>
                        <p className="text-sm text-gray-600 mt-1">Get avatar categories list</p>
                      </div>
                      <div>
                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">GET /api/avatar/resources</code>
                        <p className="text-sm text-gray-600 mt-1">Get avatar resources by gender and category</p>
                      </div>
                      <div>
                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">GET /api/animations/:gender</code>
                        <p className="text-sm text-gray-600 mt-1">Get animations by gender</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Items API</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">GET /api/items</code>
                        <p className="text-sm text-gray-600 mt-1">Get items list</p>
                      </div>
                      <div>
                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">GET /api/items/categories</code>
                        <p className="text-sm text-gray-600 mt-1">Get item categories list</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Manifest API</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">GET /api/manifest/presets</code>
                        <p className="text-sm text-gray-600 mt-1">Get saved presets list</p>
                      </div>
                      <div>
                        <code className="bg-green-100 text-green-800 px-2 py-1 rounded">POST /api/manifest/presets</code>
                        <p className="text-sm text-gray-600 mt-1">Save new preset</p>
                      </div>
                      <div>
                        <code className="bg-red-100 text-red-800 px-2 py-1 rounded">DELETE /api/manifest/presets/:id</code>
                        <p className="text-sm text-gray-600 mt-1">Delete preset</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">Developer Portal</h4>
                  <p className="text-blue-700 mb-3">
                    For more details about the API and complete documentation, please visit the Developer Portal:
                  </p>
                  <a
                    href="file:///d:/Ahn/2025/my-room/developer-page/index.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Developer Portal
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col ${
          isClosing ? 'animate-slide-down' : 'animate-slide-up'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">MyRoom Integration Guide</h2>
            <p className="text-gray-600 mt-1">Documentation and examples to get started with MyRoom System</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Need support? Contact our development team at{' '}
            <a href="https://petarainsoft.com" className="text-blue-600 hover:underline">
              petarainsoft.com
            </a>
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slide-down {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(20px); opacity: 0; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
        
        .animate-fade-out {
          animation: fade-out 0.15s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.15s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GettingStarted;