'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic imports for SSR compatibility
const useMyRoom = dynamic(() => import('myroom-system').then(mod => ({ default: mod.useMyRoom })), {
  ssr: false
});

const useAvatar = dynamic(() => import('myroom-system').then(mod => ({ default: mod.useAvatar })), {
  ssr: false
});

const useRoom = dynamic(() => import('myroom-system').then(mod => ({ default: mod.useRoom })), {
  ssr: false
});

const useItems = dynamic(() => import('myroom-system').then(mod => ({ default: mod.useItems })), {
  ssr: false
});

const useScene = dynamic(() => import('myroom-system').then(mod => ({ default: mod.useScene })), {
  ssr: false
});

const MyRoom = dynamic(() => import('myroom-system').then(mod => mod.MyRoom), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">Loading 3D Scene...</p>
      </div>
    </div>
  )
});

function HooksDemoContent() {
  const searchParams = useSearchParams();
  const apiBaseUrl = searchParams.get('apiBaseUrl') || 'http://localhost:3001/api';
  const apiKey = searchParams.get('apiKey') || 'your-api-key-here';

  const [isClient, setIsClient] = useState(false);
  const [selectedHook, setSelectedHook] = useState('useMyRoom');
  const [hookData, setHookData] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Mock hook demonstrations
  const hookExamples = {
    useMyRoom: {
      title: 'useMyRoom Hook',
      description: 'Main hook for managing the entire MyRoom system state',
      code: `const {
  scene,
  isReady,
  error,
  initializeScene,
  resetScene,
  takeScreenshot,
  exportConfiguration
} = useMyRoom({
  apiBaseUrl: '${apiBaseUrl}',
  apiKey: '${apiKey}',
  roomConfig: { roomId: 'demo-room' },
  avatarConfig: { gender: 'male' }
});`,
      features: [
        'Scene initialization and management',
        'Error handling and loading states',
        'Screenshot and export functionality',
        'Configuration management'
      ]
    },
    useAvatar: {
      title: 'useAvatar Hook',
      description: 'Hook for managing avatar state and animations',
      code: `const {
  avatar,
  isLoading,
  currentAnimation,
  availableAnimations,
  changeAvatar,
  playAnimation,
  stopAnimation,
  setAvatarPosition
} = useAvatar({
  apiBaseUrl: '${apiBaseUrl}',
  apiKey: '${apiKey}',
  avatarId: 'demo-avatar',
  gender: 'male'
});`,
      features: [
        'Avatar loading and switching',
        'Animation control and management',
        'Position and rotation control',
        'Avatar customization options'
      ]
    },
    useRoom: {
      title: 'useRoom Hook',
      description: 'Hook for managing room environments and settings',
      code: `const {
  room,
  isLoading,
  availableRooms,
  currentRoom,
  changeRoom,
  updateRoomSettings,
  resetRoom
} = useRoom({
  apiBaseUrl: '${apiBaseUrl}',
  apiKey: '${apiKey}',
  roomId: 'demo-room',
  enablePhysics: true
});`,
      features: [
        'Room loading and switching',
        'Physics and lighting control',
        'Environment settings',
        'Room customization'
      ]
    },
    useItems: {
      title: 'useItems Hook',
      description: 'Hook for managing 3D items and objects in the scene',
      code: `const {
  items,
  isLoading,
  availableItems,
  addItem,
  removeItem,
  updateItemPosition,
  updateItemRotation,
  clearAllItems
} = useItems({
  apiBaseUrl: '${apiBaseUrl}',
  apiKey: '${apiKey}',
  categoryId: 'furniture'
});`,
      features: [
        'Item loading and management',
        'Position and rotation control',
        'Category-based item filtering',
        'Bulk item operations'
      ]
    },
    useScene: {
      title: 'useScene Hook',
      description: 'Hook for managing scene-level settings and controls',
      code: `const {
  scene,
  camera,
  lighting,
  isReady,
  updateCamera,
  updateLighting,
  enableShadows,
  enablePostProcessing,
  setRenderQuality
} = useScene({
  enableShadows: true,
  enablePostProcessing: true,
  camera: {
    position: { x: 0, y: 5, z: 10 },
    target: { x: 0, y: 0, z: 0 }
  }
});`,
      features: [
        'Camera control and positioning',
        'Lighting and shadow management',
        'Post-processing effects',
        'Render quality optimization'
      ]
    }
  };

  const currentHook = hookExamples[selectedHook as keyof typeof hookExamples];

  const handleSceneReady = () => {
    addLog('Scene ready - hooks are now available');
  };

  const handleError = (error: any) => {
    addLog(`Error: ${error.message || error}`);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hooks demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">React Hooks Demo</h1>
            </div>
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              React Hooks
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Hook Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Hooks</h3>
              <div className="space-y-2">
                {Object.keys(hookExamples).map((hookName) => (
                  <button
                    key={hookName}
                    onClick={() => setSelectedHook(hookName)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedHook === hookName
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {hookName}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Logs */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hook Events</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs h-48 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Waiting for hook events...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hook Documentation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentHook.title}</h2>
              <p className="text-gray-600 mb-6">{currentHook.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Features</h3>
                  <ul className="space-y-2">
                    {currentHook.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Usage Example</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{currentHook.code}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Live Demo */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Demo</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3D Scene */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">3D Scene</h3>
                  <MyRoom
                    apiBaseUrl={apiBaseUrl}
                    apiKey={apiKey}
                    roomConfig={{
                      roomId: 'hooks-demo-room',
                      enablePhysics: true
                    }}
                    avatarConfig={{
                      avatarId: 'hooks-avatar',
                      gender: 'male',
                      enableAnimations: true
                    }}
                    sceneConfig={{
                      enableShadows: true,
                      enablePostProcessing: true,
                      camera: {
                        position: { x: 0, y: 3, z: 8 },
                        target: { x: 0, y: 0, z: 0 }
                      }
                    }}
                    showControls={true}
                    compactMode={true}
                    onSceneReady={handleSceneReady}
                    onError={handleError}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                {/* Hook State Display */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Hook State</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Selected Hook:</span>
                        <span className="text-sm text-blue-600 font-mono">{selectedHook}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className="text-sm text-green-600">Ready</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">API Base URL:</span>
                        <span className="text-xs text-gray-500 truncate max-w-32">{apiBaseUrl}</span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Mock Hook Data:</h4>
                        <pre className="bg-white p-3 rounded text-xs overflow-x-auto">
                          <code>{JSON.stringify({
                            isLoading: false,
                            isReady: true,
                            error: null,
                            data: `Mock data for ${selectedHook}`
                          }, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hook Comparison */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hook Comparison</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hook
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key Features
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Use Case
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(hookExamples).map(([hookName, hook]) => (
                      <tr key={hookName} className={selectedHook === hookName ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {hookName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {hook.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {hook.features.slice(0, 2).join(', ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {hookName === 'useMyRoom' && 'Main integration'}
                          {hookName === 'useAvatar' && 'Avatar control'}
                          {hookName === 'useRoom' && 'Environment setup'}
                          {hookName === 'useItems' && 'Object management'}
                          {hookName === 'useScene' && 'Scene configuration'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HooksDemo() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hooks demo...</p>
        </div>
      </div>
    }>
      <HooksDemoContent />
    </Suspense>
  );
}