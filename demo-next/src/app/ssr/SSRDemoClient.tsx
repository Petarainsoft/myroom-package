'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for SSR compatibility
const MyRoom = dynamic(() => import('myroom-system').then(mod => mod.MyRoom), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Hydrating 3D Scene...</p>
        <p className="text-sm text-gray-500 mt-2">Loading Babylon.js and MyRoom components</p>
      </div>
    </div>
  )
});

interface SSRDemoClientProps {
  apiBaseUrl: string;
  apiKey: string;
}

export default function SSRDemoClient({ apiBaseUrl, apiKey }: SSRDemoClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [hydrationTime, setHydrationTime] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    hydrationStart: 0,
    sceneLoadTime: 0,
    totalLoadTime: 0
  });

  useEffect(() => {
    const hydrationStart = performance.now();
    setPerformanceMetrics(prev => ({ ...prev, hydrationStart }));
    setIsClient(true);
    addLog('Client-side hydration started');
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSceneReady = () => {
    const now = performance.now();
    const sceneLoadTime = now - performanceMetrics.hydrationStart;
    const totalLoadTime = now;
    
    setSceneReady(true);
    setHydrationTime(sceneLoadTime);
    setPerformanceMetrics(prev => ({
      ...prev,
      sceneLoadTime,
      totalLoadTime
    }));
    
    addLog(`3D Scene ready after ${sceneLoadTime.toFixed(2)}ms`);
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

  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">3D Scene (Client-side)</h2>
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-4"></div>
            </div>
            <p className="text-gray-600">Preparing for hydration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 3D Scene */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">3D Scene (Client-side)</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                sceneReady ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {sceneReady ? 'Hydrated' : 'Hydrating...'}
              </span>
            </div>
            {hydrationTime && (
              <div className="text-sm text-gray-600">
                Load time: {hydrationTime.toFixed(0)}ms
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
          <MyRoom
            apiBaseUrl={apiBaseUrl}
            apiKey={apiKey}
            roomConfig={{
              roomId: 'ssr-demo-room',
              enablePhysics: true
            }}
            avatarConfig={{
              avatarId: 'ssr-avatar',
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

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hydration Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hydration Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Hydration Status:</span>
              <span className={`text-sm font-medium ${
                sceneReady ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {sceneReady ? 'Complete' : 'In Progress'}
              </span>
            </div>
            
            {hydrationTime && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Scene Load Time:</span>
                <span className="text-sm font-medium text-blue-600">
                  {hydrationTime.toFixed(2)}ms
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Rendering Mode:</span>
              <span className="text-sm font-medium text-purple-600">
                Client-side Only
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">SSR Compatible:</span>
              <span className="text-sm font-medium text-green-600">
                ✓ Yes
              </span>
            </div>
          </div>
        </div>

        {/* Event Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client-side Events</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Waiting for client events...</div>
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

      {/* SSR Benefits Demonstration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SSR Benefits Demonstration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">What Happened</h4>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <span>Server rendered the page structure and content</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <span>Page was immediately visible with loading placeholder</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <span>JavaScript bundle loaded and hydrated the page</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                <span>3D components dynamically imported and initialized</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">✓</span>
                <span>Full interactivity achieved</span>
              </li>
            </ol>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Key Advantages</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Faster perceived load time:</strong> Content visible immediately</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Better SEO:</strong> Search engines can crawl the content</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Progressive enhancement:</strong> Works without JavaScript</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Improved accessibility:</strong> Screen readers can access content</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}