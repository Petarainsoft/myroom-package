'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic import for SSR compatibility
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

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

function ApiDemoContent() {
  const searchParams = useSearchParams();
  const apiBaseUrl = searchParams.get('apiBaseUrl') || 'http://localhost:3001/api';
  const apiKey = searchParams.get('apiKey') || 'your-api-key-here';

  const [apiResponses, setApiResponses] = useState<Record<string, ApiResponse>>({});
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('rooms');
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // API endpoints to test
  const apiEndpoints = {
    rooms: {
      name: 'Get Rooms',
      endpoint: '/rooms',
      method: 'GET',
      description: 'Fetch all available rooms'
    },
    avatars: {
      name: 'Get Avatars',
      endpoint: '/avatars',
      method: 'GET',
      description: 'Fetch available avatars by gender'
    },
    items: {
      name: 'Get Items',
      endpoint: '/items',
      method: 'GET',
      description: 'Fetch items by category'
    },
    categories: {
      name: 'Get Categories',
      endpoint: '/categories',
      method: 'GET',
      description: 'Fetch all item categories'
    },
    presets: {
      name: 'Get Presets',
      endpoint: '/presets',
      method: 'GET',
      description: 'Fetch default room presets'
    }
  };

  // Mock API call function
  const testApiEndpoint = async (endpointKey: string) => {
    const endpoint = apiEndpoints[endpointKey as keyof typeof apiEndpoints];
    setIsTestingApi(true);
    addLog(`Testing ${endpoint.name} endpoint...`);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response data based on endpoint
      let mockData;
      switch (endpointKey) {
        case 'rooms':
          mockData = [
            { id: 'room-1', name: 'Modern Living Room', thumbnail: '/rooms/modern.jpg' },
            { id: 'room-2', name: 'Classic Bedroom', thumbnail: '/rooms/classic.jpg' },
            { id: 'room-3', name: 'Minimal Office', thumbnail: '/rooms/minimal.jpg' }
          ];
          break;
        case 'avatars':
          mockData = [
            { id: 'avatar-1', gender: 'male', name: 'John', thumbnail: '/avatars/john.jpg' },
            { id: 'avatar-2', gender: 'female', name: 'Jane', thumbnail: '/avatars/jane.jpg' }
          ];
          break;
        case 'items':
          mockData = [
            { id: 'item-1', name: 'Modern Chair', category: 'furniture', price: 299 },
            { id: 'item-2', name: 'Coffee Table', category: 'furniture', price: 599 },
            { id: 'item-3', name: 'Floor Lamp', category: 'lighting', price: 199 }
          ];
          break;
        case 'categories':
          mockData = [
            { id: 'furniture', name: 'Furniture', count: 45 },
            { id: 'lighting', name: 'Lighting', count: 23 },
            { id: 'decoration', name: 'Decoration', count: 67 }
          ];
          break;
        case 'presets':
          mockData = [
            { id: 'preset-1', name: 'Modern Home', roomId: 'room-1', items: ['item-1', 'item-2'] },
            { id: 'preset-2', name: 'Cozy Living', roomId: 'room-2', items: ['item-2', 'item-3'] }
          ];
          break;
        default:
          mockData = { message: 'Mock data for ' + endpointKey };
      }

      const response: ApiResponse = {
        success: true,
        data: mockData,
        timestamp: new Date().toISOString()
      };

      setApiResponses(prev => ({ ...prev, [endpointKey]: response }));
      addLog(`✓ ${endpoint.name} successful - ${mockData.length || 1} items`);
      setConnectionStatus('connected');
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      setApiResponses(prev => ({ ...prev, [endpointKey]: response }));
      addLog(`✗ ${endpoint.name} failed: ${response.error}`);
      setConnectionStatus('error');
    } finally {
      setIsTestingApi(false);
    }
  };

  const testAllEndpoints = async () => {
    setConnectionStatus('connecting');
    addLog('Testing all API endpoints...');
    
    for (const endpointKey of Object.keys(apiEndpoints)) {
      await testApiEndpoint(endpointKey);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
    }
    
    addLog('All API tests completed');
  };

  const handleSceneReady = () => {
    addLog('3D Scene ready - API integration active');
  };

  const handleError = (error: any) => {
    addLog(`Scene Error: ${error.message || error}`);
  };

  const currentResponse = apiResponses[selectedEndpoint];

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
              <h1 className="text-2xl font-bold text-gray-900">API Integration Demo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' :
                  connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
              </div>
              <button
                onClick={testAllEndpoints}
                disabled={isTestingApi}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isTestingApi ? 'Testing...' : 'Test All APIs'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* API Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base URL
                  </label>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border break-all">
                    {apiBaseUrl}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                    {apiKey.substring(0, 10)}...
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className={`text-xs font-medium p-2 rounded ${
                    connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                    connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                    connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {connectionStatus === 'connected' && '✓ Connected'}
                    {connectionStatus === 'connecting' && '⏳ Connecting'}
                    {connectionStatus === 'error' && '✗ Error'}
                    {connectionStatus === 'idle' && '⚪ Idle'}
                  </div>
                </div>
              </div>
            </div>

            {/* API Endpoints */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h3>
              <div className="space-y-2">
                {Object.entries(apiEndpoints).map(([key, endpoint]) => (
                  <div key={key} className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedEndpoint(key)}
                      className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedEndpoint === key
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {endpoint.name}
                    </button>
                    <button
                      onClick={() => testApiEndpoint(key)}
                      disabled={isTestingApi}
                      className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 disabled:opacity-50"
                    >
                      Test
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Logs</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs h-48 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Waiting for API calls...</div>
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
            {/* 3D Scene with API Integration */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3D Scene with API Integration</h2>
              <MyRoom
                apiBaseUrl={apiBaseUrl}
                apiKey={apiKey}
                roomConfig={{
                  roomId: 'api-demo-room',
                  enablePhysics: true
                }}
                avatarConfig={{
                  avatarId: 'api-avatar',
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
                style={{ width: '100%', height: '300px' }}
              />
            </div>

            {/* API Response Display */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">API Response</h2>
                <div className="text-sm text-gray-600">
                  Endpoint: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {apiEndpoints[selectedEndpoint as keyof typeof apiEndpoints].endpoint}
                  </span>
                </div>
              </div>
              
              {currentResponse ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentResponse.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentResponse.success ? '✓ Success' : '✗ Error'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(currentResponse.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Response Data</h3>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                      <code>{JSON.stringify(currentResponse.data || currentResponse.error, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Select an endpoint and click "Test" to see the API response</p>
                </div>
              )}
            </div>

            {/* API Documentation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">API Documentation</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(apiEndpoints).map(([key, endpoint]) => {
                      const response = apiResponses[key];
                      return (
                        <tr key={key} className={selectedEndpoint === key ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {endpoint.endpoint}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {endpoint.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {endpoint.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {response ? (
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                response.success 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {response.success ? 'Success' : 'Error'}
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                Not tested
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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

export default function ApiDemo() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API demo...</p>
        </div>
      </div>
    }>
      <ApiDemoContent />
    </Suspense>
  );
}