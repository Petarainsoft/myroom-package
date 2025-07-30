'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useRef } from 'react';
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

function AdvancedDemoContent() {
  const searchParams = useSearchParams();
  const apiBaseUrl = searchParams.get('apiBaseUrl') || 'http://localhost:3001/api';
  const apiKey = searchParams.get('apiKey') || 'your-api-key-here';
  
  const myRoomRef = useRef<any>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [config, setConfig] = useState({
    enablePhysics: true,
    enableShadows: true,
    enablePostProcessing: true,
    showControls: true,
    compactMode: false,
    ultraCompactMode: false,
    enableDebug: false,
    roomId: 'default-room',
    avatarGender: 'male' as 'male' | 'female',
    cameraPosition: { x: 0, y: 5, z: 10 }
  });

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSceneReady = () => {
    setSceneReady(true);
    addLog('Advanced 3D Scene initialized successfully');
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

  // Advanced control functions
  const takeScreenshot = async () => {
    if (myRoomRef.current && myRoomRef.current.takeScreenshot) {
      try {
        const screenshot = await myRoomRef.current.takeScreenshot();
        addLog('Screenshot taken successfully');
        // Create download link
        const link = document.createElement('a');
        link.download = `myroom-screenshot-${Date.now()}.png`;
        link.href = screenshot;
        link.click();
      } catch (error) {
        addLog(`Screenshot failed: ${error}`);
      }
    }
  };

  const exportConfiguration = () => {
    if (myRoomRef.current && myRoomRef.current.exportConfiguration) {
      try {
        const exportedConfig = myRoomRef.current.exportConfiguration();
        addLog('Configuration exported successfully');
        console.log('Exported config:', exportedConfig);
        // Download as JSON
        const blob = new Blob([JSON.stringify(exportedConfig, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `myroom-config-${Date.now()}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        addLog(`Export failed: ${error}`);
      }
    }
  };

  const resetScene = () => {
    if (myRoomRef.current && myRoomRef.current.resetScene) {
      try {
        myRoomRef.current.resetScene();
        addLog('Scene reset successfully');
      } catch (error) {
        addLog(`Reset failed: ${error}`);
      }
    }
  };

  const changeRoom = (roomId: string) => {
    if (myRoomRef.current && myRoomRef.current.changeRoom) {
      try {
        myRoomRef.current.changeRoom(roomId);
        setConfig(prev => ({ ...prev, roomId }));
        addLog(`Changing room to: ${roomId}`);
      } catch (error) {
        addLog(`Room change failed: ${error}`);
      }
    }
  };

  const changeAvatar = (gender: 'male' | 'female') => {
    if (myRoomRef.current && myRoomRef.current.changeAvatar) {
      try {
        myRoomRef.current.changeAvatar({ gender });
        setConfig(prev => ({ ...prev, avatarGender: gender }));
        addLog(`Changing avatar gender to: ${gender}`);
      } catch (error) {
        addLog(`Avatar change failed: ${error}`);
      }
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Advanced Features Demo</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 3D Scene */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Advanced 3D Room Scene</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={takeScreenshot}
                    disabled={!sceneReady}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    📸 Screenshot
                  </button>
                  <button
                    onClick={exportConfiguration}
                    disabled={!sceneReady}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    💾 Export
                  </button>
                  <button
                    onClick={resetScene}
                    disabled={!sceneReady}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
              <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
                <MyRoom
                  ref={myRoomRef}
                  apiBaseUrl={apiBaseUrl}
                  apiKey={apiKey}
                  roomConfig={{
                    roomId: config.roomId,
                    enablePhysics: config.enablePhysics
                  }}
                  avatarConfig={{
                    avatarId: 'advanced-avatar',
                    gender: config.avatarGender,
                    enableAnimations: true
                  }}
                  sceneConfig={{
                    enableShadows: config.enableShadows,
                    enablePostProcessing: config.enablePostProcessing,
                    camera: {
                      position: config.cameraPosition,
                      target: { x: 0, y: 0, z: 0 }
                    },
                    render: {
                      antialias: true,
                      adaptToDeviceRatio: true
                    }
                  }}
                  showControls={config.showControls}
                  compactMode={config.compactMode}
                  ultraCompactMode={config.ultraCompactMode}
                  enableDebug={config.enableDebug}
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

          {/* Controls & Configuration */}
          <div className="space-y-6">
            {/* Scene Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scene Controls</h3>
              <div className="space-y-4">
                {/* Room Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room
                  </label>
                  <select
                    value={config.roomId}
                    onChange={(e) => changeRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="default-room">Default Room</option>
                    <option value="modern-room">Modern Room</option>
                    <option value="classic-room">Classic Room</option>
                    <option value="minimal-room">Minimal Room</option>
                  </select>
                </div>

                {/* Avatar Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar Gender
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => changeAvatar('male')}
                      className={`px-3 py-2 rounded text-sm ${
                        config.avatarGender === 'male'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      onClick={() => changeAvatar('female')}
                      className={`px-3 py-2 rounded text-sm ${
                        config.avatarGender === 'female'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="space-y-3">
                  {[
                    { key: 'enablePhysics', label: 'Physics Engine' },
                    { key: 'enableShadows', label: 'Shadows' },
                    { key: 'enablePostProcessing', label: 'Post Processing' },
                    { key: 'showControls', label: 'Show Controls' },
                    { key: 'compactMode', label: 'Compact Mode' },
                    { key: 'ultraCompactMode', label: 'Ultra Compact' },
                    { key: 'enableDebug', label: 'Debug Mode' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config[key as keyof typeof config] as boolean}
                        onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Camera Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera Position
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['x', 'y', 'z'].map((axis) => (
                      <div key={axis}>
                        <label className="block text-xs text-gray-500 mb-1">{axis.toUpperCase()}</label>
                        <input
                          type="number"
                          value={config.cameraPosition[axis as keyof typeof config.cameraPosition]}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            cameraPosition: {
                              ...prev.cameraPosition,
                              [axis]: parseFloat(e.target.value) || 0
                            }
                          }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          step="0.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Logs</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs h-48 overflow-y-auto">
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

            {/* Performance Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Scene Status:</span>
                  <span className={sceneReady ? 'text-green-600' : 'text-yellow-600'}>
                    {sceneReady ? 'Ready' : 'Loading'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Physics:</span>
                  <span className={config.enablePhysics ? 'text-green-600' : 'text-gray-400'}>
                    {config.enablePhysics ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shadows:</span>
                  <span className={config.enableShadows ? 'text-green-600' : 'text-gray-400'}>
                    {config.enableShadows ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Post Processing:</span>
                  <span className={config.enablePostProcessing ? 'text-green-600' : 'text-gray-400'}>
                    {config.enablePostProcessing ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdvancedDemo() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced demo...</p>
        </div>
      </div>
    }>
      <AdvancedDemoContent />
    </Suspense>
  );
}