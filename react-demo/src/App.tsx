import { useState, useRef, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { MyRoom } from 'myroom-system';

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const API_KEY = 'pk_9dd7a67c7c6d69c7f5ae603bd78656944d61667257ce60c59a676d35ccb6a16f';

// Types based on default-preset.json structure
interface RoomConfig {
  name: string;
  path: string;
  resourceId: string;
}

interface AvatarPart {
  path: string;
  resourceId: string;
}

interface AvatarConfig {
  gender: 'male' | 'female';
  parts: {
    body: AvatarPart;
    hair: AvatarPart;
    top: AvatarPart;
    bottom: AvatarPart;
    shoes: AvatarPart;
    fullset?: AvatarPart | null;
    accessory?: AvatarPart | null;
  };
  colors: {
    hair: string;
    top: string;
  };
}

interface PresetData {
  version: string;
  timestamp: string;
  room: RoomConfig;
  avatar: AvatarConfig;
  items: any[];
}

// API Service
class ApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getRooms(page = 1, limit = 10) {
    return this.request(`/rooms?page=${page}&limit=${limit}`);
  }

  async getAvatarCategories() {
    return this.request('/avatar/categories');
  }

  async getAvatarResources(gender: string, category: string) {
    return this.request(`/avatar/resources?gender=${gender}&category=${category}`);
  }

  async getPresets() {
    return this.request('/manifest/presets');
  }
}

// Real MyRoom component is now imported from myroom-system

function App() {
  const myRoomRef = useRef(null);
  const [apiService] = useState(() => new ApiService(API_BASE_URL, API_KEY));
  
  // State for real data
  const [presetData, setPresetData] = useState<PresetData | null>(null);
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [avatarCategories, setAvatarCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load default preset data on component mount
  useEffect(() => {
    loadDefaultPreset();
    loadAvailableData();
  }, []);

  const loadDefaultPreset = async () => {
    try {
      // Load default preset from public folder
      const response = await fetch('/default-preset.json');
      if (!response.ok) {
        throw new Error('Failed to load default preset');
      }
      const preset: PresetData = await response.json();
      setPresetData(preset);
      setRoomConfig(preset.room);
      setAvatarConfig(preset.avatar);
      toast.success('Default preset loaded successfully!');
    } catch (err) {
      console.error('Error loading default preset:', err);
      setError('Failed to load default preset');
      toast.error('Failed to load default preset');
      // Fallback to mock data
      setRoomConfig({
        name: 'Living Room (Fallback)',
        path: '/models/rooms/cate001/MR_KHROOM_0001.glb',
        resourceId: 'relax-mr_khroom_0001'
      });
      setAvatarConfig({
        gender: 'male',
        parts: {
          body: { path: '/models/male/male_body/male_body.glb', resourceId: 'male-male_body-male_body' },
          hair: { path: '/models/male/male_hair/male_hair_001.glb', resourceId: 'male-male_hair-male_hair_001' },
          top: { path: '/models/male/male_top/male_top_001.glb', resourceId: 'male-male_top-male_top_001' },
          bottom: { path: '/models/male/male_bottom/male_bottom_001.glb', resourceId: 'male-male_bottom-male_bottom_001' },
          shoes: { path: '/models/male/male_shoes/male_shoes_001.glb', resourceId: 'male-male_shoes-male_shoes_001' }
        },
        colors: {
          hair: '#4A301B',
          top: '#1E90FF'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableData = async () => {
    try {
      // Try to load available rooms from backend API (optional)
      const roomsResponse = await apiService.getRooms(1, 20);
      if (roomsResponse.success) {
        setAvailableRooms(roomsResponse.data.rooms || []);
      }
    } catch (err) {
      console.log('Backend API not available, using preset data only');
      // This is expected if backend is not running
    }

    try {
      // Try to load avatar categories from backend API (optional)
      const categoriesResponse = await apiService.getAvatarCategories();
      if (categoriesResponse.success) {
        setAvatarCategories(categoriesResponse.data || []);
      }
    } catch (err) {
      console.log('Avatar categories API not available');
      // This is expected if backend is not running
    }
  };
  
  // Event handlers
  const handleSceneReady = (scene: any) => {
    console.log('Scene ready:', scene);
    console.log('Current room config:', roomConfig);
    console.log('Current avatar config:', avatarConfig);
  };
  
  const handleError = (error: Error) => {
    console.error('Error:', error);
    toast.error(`Error: ${error.message}`);
  };
  
  const handleTakeScreenshot = () => {
    toast.success('Screenshot feature would work with real MyRoom component!');
    console.log('Current preset data:', presetData);
  };
  
  const handleChangeRoom = () => {
    if (availableRooms.length > 0) {
      // Use real room data from backend
      const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
      setRoomConfig({
        name: randomRoom.name,
        path: randomRoom.s3Url || randomRoom.path,
        resourceId: randomRoom.resourceId || randomRoom.id
      });
      toast.info(`Room changed to: ${randomRoom.name}`);
    } else if (roomConfig) {
      // Fallback: toggle between preset room variations
      const newName = roomConfig.name === 'Living Room' ? 'Living Room (Variant)' : 'Living Room';
      setRoomConfig(prev => prev ? { ...prev, name: newName } : null);
      toast.info(`Room changed to: ${newName}`);
    }
  };
  
  const handleChangeAvatar = () => {
    if (avatarConfig) {
      const newGender: 'male' | 'female' = avatarConfig.gender === 'female' ? 'male' : 'female';
      // Create new avatar config based on gender
      const newAvatarConfig: AvatarConfig = {
        gender: newGender,
        parts: {
          body: { path: `/models/${newGender}/${newGender}_body/${newGender}_body.glb`, resourceId: `${newGender}-${newGender}_body-${newGender}_body` },
          hair: { path: `/models/${newGender}/${newGender}_hair/${newGender}_hair_001.glb`, resourceId: `${newGender}-${newGender}_hair-${newGender}_hair_001` },
          top: { path: `/models/${newGender}/${newGender}_top/${newGender}_top_001.glb`, resourceId: `${newGender}-${newGender}_top-${newGender}_top_001` },
          bottom: { path: `/models/${newGender}/${newGender}_bottom/${newGender}_bottom_001.glb`, resourceId: `${newGender}-${newGender}_bottom-${newGender}_bottom_001` },
          shoes: { path: `/models/${newGender}/${newGender}_shoes/${newGender}_shoes_001.glb`, resourceId: `${newGender}-${newGender}_shoes-${newGender}_shoes_001` }
        },
        colors: {
          hair: newGender === 'male' ? '#4A301B' : '#8B4513',
          top: newGender === 'male' ? '#1E90FF' : '#FF69B4'
        }
      };
      setAvatarConfig(newAvatarConfig);
      toast.info(`Avatar changed to: ${newGender}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MyRoom System...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading MyRoom System</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MyRoom System Demo</h1>
              <p className="text-sm text-gray-600">Using real data from myroom-system & backend APIs</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleTakeScreenshot}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📸 Screenshot
              </button>
              <button
                onClick={handleChangeRoom}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={!roomConfig}
              >
                🏠 Change Room ({availableRooms.length} available)
              </button>
              <button
                onClick={handleChangeAvatar}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                disabled={!avatarConfig}
              >
                👤 Change Avatar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* MyRoom Component */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">3D Room View</h2>
              {roomConfig && avatarConfig ? (
                <MyRoom
                  ref={myRoomRef}
                  roomConfig={roomConfig}
                  avatarConfig={avatarConfig}
                  onSceneReady={handleSceneReady}
                  onError={handleError}
                  style={{ width: '100%', height: '400px' }}
                />
              ) : (
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Loading room and avatar configuration...</p>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="space-y-6">
            
            {/* Preset Information */}
            {presetData && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Preset Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                    <p className="text-sm text-gray-600">{presetData.version}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <p className="text-sm text-gray-600">{presetData.timestamp}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <p className="text-sm text-gray-600">myroom-system/public/preset/default-preset.json</p>
                  </div>
                </div>
              </div>
            )}

            {/* Room Configuration */}
            {roomConfig && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Room Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                    <p className="text-sm text-gray-600">{roomConfig.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Path</label>
                    <p className="text-sm text-gray-600 break-all">{roomConfig.path}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
                    <p className="text-sm text-gray-600">{roomConfig.resourceId}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Avatar Configuration */}
            {avatarConfig && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Avatar Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <p className="text-sm text-gray-600 capitalize">{avatarConfig.gender}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parts</label>
                    <div className="text-xs text-gray-500 space-y-1">
                      {Object.entries(avatarConfig.parts).map(([part, config]) => (
                        <div key={part}>
                          <span className="font-medium">{part}:</span> {config?.resourceId || 'N/A'}
                        </div>
                      ))}
                    </div>
                  </div>
                  {avatarConfig.colors && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
                      <div className="space-y-1">
                        {Object.entries(avatarConfig.colors).map(([part, color]) => (
                          <div key={part} className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-xs text-gray-600">{part}: {color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Backend API Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Backend API Status</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${availableRooms.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">Rooms API: {availableRooms.length} rooms loaded</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${avatarCategories.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">Avatar API: {avatarCategories.length} categories loaded</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Backend URL: {API_BASE_URL}
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Features Overview */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">MyRoom System Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🏠</div>
              <h3 className="font-semibold">3D Rooms</h3>
              <p className="text-sm text-gray-600">Multiple room environments</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">👤</div>
              <h3 className="font-semibold">Avatars</h3>
              <p className="text-sm text-gray-600">Customizable 3D avatars</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">🎮</div>
              <h3 className="font-semibold">Interactive</h3>
              <p className="text-sm text-gray-600">Real-time interactions</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl mb-2">⚛️</div>
              <h3 className="font-semibold">React Ready</h3>
              <p className="text-sm text-gray-600">Easy React integration</p>
            </div>
          </div>
        </div>
        
      </main>
    </div>
  );
}

export default App;
