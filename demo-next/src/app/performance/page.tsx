'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from 'react';
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

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  triangleCount: number;
  textureMemory: number;
}

function PerformanceDemoContent() {
  const searchParams = useSearchParams();
  const apiBaseUrl = searchParams.get('apiBaseUrl') || 'http://localhost:3001/api';
  const apiKey = searchParams.get('apiKey') || 'your-api-key-here';
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    triangleCount: 0,
    textureMemory: 0
  });
  
  const [optimizations, setOptimizations] = useState({
    enableLOD: true,
    enableOcclusion: true,
    enableInstancing: true,
    enableCompression: true,
    enableCaching: true,
    renderQuality: 'high' as 'low' | 'medium' | 'high',
    shadowQuality: 'medium' as 'low' | 'medium' | 'high',
    postProcessing: true
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Mock performance monitoring
  const startPerformanceMonitoring = () => {
    setIsMonitoring(true);
    startTimeRef.current = performance.now();
    addLog('Performance monitoring started');
    
    intervalRef.current = setInterval(() => {
      // Mock performance metrics
      const mockMetrics: PerformanceMetrics = {
        fps: Math.floor(Math.random() * 20) + 40, // 40-60 FPS
        memoryUsage: Math.floor(Math.random() * 200) + 100, // 100-300 MB
        loadTime: performance.now() - startTimeRef.current,
        renderTime: Math.random() * 5 + 10, // 10-15ms
        triangleCount: Math.floor(Math.random() * 50000) + 100000, // 100k-150k triangles
        textureMemory: Math.floor(Math.random() * 100) + 50 // 50-150 MB
      };
      
      setMetrics(mockMetrics);
    }, 1000);
  };

  const stopPerformanceMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    addLog('Performance monitoring stopped');
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleSceneReady = () => {
    addLog('3D Scene ready - Performance monitoring available');
    startPerformanceMonitoring();
  };

  const handleError = (error: any) => {
    addLog(`Scene Error: ${error.message || error}`);
  };

  const applyOptimizations = () => {
    addLog('Applying performance optimizations...');
    // In a real implementation, this would update the scene settings
    setTimeout(() => {
      addLog('✓ Optimizations applied successfully');
    }, 1000);
  };

  const resetOptimizations = () => {
    setOptimizations({
      enableLOD: true,
      enableOcclusion: true,
      enableInstancing: true,
      enableCompression: true,
      enableCaching: true,
      renderQuality: 'high',
      shadowQuality: 'medium',
      postProcessing: true
    });
    addLog('Optimizations reset to defaults');
  };

  const getPerformanceScore = () => {
    const fpsScore = Math.min(metrics.fps / 60, 1) * 30;
    const memoryScore = Math.max(1 - (metrics.memoryUsage / 500), 0) * 30;
    const renderScore = Math.max(1 - (metrics.renderTime / 30), 0) * 40;
    return Math.round(fpsScore + memoryScore + renderScore);
  };

  const performanceScore = getPerformanceScore();

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
              <h1 className="text-2xl font-bold text-gray-900">Performance Optimization Demo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  performanceScore >= 80 ? 'text-green-600' :
                  performanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {performanceScore}
                </div>
                <div className="text-xs text-gray-500">Performance Score</div>
              </div>
              <button
                onClick={isMonitoring ? stopPerformanceMonitoring : startPerformanceMonitoring}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isMonitoring 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Performance Metrics */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">FPS:</span>
                  <span className={`text-sm font-medium ${
                    metrics.fps >= 50 ? 'text-green-600' :
                    metrics.fps >= 30 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.fps}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Memory:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {metrics.memoryUsage}MB
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Render Time:</span>
                  <span className="text-sm font-medium text-purple-600">
                    {metrics.renderTime.toFixed(1)}ms
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Triangles:</span>
                  <span className="text-sm font-medium text-indigo-600">
                    {(metrics.triangleCount / 1000).toFixed(0)}K
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Texture Mem:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {metrics.textureMemory}MB
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Load Time:</span>
                  <span className="text-sm font-medium text-gray-600">
                    {(metrics.loadTime / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>

            {/* Optimization Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Optimizations</h3>
                <button
                  onClick={resetOptimizations}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Reset
                </button>
              </div>
              
              <div className="space-y-3">
                {[
                  { key: 'enableLOD', label: 'Level of Detail' },
                  { key: 'enableOcclusion', label: 'Occlusion Culling' },
                  { key: 'enableInstancing', label: 'GPU Instancing' },
                  { key: 'enableCompression', label: 'Texture Compression' },
                  { key: 'enableCaching', label: 'Asset Caching' },
                  { key: 'postProcessing', label: 'Post Processing' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={optimizations[key as keyof typeof optimizations] as boolean}
                      onChange={(e) => setOptimizations(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
                
                <div className="pt-2 border-t">
                  <label className="block text-sm text-gray-700 mb-1">Render Quality</label>
                  <select
                    value={optimizations.renderQuality}
                    onChange={(e) => setOptimizations(prev => ({ ...prev, renderQuality: e.target.value as any }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Shadow Quality</label>
                  <select
                    value={optimizations.shadowQuality}
                    onChange={(e) => setOptimizations(prev => ({ ...prev, shadowQuality: e.target.value as any }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={applyOptimizations}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Apply Optimizations
              </button>
            </div>

            {/* Performance Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Logs</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs h-48 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Waiting for performance data...</div>
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
            {/* 3D Scene with Performance Monitoring */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Optimized 3D Scene</h2>
              <MyRoom
                apiBaseUrl={apiBaseUrl}
                apiKey={apiKey}
                roomConfig={{
                  roomId: 'performance-room',
                  enablePhysics: optimizations.enableLOD
                }}
                avatarConfig={{
                  avatarId: 'performance-avatar',
                  gender: 'male',
                  enableAnimations: true
                }}
                sceneConfig={{
                  enableShadows: optimizations.shadowQuality !== 'low',
                  enablePostProcessing: optimizations.postProcessing,
                  camera: {
                    position: { x: 0, y: 3, z: 8 },
                    target: { x: 0, y: 0, z: 0 }
                  },
                  render: {
                    antialias: optimizations.renderQuality === 'high',
                    adaptToDeviceRatio: true
                  }
                }}
                showControls={true}
                compactMode={false}
                onSceneReady={handleSceneReady}
                onError={handleError}
                style={{ width: '100%', height: '400px' }}
              />
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">FPS Monitor</h3>
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      metrics.fps >= 50 ? 'text-green-600' :
                      metrics.fps >= 30 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metrics.fps}
                    </div>
                    <div className="text-sm text-gray-500">Frames per Second</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {metrics.memoryUsage}
                    </div>
                    <div className="text-sm text-gray-500">MB Used</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Optimization Techniques */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Optimization Techniques</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Level of Detail (LOD)</h3>
                  <p className="text-sm text-gray-600">Automatically reduces polygon count for distant objects to improve performance.</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Occlusion Culling</h3>
                  <p className="text-sm text-gray-600">Skips rendering objects that are hidden behind other objects.</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">GPU Instancing</h3>
                  <p className="text-sm text-gray-600">Renders multiple copies of the same object efficiently using GPU instancing.</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Texture Compression</h3>
                  <p className="text-sm text-gray-600">Compresses textures to reduce memory usage and improve loading times.</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Asset Caching</h3>
                  <p className="text-sm text-gray-600">Caches frequently used assets to reduce loading times and bandwidth usage.</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Adaptive Quality</h3>
                  <p className="text-sm text-gray-600">Automatically adjusts rendering quality based on device performance.</p>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Best Practices</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Use Dynamic Imports</h3>
                    <p className="text-sm text-gray-600">Load 3D components only when needed to reduce initial bundle size.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Optimize Asset Loading</h3>
                    <p className="text-sm text-gray-600">Compress textures, use appropriate formats, and implement progressive loading.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Monitor Performance</h3>
                    <p className="text-sm text-gray-600">Implement real-time performance monitoring to identify bottlenecks.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Adaptive Rendering</h3>
                    <p className="text-sm text-gray-600">Adjust quality settings based on device capabilities and performance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PerformanceDemo() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance demo...</p>
        </div>
      </div>
    }>
      <PerformanceDemoContent />
    </Suspense>
  );
}