import React, { useState, useEffect } from 'react';
import { Info, Trash2, RefreshCw } from 'lucide-react';

interface CacheInfo {
  name: string;
  size: number;
  urls: string[];
}

interface WindowWithGlbCache extends Window {
  glbCache?: {
    clear: () => Promise<boolean>;
    info: () => Promise<CacheInfo>;
  };
}

const CacheDebugPanel: React.FC = () => {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const windowWithCache = window as WindowWithGlbCache;

  const loadCacheInfo = async () => {
    if (!windowWithCache.glbCache) {
      console.warn('GLB Cache not available');
      return;
    }

    setIsLoading(true);
    try {
      const info = await windowWithCache.glbCache.info();
      setCacheInfo(info);
    } catch (error) {
      console.error('Failed to load cache info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    if (!windowWithCache.glbCache) {
      console.warn('GLB Cache not available');
      return;
    }

    setIsLoading(true);
    try {
      const success = await windowWithCache.glbCache.clear();
      if (success) {
        console.log('✅ Cache cleared successfully');
        setCacheInfo(null);
        // Reload cache info after clearing
        setTimeout(loadCacheInfo, 500);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadCacheInfo();
    }
  }, [isVisible]);

  // Only show in development or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || 
                    localStorage.getItem('show-cache-debug') === 'true';

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
        title="GLB Cache Debug"
      >
        <Info size={20} />
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">GLB Cache Debug</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* Cache Info */}
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Cache Status</span>
                <button
                  onClick={loadCacheInfo}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>
              
              {cacheInfo ? (
                <div className="text-sm text-gray-600">
                  <p><strong>Cache Name:</strong> {cacheInfo.name}</p>
                  <p><strong>Cached Files:</strong> {cacheInfo.size}</p>
                  <p><strong>Total Size:</strong> {(cacheInfo.urls.length * 0.5).toFixed(1)} MB (est.)</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No cache info available</p>
              )}
            </div>

            {/* Cached Files List */}
            {cacheInfo && cacheInfo.urls.length > 0 && (
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Cached Files:</h4>
                <div className="max-h-32 overflow-y-auto">
                  {cacheInfo.urls.map((url, index) => (
                    <div key={index} className="text-xs text-gray-600 mb-1 break-all">
                      {url.split('/').pop() || url}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={clearCache}
                disabled={isLoading}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                <Trash2 size={14} />
                Clear Cache
              </button>
              <button
                onClick={loadCacheInfo}
                disabled={isLoading}
                className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-500 border-t pt-2">
              <p><strong>Usage:</strong></p>
              <p>• Files are cached automatically on first load</p>
              <p>• Subsequent loads will be instant from cache</p>
              <p>• Clear cache if you need to reload fresh assets</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheDebugPanel;