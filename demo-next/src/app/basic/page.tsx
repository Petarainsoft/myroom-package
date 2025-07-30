'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic import for SSR compatibility
const MyRoom = dynamic(() => import('myroom-system').then(mod => mod.MyRoom), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading 3D Scene...</p>
      </div>
    </div>
  )
});

function BasicDemoContent() {
  const searchParams = useSearchParams();
  const apiBaseUrl = searchParams.get('apiBaseUrl') || 'http://localhost:3001/api';
  const apiKey = searchParams.get('apiKey') || 'your-api-key-here';

  const [sceneReady, setSceneReady] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSceneReady = () => {
    setSceneReady(true);
    addLog('3D Scene initialized successfully');
  };

  const handleAvatarChange = (event: any) => {
    addLog(`Avatar changed: ${JSON.stringify(event)}`);
  };

  const handleRoomChange = (event: any) => {
    addLog(`Room changed: ${JSON.stringify(event)}`);
  };

  const handleItemAdd = (event: any) => {
    addLog(`Item added: ${JSON.stringify(event)}`);
  };

  const handleItemRemove = (event: any) => {
    addLog(`Item removed: ${JSON.stringify(event)}`);
  };

  const handleError = (error: any) => {
    addLog(`Error: ${error.message || error}`);
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Basic Integration Demo</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                sceneReady ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {sceneReady ? 'Scene Ready' : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D Scene */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3D Room Scene</h2>
              <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
                <MyRoom
                  apiBaseUrl={apiBaseUrl}
                  apiKey={apiKey}
                  roomConfig={{
                    roomId: 'default-room',
                    enablePhysics: true
                  }}
                  avatarConfig={{
                    avatarId: 'default-avatar',
                    gender: 'male',
                    enableAnimations: true
                  }}
                  sceneConfig={{
                    enableShadows: true,
                    enablePostProcessing: true,
                    camera: {
                      position: { x: 0, y: 5, z: 10 },
                      target: { x: 0, y: 0, z: 0 }
                    }
                  }}
                  showControls={true}
                  compactMode={false}
                  onSceneReady={handleSceneReady}
                  onAvatarChange={handleAvatarChange}
                  onRoomChange={handleRoomChange}
                  onItemAdd={handleItemAdd}
                  onItemRemove={handleItemRemove}
                  onError={handleError}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Configuration & Logs */}
          <div className="space-y-6">
            {/* Configuration */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Base URL
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                    {apiBaseUrl}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                    {apiKey.substring(0, 10)}...
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features Enabled
                  </label>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Physics Engine</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Avatar Animations</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Shadows & Post-processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Interactive Controls</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Logs</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Waiting for events...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Code Example */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Example</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`import { MyRoom } from 'myroom-system';

<MyRoom
  apiBaseUrl="${apiBaseUrl}"
  apiKey="${apiKey}"
  roomConfig={{
    roomId: 'default-room',
    enablePhysics: true
  }}
  avatarConfig={{
    avatarId: 'default-avatar',
    gender: 'male',
    enableAnimations: true
  }}
  sceneConfig={{
    enableShadows: true,
    enablePostProcessing: true
  }}
  showControls={true}
  onSceneReady={handleSceneReady}
  onError={handleError}
/>`}</code>
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BasicDemo() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading demo...</p>
        </div>
      </div>
    }>
      <BasicDemoContent />
    </Suspense>
  );
}