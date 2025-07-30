import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IntegratedBabylonScene } from '../../shared/components/babylon/IntegratedBabylonScene';
// AvatarControls inlined below
import { getDefaultConfigForGender, availablePartsData } from '../../shared/data/avatarPartsData';
import { AvatarConfig, AvailableParts, Gender } from '../../shared/types/AvatarTypes';
import { ActiveMovement, TouchMovement } from '../../shared/types/AvatarTypes';
import { domainConfig, getEmbedUrl, getWebComponentUrl } from '../../shared/config/appConfig';
import { manifestService } from '../../shared/services/ManifestService';
import ApiService from '../../shared/services/ApiService';
import CacheDebugPanel from '../../shared/components/debug/CacheDebugPanel';
import { ManifestDropdown } from '../../shared/components/ManifestDropdown';
import { PresetConfig } from '../../shared/types/PresetConfig';
import { sceneConfigLogger } from '../../shared/services/SceneConfigLogger';
import { toast } from 'sonner';
import './App.css';

type AppMode = 'room' | 'avatar' | 'integrated';

const IntegratedApp: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('integrated');
  const [showModeSelector, setShowModeSelector] = useState(true);

  // Note: React StrictMode in development causes components to mount twice,
  // which can lead to duplicate API calls. We use caching states to prevent this.

  const renderModeSelector = () => (
    <div className="mode-selector">
      <h2>Select Application Mode</h2>
      <div className="mode-buttons">
        <button
          className={`mode-btn ${currentMode === 'room' ? 'active' : ''}`}
          onClick={() => setCurrentMode('room')}
        >
          🏠 Interactive Room
          <span>Manage rooms and items</span>
        </button>

        <button
          className={`mode-btn ${currentMode === 'avatar' ? 'active' : ''}`}
          onClick={() => setCurrentMode('avatar')}
        >
          👤 Avatar System
          <span>Customize and control avatar</span>
        </button>

        <button
          className={`mode-btn ${currentMode === 'integrated' ? 'active' : ''}`}
          onClick={() => setCurrentMode('integrated')}
        >
          🎮 Integrated Mode
          <span>Combine both systems</span>
        </button>
      </div>

      {currentMode !== 'integrated' && (
        <button
          className="start-btn"
          onClick={() => setShowModeSelector(false)}
        >
          Start
        </button>
      )}
    </div>
  );

  const renderIntegratedMode = () => (
    <div className="integrated-container">
      {/* <div className="integrated-header"> */}
      {/* <h1>🎮 Integrated Room & Avatar System</h1> */}
      {/* <button 
          className="back-btn"
          onClick={() => setShowModeSelector(true)}
        >
          ← Back
        </button> */}
      {/* </div> */}

      <div className="integrated-content">
        {/* Main content area without tabs */}
        <div className="main-content">
          <InteractiveRoomWithAvatar />
        </div>
      </div>
    </div>
  );

  if (showModeSelector && currentMode !== 'integrated') {
    return renderModeSelector();
  }

  switch (currentMode) {
    case 'room':
      return (
        <div className="app-container">
          <button
            className="back-btn"
            onClick={() => setShowModeSelector(true)}
          >
            ← Back
          </button>
        </div>
      );

    case 'avatar':
      return (
        <div className="app-container">
          <button
            className="back-btn"
            onClick={() => setShowModeSelector(true)}
          >
            ← Back
          </button>
        </div>
      );

    case 'integrated':
      return renderIntegratedMode();

    default:
      return renderModeSelector();
  }
};

// Available rooms data
interface Room {
  name: string;
  resourceId: string;
  path?: string; // Keep for backward compatibility
}

interface LoadedItem {
  id: string;
  name: string;
  resourceId: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  path?: string; // Keep for backward compatibility
}

// Component integrating room and avatar with full UI controls
const InteractiveRoomWithAvatar: React.FC = () => {
  // Add state for availableItems
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedItemToAdd, setSelectedItemToAdd] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Room state management
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room>({ name: '', resourceId: '', path: '' });

  // Items state management
  const [loadedItems, setLoadedItems] = useState<LoadedItem[]>([]);
  const [gizmoMode, setGizmoMode] = useState<'position' | 'rotation' | 'scale'>('position');

  // Avatar state management - moved up to avoid initialization order issues
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(
    getDefaultConfigForGender('male')
  );
  const [activeMovement, setActiveMovement] = useState<ActiveMovement>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false,
    jump: false,
    run: false,
    wave: false,
    dance: false
  });
  const [touchMovement, setTouchMovement] = useState<TouchMovement>({
    x: 0,
    y: 0,
    isMoving: false
  });
  // Set default: only Avatar overlay is visible
  const [showAvatarOverlay, setShowAvatarOverlay] = useState(false);
  const [showRoomOverlay, setShowRoomOverlay] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [compactMode, setCompactMode] = useState(false);
  const [ultraCompactMode, setUltraCompactMode] = useState(true);
  const [babylonScene, setBabylonScene] = useState<any>(null);
  const integratedSceneRef = useRef<any>(null);

  // Auto-reset gizmo mode to position when item is selected
  useEffect(() => {
    if (selectedItem) {
      setGizmoMode('position');
    }
  }, [selectedItem]);

  // Debug: Log selectedRoom changes
  useEffect(() => {
    console.log('🔍 [IntegratedApp] selectedRoom changed:', selectedRoom);
  }, [selectedRoom]);

  // Log scene config when room changes
  const previousRoomRef = useRef(selectedRoom);
  useEffect(() => {
    // Skip logging on initial load when room is empty
    if (!selectedRoom.resourceId && !selectedRoom.path) {
      return;
    }
    
    // Skip if this is the first meaningful room load
    if (!previousRoomRef.current.resourceId && !previousRoomRef.current.path) {
      previousRoomRef.current = selectedRoom;
      return;
    }
    
    // Log room change if room actually changed
    if (previousRoomRef.current.resourceId !== selectedRoom.resourceId || 
        previousRoomRef.current.path !== selectedRoom.path) {
      sceneConfigLogger.logRoomChange(
        previousRoomRef.current,
        selectedRoom,
        avatarConfig,
        loadedItems
      );
      previousRoomRef.current = selectedRoom;
    }
  }, [selectedRoom, avatarConfig, loadedItems]);

  // Log scene config when avatar changes
  const previousAvatarRef = useRef(avatarConfig);
  useEffect(() => {
    // Skip logging on initial load
    if (!previousAvatarRef.current) {
      previousAvatarRef.current = avatarConfig;
      return;
    }
    
    // Check if avatar actually changed
    const avatarChanged = JSON.stringify(previousAvatarRef.current) !== JSON.stringify(avatarConfig);
    if (avatarChanged && selectedRoom.resourceId) {
      sceneConfigLogger.logAvatarChange(
        previousAvatarRef.current,
        avatarConfig,
        selectedRoom,
        loadedItems
      );
      previousAvatarRef.current = avatarConfig;
    }
  }, [avatarConfig, selectedRoom, loadedItems]);

  // Log scene config when items change
  const previousItemsRef = useRef(loadedItems);
  useEffect(() => {
    // Skip logging on initial load
    if (previousItemsRef.current.length === 0 && loadedItems.length === 0) {
      return;
    }
    
    // Check if items actually changed
    const itemsChanged = JSON.stringify(previousItemsRef.current) !== JSON.stringify(loadedItems);
    if (itemsChanged && selectedRoom.resourceId) {
      let action = 'items_changed';
      
      // Determine specific action
      if (previousItemsRef.current.length < loadedItems.length) {
        action = 'item_added';
      } else if (previousItemsRef.current.length > loadedItems.length) {
        action = 'item_removed';
      } else if (loadedItems.length === 0) {
        action = 'all_items_cleared';
      }
      
      sceneConfigLogger.logItemsChange(
        previousItemsRef.current,
        loadedItems,
        selectedRoom,
        avatarConfig,
        action
      );
      previousItemsRef.current = [...loadedItems];
    }
  }, [loadedItems, selectedRoom, avatarConfig]);

  // Check if selected item still exists in loaded items
  useEffect(() => {
    if (selectedItem) {
      const itemExists = loadedItems.some(item => item.id === selectedItem.name);
      if (!itemExists) {
        setSelectedItem(null);
      }
    }
  }, [loadedItems, selectedItem]);

  // Add state for rooms caching to prevent duplicate API calls
  const [roomsLoaded, setRoomsLoaded] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Load available rooms from API backend with caching
  useEffect(() => {
    // Prevent duplicate API calls during React StrictMode double rendering
    if (roomsLoaded || isLoadingRooms) {
      console.log('🏠 [IntegratedApp] Rooms already loaded or loading, skipping...');
      return;
    }

    // Check if data is already cached in sessionStorage
    const cachedRooms = sessionStorage.getItem('myroom_rooms_cache');
    const cacheTimestamp = sessionStorage.getItem('myroom_rooms_cache_timestamp');
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    if (cachedRooms && cacheTimestamp) {
      const isExpired = Date.now() - parseInt(cacheTimestamp) > CACHE_DURATION;
      if (!isExpired) {
        try {
          const parsedRooms = JSON.parse(cachedRooms);
          setAvailableRooms(parsedRooms);
          console.log('🏠 [IntegratedApp] Rooms loaded from cache:', parsedRooms.length, 'rooms');
          if (parsedRooms.length > 0) {
            setSelectedRoom(parsedRooms[0]);
          }
          setRoomsLoaded(true);
          return;
        } catch (parseError) {
          console.warn('⚠️ [IntegratedApp] Failed to parse cached rooms, loading from API');
        }
      }
    }

    const loadRooms = async () => {
      setIsLoadingRooms(true);
      try {
        console.log('🏠 [IntegratedApp] Loading rooms from API backend...');
        const apiService = ApiService.getInstance();
        const roomsResponse = await apiService.getRooms();
        
        // Handle different response formats from backend
        let roomsData = [];
        if (Array.isArray(roomsResponse)) {
          roomsData = roomsResponse;
        } else if (roomsResponse && roomsResponse.data && Array.isArray(roomsResponse.data)) {
          roomsData = roomsResponse.data;
        } else if (roomsResponse && roomsResponse.rooms && Array.isArray(roomsResponse.rooms)) {
          roomsData = roomsResponse.rooms;
        } else {
          console.warn('⚠️ [IntegratedApp] Unexpected rooms response format:', roomsResponse);
          roomsData = [];
        }
        
        // Transform API room data to match expected format
        const transformedRooms = roomsData.map((room: any) => ({
          name: room.name || room.title || `Room ${room.id}`,
          resourceId: room.resourceId || room.id,
          path: room.path || room.s3Url // Keep path for backward compatibility
        }));
        
        // Cache the loaded rooms
        sessionStorage.setItem('myroom_rooms_cache', JSON.stringify(transformedRooms));
        sessionStorage.setItem('myroom_rooms_cache_timestamp', Date.now().toString());
        
        console.log('🏠 [IntegratedApp] Loaded rooms from API:', transformedRooms);
        setAvailableRooms(transformedRooms);

        // Set default selected room if available
        if (transformedRooms.length > 0) {
          setSelectedRoom(transformedRooms[0]);
        }
        setRoomsLoaded(true);
      } catch (error) {
        console.error('❌ [IntegratedApp] Error loading rooms from API:', error);
        
        // Fallback to manifest service if API fails
        console.log('🔄 [IntegratedApp] Falling back to manifest service for rooms...');
        try {
          const manifestRooms = await manifestService.getRooms();
          setAvailableRooms(manifestRooms);
          if (manifestRooms.length > 0) {
            setSelectedRoom(manifestRooms[0]);
          }
          setRoomsLoaded(true);
        } catch (manifestError) {
          console.error('❌ [IntegratedApp] Manifest fallback also failed:', manifestError);
        }
      } finally {
        setIsLoadingRooms(false);
      }
    };

    loadRooms();
  }, []);

  // Load default scene (full 3D scene data) from manifest service on startup
  useEffect(() => {
    const loadDefaultScene = async () => {
      try {
        console.log('🎬 [IntegratedApp] Loading default scene from manifest service...');
        
        let defaultPreset = null;
        
        // Try to load the latest preset from backend first
        try {
          console.log('🎬 [IntegratedApp] Attempting to load latest preset from backend...');
          const latestPreset = await manifestService.getLatestPreset();
          if (latestPreset && latestPreset.config) {
            defaultPreset = latestPreset.config;
            console.log('🎬 [IntegratedApp] Latest preset loaded from backend:', defaultPreset);
            toast.success(`Loaded latest manifest: ${latestPreset.name}`);
          }
        } catch (error) {
          console.warn('⚠️ [IntegratedApp] Failed to load latest preset from backend:', error);
        }
        
        // Use hardcoded default preset if no backend preset available
        if (!defaultPreset) {
          console.log('🎬 [IntegratedApp] No backend preset available, using hardcoded default from ManifestService...');
          defaultPreset = await manifestService.loadPreset('default-preset');
          console.log('🎬 [IntegratedApp] Hardcoded default preset loaded:', defaultPreset);
        }

        // Load room configuration from default preset
        // This sets which room should be selected in the room selector
        // The actual room data comes from API backend via availableRooms
        if (defaultPreset.room && availableRooms.length > 0) {
          console.log('🏠 [IntegratedApp] Setting room from default preset:', defaultPreset.room);
          // Prioritize resourceId over path for room loading
          const roomToLoad = defaultPreset.room.resourceId
            ? availableRooms.find(room => room.resourceId === defaultPreset.room.resourceId)
            : availableRooms.find(room => room.path === defaultPreset.room.path);
          if (roomToLoad) {
            console.log('🏠 [IntegratedApp] Found matching room in API data:', roomToLoad);
            setSelectedRoom(roomToLoad);
          } else {
            console.warn('⚠️ [IntegratedApp] Room from preset not found in API data, using first available room');
          }
        }

        // Load avatar configuration from default preset (scene data)
        // This contains the complete avatar setup for the scene
        if (defaultPreset.avatar) {
          console.log('👤 [IntegratedApp] Loading avatar from scene data:', defaultPreset.avatar);
          // Handle different avatar formats
          let avatarConfig = defaultPreset.avatar;

          // If avatar parts have resourceId/path structure, prioritize resourceId over path
          if (avatarConfig.parts && typeof avatarConfig.parts.body === 'object') {
            console.log('🔍 [IntegratedApp] Processing avatar parts from default-preset.json:', avatarConfig.parts);
            const convertedParts: any = {};
            Object.keys(avatarConfig.parts).forEach(partKey => {
              const part = avatarConfig.parts[partKey];
              if (part && typeof part === 'object') {
                // Prioritize resourceId if available, fallback to path
                if (part.resourceId) {
                  convertedParts[partKey] = part.resourceId;
                  console.log(`🔍 [IntegratedApp] Using resourceId for ${partKey}: ${part.resourceId}`);
                } else if (part.path) {
                  convertedParts[partKey] = part.path;
                  console.log(`🔍 [IntegratedApp] Using path for ${partKey}: ${part.path}`);
                } else {
                  convertedParts[partKey] = part;
                }
              } else {
                convertedParts[partKey] = part;
              }
            });
            avatarConfig = {
              ...avatarConfig,
              parts: convertedParts
            };
            console.log('🔍 [IntegratedApp] Final converted avatar parts:', convertedParts);
          }

          console.log('👤 [IntegratedApp] Setting avatarConfig from scene data:', avatarConfig);
          setAvatarConfig(avatarConfig);
        }

        // Load items from default preset (scene data)
        // This contains the items that should be placed in the scene
        if (defaultPreset.items) {
          console.log('📦 [IntegratedApp] Loading items from scene data:', defaultPreset.items);
          setLoadedItems(defaultPreset.items);
        }

        console.log('✅ [IntegratedApp] Default scene loaded successfully from manifest service:', defaultPreset);
        
        // Log full scene config after loading default scene
        setTimeout(() => {
          if (selectedRoom.resourceId && avatarConfig) {
            sceneConfigLogger.logFullSceneConfig(
              selectedRoom,
              avatarConfig,
              defaultPreset.items || [],
              'default_scene_loaded'
            );
          }
        }, 1000); // Delay to ensure all state updates are complete
      } catch (error) {
        console.error('❌ [IntegratedApp] Error loading default scene from manifest service:', error);
        // Fallback to default configuration if preset fails
        console.log('🔄 [IntegratedApp] Using fallback avatar configuration');
        setAvatarConfig(getDefaultConfigForGender('male'));
      }
    };

    loadDefaultScene();
  }, [availableRooms]);

  // Add state for caching to prevent duplicate API calls
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Load available items catalog from backend API with caching
  // This loads the catalog of items that can be added to the scene
  // Different from loadedItems which are items already placed in the scene
  useEffect(() => {
    // Prevent duplicate API calls during React StrictMode double rendering
    if (itemsLoaded || isLoadingItems) {
      console.log('📦 [IntegratedApp] Items already loaded or loading, skipping...');
      return;
    }

    // Check if data is already cached in sessionStorage
    const cachedItems = sessionStorage.getItem('myroom_items_cache');
    const cacheTimestamp = sessionStorage.getItem('myroom_items_cache_timestamp');
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    if (cachedItems && cacheTimestamp) {
      const isExpired = Date.now() - parseInt(cacheTimestamp) > CACHE_DURATION;
      if (!isExpired) {
        try {
          const parsedItems = JSON.parse(cachedItems);
          setAvailableItems(parsedItems);
          console.log('📦 [IntegratedApp] Items loaded from cache:', parsedItems.length, 'items');
          if (!selectedItemToAdd && parsedItems.length > 0) {
            setSelectedItemToAdd(parsedItems[0]);
          }
          setItemsLoaded(true);
          return;
        } catch (parseError) {
          console.warn('⚠️ [IntegratedApp] Failed to parse cached items, loading from API');
        }
      }
    }

    const loadItems = async () => {
      setIsLoadingItems(true);
      try {
        console.log('📦 [IntegratedApp] Loading available items catalog from backend API...');
        const apiService = ApiService.getInstance();
        
        // First, get all categories
        const categoriesResponse = await apiService.getItemCategories(1, 100);
        let categoriesData = [];
        if (categoriesResponse && categoriesResponse.data && categoriesResponse.data.categories) {
          categoriesData = categoriesResponse.data.categories;
        }
        console.log('📦 [IntegratedApp] Categories loaded from API:', categoriesData.length, 'categories');
        
        // Then, load items for each category
        const allItems = [];
        for (const category of categoriesData) {
          try {
            const itemsResponse = await apiService.getItemsByCategory(category.id, 1, 100);
            if (itemsResponse && itemsResponse.data && itemsResponse.data.resources) {
              const categoryItems = itemsResponse.data.resources.map((item: any) => ({
                ...item,
                category: category.name,
                categoryId: category.id,
                resourceId: item.resourceId,
                // Map backend fields to frontend expected format
                name: item.name,
                path: item.s3Url || item.path || item.resourceId, // Use s3Url if available, fallback to path, then resourceId
              }));
              allItems.push(...categoryItems);
            }
          } catch (categoryError) {
            console.warn(`⚠️ [IntegratedApp] Failed to load items for category ${category.name}:`, categoryError);
          }
        }
        
        // Cache the loaded items
        sessionStorage.setItem('myroom_items_cache', JSON.stringify(allItems));
        sessionStorage.setItem('myroom_items_cache_timestamp', Date.now().toString());
        
        setAvailableItems(allItems);
        console.log('📦 [IntegratedApp] Available items catalog loaded from API:', allItems.length, 'items');
        
        // 🔍 TRACE: Log first 10 items to check data structure
        console.log('🔍 [TRACE] First 10 items data structure:', allItems.slice(0, 10).map((item, index) => ({
          index,
          id: item.id,
          resourceId: item.resourceId,
          name: item.name,
          category: item.category,
          categoryId: item.categoryId,
          path: item.path,
          s3Url: item.s3Url,
          fileType: item.fileType,
          description: item.description,
          allKeys: Object.keys(item)
        })));
        
        // Set default selected item if not already set
        if (!selectedItemToAdd && allItems.length > 0) {
          setSelectedItemToAdd(allItems[0]);
        }
        
        setItemsLoaded(true);
      } catch (error) {
        console.error('❌ [IntegratedApp] Error loading items catalog from backend API:', error);
        // No local manifest fallback - backend API is required
        console.log('❌ [IntegratedApp] Backend API failed and no local fallback available');
        setAvailableItems([]);
        setItemsLoaded(true);
      } finally {
        setIsLoadingItems(false);
      }
    };

    loadItems();
  }, []);

  // Avatar state management has been moved up to avoid initialization order issues
  
  // Additional UI state management
  const [showIntegrationGuide, setShowIntegrationGuide] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // New state for fade-out effect
  const [activeTab, setActiveTab] = useState('iframe');

  // Function to get current scene configuration
  const getCurrentConfig = useCallback(() => {
    console.log('🔍 [IntegratedApp.getCurrentConfig] Starting to get current config...');
    console.log('🔍 [IntegratedApp.getCurrentConfig] Current selectedRoom:', selectedRoom);
    console.log('🔍 [IntegratedApp.getCurrentConfig] Current avatarConfig:', avatarConfig);
    console.log('🔍 [IntegratedApp.getCurrentConfig] Current loadedItems:', loadedItems);
    
    // Use SceneConfigLogger to get the most up-to-date configuration
    const config = sceneConfigLogger.getCurrentConfig(
      {
        name: selectedRoom.name,
        resourceId: selectedRoom.resourceId,
        path: selectedRoom.path
      },
      avatarConfig,
      loadedItems
    );
    
    console.log('🔍 [IntegratedApp.getCurrentConfig] Generated config:', config);
    console.log('🔍 [IntegratedApp.getCurrentConfig] Config room:', config?.room);
    console.log('🔍 [IntegratedApp.getCurrentConfig] Config avatar:', config?.avatar);
    console.log('🔍 [IntegratedApp.getCurrentConfig] Config items count:', config?.items?.length || 0);
    
    return config;
  }, [selectedRoom, avatarConfig, loadedItems]);

  const closeIntegrationGuide = () => {
    setIsClosing(true); // Start fade-out animation
    setTimeout(() => {
      setShowIntegrationGuide(false); // Hide modal after animation completes
      setIsClosing(false); // Reset closing state
    }, 150); // Match the duration of the fade-out animation
  };

  // Apply modal styles
  useEffect(() => {
    // Create style element for modal styles
    const styleElement = document.createElement('style');
    styleElement.innerHTML = modalStyles;
    document.head.appendChild(styleElement);

    // Clean up on component unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Handle tab switching in integration guide
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle copy code functionality
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        alert('Code copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showIntegrationGuide) {
        closeIntegrationGuide();
      }
    };

    window.addEventListener('keydown', handleEscKey);

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [showIntegrationGuide]);

  // Avatar control handlers
  const handleGenderChange = (newGender: 'male' | 'female') => {
    setAvatarConfig(getDefaultConfigForGender(newGender));
  };

  const handlePartChange = (partType: string, fileName: string | null) => {
    console.log(` handlePartChange IN INTEGRATED APP TSX: partType=${partType}, fileName=${fileName}`);
    
    // Find the resourceId for the selected part
    let resourceId: string | null = null;
    if (fileName && avatarConfig.gender) {
      const genderData = availablePartsData[avatarConfig.gender];
      if (genderData && genderData.selectableParts[partType as keyof typeof genderData.selectableParts]) {
        const partOptions = genderData.selectableParts[partType as keyof typeof genderData.selectableParts];
        const selectedPart = partOptions.find(part => part.fileName === fileName);
        resourceId = selectedPart?.resourceId || null;
      }
    }
    
    setAvatarConfig((prev: AvatarConfig) => {
      const newConfig = { ...prev };

      // Handle fullset logic
      if (partType === 'fullset') {
        if (fileName) {
          // When selecting a fullset, clear individual clothing parts and shoes
          newConfig.parts = {
            ...newConfig.parts,
            fullset: fileName,
            top: null,
            bottom: null,
            shoes: null
          };
          // Store resourceId in a separate object for tracking
          newConfig.resourceIds = {
            ...newConfig.resourceIds,
            fullset: resourceId,
            top: null,
            bottom: null,
            shoes: null
          };
        } else {
          // When removing fullset, just clear it
          newConfig.parts = {
            ...newConfig.parts,
            fullset: null
          };
          newConfig.resourceIds = {
            ...newConfig.resourceIds,
            fullset: null
          };
        }
      } else if (partType === 'top' || partType === 'bottom' || partType === 'shoes') {
        // When selecting individual clothing or shoes, clear fullset
        if (fileName && newConfig.parts.fullset) {
          newConfig.parts = {
            ...newConfig.parts,
            fullset: null,
            [partType]: fileName
          };
          newConfig.resourceIds = {
            ...newConfig.resourceIds,
            fullset: null,
            [partType]: resourceId
          };
        } else {
          newConfig.parts = {
            ...newConfig.parts,
            [partType]: fileName
          };
          newConfig.resourceIds = {
            ...newConfig.resourceIds,
            [partType]: resourceId
          };
        }
      } else {
        // For other parts, just update normally
        newConfig.parts = {
          ...newConfig.parts,
          [partType]: fileName
        };
        newConfig.resourceIds = {
          ...newConfig.resourceIds,
          [partType]: resourceId
        };
      }

      return newConfig;
    });
  };

  const handleColorChange = (partType: string, color: string) => {
    setAvatarConfig((prev: AvatarConfig) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [partType]: color
      }
    }));
  };

  const handleSaveAvatar = () => {
    // Create comprehensive save data including room, avatar, and items
    // Enhanced avatar data with both path and resourceId for each part
    const enhancedAvatar = {
      ...avatarConfig,
      parts: Object.keys(avatarConfig.parts).reduce((acc, partType) => {
        const path = avatarConfig.parts[partType];
        const resourceId = avatarConfig.resourceIds?.[partType] || null;
        acc[partType] = {
          path: path,
          resourceId: resourceId
        };
        return acc;
      }, {} as any)
    };

    const saveData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      room: {
        name: selectedRoom.name,
        path: selectedRoom.path,
        resourceId: selectedRoom.resourceId
      },
      avatar: enhancedAvatar,
      items: loadedItems.map(item => ({
        id: item.id,
        name: item.name,
        resourceId: item.resourceId,
        position: item.position,
        rotation: item.rotation || { x: 0, y: 0, z: 0 },
        scale: item.scale || { x: 1, y: 1, z: 1 },
        path: item.path
      }))
    };

    const dataStr = JSON.stringify(saveData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `scene-${avatarConfig.gender}-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleItemTransformChange = useCallback((itemId: string, transform: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; scale: { x: number; y: number; z: number } }) => {
    setLoadedItems(prevItems => {
      const itemIndex = prevItems.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return prevItems;

      const currentItem = prevItems[itemIndex];

      // Check if transform actually changed to prevent unnecessary updates
      const positionChanged =
        !currentItem.position ||
        Math.abs(currentItem.position.x - transform.position.x) > 0.001 ||
        Math.abs(currentItem.position.y - transform.position.y) > 0.001 ||
        Math.abs(currentItem.position.z - transform.position.z) > 0.001;

      const rotationChanged =
        !currentItem.rotation ||
        Math.abs(currentItem.rotation.x - transform.rotation.x) > 0.001 ||
        Math.abs(currentItem.rotation.y - transform.rotation.y) > 0.001 ||
        Math.abs(currentItem.rotation.z - transform.rotation.z) > 0.001;

      const scaleChanged =
        !currentItem.scale ||
        Math.abs(currentItem.scale.x - transform.scale.x) > 0.001 ||
        Math.abs(currentItem.scale.y - transform.scale.y) > 0.001 ||
        Math.abs(currentItem.scale.z - transform.scale.z) > 0.001;

      // Only update if something actually changed
      if (!positionChanged && !rotationChanged && !scaleChanged) {
        return prevItems;
      }

      return prevItems.map(item =>
        item.id === itemId
          ? { ...item, position: transform.position, rotation: transform.rotation, scale: transform.scale }
          : item
      );
    });
  }, []);

  const handleLoadAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);

          // Check if it's the new format with room, avatar, and items
          if (data.version && data.room && data.avatar && data.items) {
            // Load room
            const roomToLoad = availableRooms.find(room =>
              room.resourceId === data.room.resourceId ||
              room.path === data.room.path
            );
            if (roomToLoad) {
              setSelectedRoom(roomToLoad);
            }

            // Load avatar - handle both old and new format
            let avatarToLoad = data.avatar;
            
            // Check if avatar parts have the new format with path and resourceId objects
            if (data.avatar.parts && typeof data.avatar.parts === 'object') {
              const firstPartKey = Object.keys(data.avatar.parts)[0];
              const firstPart = data.avatar.parts[firstPartKey];
              
              // If parts contain objects with path and resourceId, convert to old format
              if (firstPart && typeof firstPart === 'object' && 'path' in firstPart) {
                const convertedParts: any = {};
                const convertedResourceIds: any = {};
                
                Object.keys(data.avatar.parts).forEach(partType => {
                  const part = data.avatar.parts[partType];
                  if (part && typeof part === 'object') {
                    convertedParts[partType] = part.path;
                    convertedResourceIds[partType] = part.resourceId;
                  } else {
                    convertedParts[partType] = part;
                    convertedResourceIds[partType] = null;
                  }
                });
                
                avatarToLoad = {
                  ...data.avatar,
                  parts: convertedParts,
                  resourceIds: convertedResourceIds
                };
              }
            }
            
            setAvatarConfig(avatarToLoad);

            // Load items
            setLoadedItems(data.items);
          } else {
            // Fallback for old format (avatar only)
            setAvatarConfig(data);
          }
        } catch (error) {
          console.error('Error loading scene data:', error);
          alert('Error loading file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };



  // Item management handlers
  // Add state for selected item category
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Compute categories from availableItems
  const categories = Array.from(new Set(availableItems.map(item => item.category).filter(Boolean)));
  // Filter items by selected category
  const filteredItems = selectedCategory
    ? availableItems.filter(item => item.category === selectedCategory)
    : [];
  // Add state for selected item per category
  const [selectedItemPerCategory, setSelectedItemPerCategory] = useState<{ [category: string]: any | null }>({});
  // When category changes, set default selected item for that category if not already set
  useEffect(() => {
    if (selectedCategory && filteredItems.length > 0 && !selectedItemPerCategory[selectedCategory]) {
      setSelectedItemPerCategory(prev => ({ ...prev, [selectedCategory]: filteredItems[0] }));
    }
  }, [selectedCategory, filteredItems]);

  // Update handleAddItem to use the selected item for the current category
  const handleAddItem = () => {
    if (!selectedCategory) return;
    const selectedItemToAdd = selectedItemPerCategory[selectedCategory];
    if (!selectedItemToAdd) return;
    
    const newItem: LoadedItem = {
      id: `item_${Date.now()}`,
      name: selectedItemToAdd.name,
      path: selectedItemToAdd.path,
      resourceId: selectedItemToAdd.resourceId,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
    setLoadedItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    setLoadedItems(prev => prev.filter(item => item.id !== itemId));
    // Reset selected item if it's the one being removed
    if (selectedItem && selectedItem.name === itemId) {
      setSelectedItem(null);
    }
  };

  const handleClearAllItems = () => {
    setLoadedItems([]);
    // Reset selected item when clearing all items
    setSelectedItem(null);
  };

  // Handler to toggle Avatar overlay
  const handleToggleAvatarOverlay = () => {
    setShowAvatarOverlay((prev) => {
      if (!prev) {
        setShowRoomOverlay(false);
        return true;
      } else {
        return false;
      }
    });
  };

  // Handler to toggle Room overlay
  const handleToggleRoomOverlay = () => {
    setShowRoomOverlay((prev) => {
      if (!prev) {
        setShowAvatarOverlay(false);
        return true;
      } else {
        return false;
      }
    });
  };

  const handleToggleFullscreen = () => {
    const container = document.querySelector('.babylon-scene-container');

    if (!container) return;

    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Manifest handlers
  const handleManifestSelect = async (presetId: string) => {
    try {
      console.log('📋 [IntegratedApp] Loading manifest:', presetId);
      const preset = await manifestService.getPreset(presetId);
      
      if (preset) {
        // Apply room configuration following default-preset.json structure
        if (preset.room) {
          const room = availableRooms.find(r => 
            r.resourceId === preset.room.resourceId || 
            r.path === preset.room.path
          );
          if (room) {
            setSelectedRoom(room);
          } else {
            // Create room object from preset if not found in available rooms
            setSelectedRoom({
              name: preset.room.name,
              resourceId: preset.room.resourceId,
              path: preset.room.path
            });
          }
        }
        
        // Apply avatar configuration following default-preset.json structure
        if (preset.avatar) {
          // Convert preset avatar format to internal AvatarConfig format
          const convertedAvatarConfig: AvatarConfig = {
            gender: preset.avatar.gender || 'male',
            parts: {},
            colors: preset.avatar.colors || {},
            resourceIds: {}
          };
          
          // Convert parts from preset format to internal format
          if (preset.avatar.parts) {
            Object.keys(preset.avatar.parts).forEach(partKey => {
              const part = preset.avatar.parts![partKey];
              if (part && typeof part === 'object' && part.path) {
                convertedAvatarConfig.parts[partKey] = part.path;
                if (part.resourceId) {
                  convertedAvatarConfig.resourceIds![partKey] = part.resourceId;
                }
              }
            });
          }
          
          setAvatarConfig(convertedAvatarConfig);
        }
        
        // Apply loaded items following default-preset.json structure
        if (preset.items && Array.isArray(preset.items)) {
          setLoadedItems(preset.items);
        }
        
        toast.success(`Manifest loaded successfully!`);
        
        // Log full scene config after loading manifest
        setTimeout(() => {
          const currentRoom = preset.room ? (
            availableRooms.find(r => 
              r.resourceId === preset.room.resourceId || 
              r.path === preset.room.path
            ) || {
              name: preset.room.name,
              resourceId: preset.room.resourceId,
              path: preset.room.path
            }
          ) : selectedRoom;
          
          const currentAvatar = preset.avatar ? {
            gender: preset.avatar.gender || 'male',
            parts: {},
            colors: preset.avatar.colors || {},
            resourceIds: {}
          } : avatarConfig;
          
          // Convert parts from preset format to internal format for logging
          if (preset.avatar && preset.avatar.parts) {
            Object.keys(preset.avatar.parts).forEach(partKey => {
              const part = preset.avatar.parts![partKey];
              if (part && typeof part === 'object' && part.path) {
                currentAvatar.parts[partKey] = part.path;
                if (part.resourceId) {
                  currentAvatar.resourceIds![partKey] = part.resourceId;
                }
              }
            });
          }
          
          sceneConfigLogger.logFullSceneConfig(
            currentRoom,
            currentAvatar,
            preset.items || [],
            `manifest_loaded_${presetId}`
          );
        }, 500); // Delay to ensure all state updates are complete
      }
    } catch (error) {
      console.error('❌ [IntegratedApp] Error loading manifest:', error);
      toast.error('Failed to load manifest');
    }
  };

  const handleManifestSave = async (manifestName: string, config: PresetConfig) => {
    try {
      console.log('📋 [IntegratedApp] Saving manifest:', manifestName);
      console.log('📋 [IntegratedApp] Current loadedItems state:', loadedItems);
      console.log('📋 [IntegratedApp] LoadedItems count:', loadedItems.length);
      console.log('📋 [IntegratedApp] Config to save:', config);
      
      await manifestService.createPreset(manifestName, config, `Scene configuration: ${manifestName}`);
      toast.success(`Manifest "${manifestName}" saved successfully!`);
    } catch (error) {
      console.error('❌ [IntegratedApp] Error saving manifest:', error);
      toast.error('Failed to save manifest');
    }
  };

  const handleManifestDelete = async (presetId: string) => {
    try {
      console.log('📋 [IntegratedApp] Deleting manifest:', presetId);
      await manifestService.deletePreset(presetId);
      toast.success('Manifest deleted successfully!');
    } catch (error) {
      console.error('❌ [IntegratedApp] Error deleting manifest:', error);
      toast.error('Failed to delete manifest');
    }
  };

  return (
    <div className="website-layout">
      {/* Website Header - Pure Web Content */}
      <header className="website-header">
        <div className="container">
          <h1>
            <span
              style={{ 
                height: '40px', 
                lineHeight: '40px',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#4338ca',
                cursor: 'pointer',
                verticalAlign: 'middle'
              }}
              onClick={() => window.location.reload()}
            >
              🏠 MyRoom Service
            </span>
          </h1>
          <nav className="main-nav">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.reload();
              }}
            >
              Home
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Services
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('footer-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              About
            </a>
          </nav>
        </div>
      </header>

      {/* Website Main Content */}
      <main className="website-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <h2>Welcome to MyRoom Service</h2>
            <p>Explore our 3D room and avatar system embedded seamlessly into any website</p>
          </div>
          <div>
            <br />
          </div>
          <div>
            <br />
          </div>
          <div className="container">
            <button className="cta-button" onClick={() => setShowIntegrationGuide(true)}>
              Get Started Now
            </button>
          </div>
        </section>

        {/* Embedded 3D Application Container */}
        <section className="embedded-app-section">
          <div className="container">
            <h3>Interactive 3D Experience</h3>
            <div className="app-embed-container">
              {/* This is the embedded MyRoom & Avatar application */}
              <div className="interactive-room-container">
                <div className="babylon-scene-container">
                  {/* Only render IntegratedBabylonScene when selectedRoom has valid data */}
                  {selectedRoom.resourceId || selectedRoom.path ? (
    <IntegratedBabylonScene
      ref={integratedSceneRef}
      roomPath={selectedRoom.path}
      roomResourceId={selectedRoom.resourceId}
      avatarConfig={avatarConfig}
      activeMovement={activeMovement}
      touchMovement={touchMovement}
      loadedItems={loadedItems}
      onSceneReady={setBabylonScene}
      gizmoMode={gizmoMode}
      onGizmoModeChange={setGizmoMode}
      selectedItem={selectedItem}
      onSelectItem={setSelectedItem}
      onItemTransformChange={handleItemTransformChange}
      onToggleUIOverlay={handleToggleAvatarOverlay}
      onToggleRoomPanel={handleToggleRoomOverlay}
      onToggleFullscreen={handleToggleFullscreen}
    />
  ) : (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666' }}>
      Loading room data...
    </div>
  )}
                </div>

                {/* Movement Instructions */}
                <div
                  className="movement-instructions"
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    fontSize: '0.9em',
                    textAlign: 'left',
                    padding: '10px',
                    background: 'rgba(249, 249, 249, 0.8)',
                    borderRadius: '4px',
                    zIndex: 1000,
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(5px)',
                  }}
                >
                  <strong>Control instructions:</strong>
                  <br />
                  <span>
                    Click and hold the left mouse button to orbit the camera <br />
                    Double-click to move your character
                  </span>
                </div>

                {/* Integrated UI Controls Overlay - Docked to Right */}
                {showAvatarOverlay && (
                  <div
                    className={`integrated-ui-overlay ${ultraCompactMode ? 'ultra-compact' : compactMode ? 'compact-mode' : ''
                      }`}
                  >
                    {/* Manifest Controls */}
                    <div className="control-section">
                      <div className="section-header">
                        <h3>📋 Manifest</h3>
                      </div>
                      <ManifestDropdown
                        currentConfig={getCurrentConfig()}
                        onGetCurrentConfig={getCurrentConfig}
                        onManifestSelect={handleManifestSelect}
                        onManifestSave={handleManifestSave}
                        onManifestDelete={handleManifestDelete}
                      />
                    </div>

                    {/* Avatar Controls */}
                    {availablePartsData[avatarConfig.gender] ? (
                      <div className="control-section">
                        <div className="section-header">
                          <h3>👥 Avatar</h3>
                        </div>
                        <div className="parts-grid">
                          {/* Gender Control */}
                          <div className="control-group compact-control">
                            <div className="control-row">
                              <label htmlFor="gender-select">Gender:</label>
                              <select
                                id="gender-select"
                                value={avatarConfig.gender}
                                onChange={(e) => handleGenderChange(e.target.value as Gender)}
                              >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </select>
                            </div>
                          </div>

                          {/* Render selectable parts */}
                          {Object.entries(
                            availablePartsData[avatarConfig.gender].selectableParts
                          ).map(([partType, items]: [string, any[]]) => {
                            const currentSelection = avatarConfig.parts[partType] || '';
                            const currentColor =
                              avatarConfig.colors[partType] ||
                              availablePartsData[avatarConfig.gender].defaultColors[partType] ||
                              '#ffffff';
                            return (
                              <div key={partType} className="control-group">
                                <div className="control-row">
                                  <label htmlFor={`${partType}-select`}>
                                    {partType.charAt(0).toUpperCase() + partType.slice(1)}:
                                  </label>
                                  <select
                                    id={`${partType}-select`}
                                    value={currentSelection}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      handlePartChange(partType, value === '' ? null : value);
                                    }}
                                  >
                                    {items.map((item: any, index: number) => (
                                      <option key={item.fileName || item.name || index} value={item.fileName || ''}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {/* Color picker (optional)
                              <div className="control-row">
                                <label htmlFor={`${partType}-color`}>Color:</label>
                                <input
                                  id={`${partType}-color`}
                                  type="color"
                                  value={currentColor}
                                  onChange={(e) => handleColorChange(partType, e.target.value)}
                                />
                              </div>
                              */}
                              </div>
                            );
                          })}
                        </div>

                        {/* Save/Load Controls */}
                        <div className="control-group">
                          <button onClick={handleSaveAvatar} className="save-button">
                            💾 Save Avatar
                          </button>
                          <div className="file-input-wrapper">
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleLoadAvatar}
                              id="load-avatar-input"
                              className="file-input"
                            />
                            <label htmlFor="load-avatar-input" className="load-button">
                              📁 Load Avatar
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="control-section">Error: Core avatar data unavailable.</div>
                    )}
                  </div>
                )}

                {showRoomOverlay && (
                  <div
                    className={`integrated-ui-overlay ${ultraCompactMode ? 'ultra-compact' : compactMode ? 'compact-mode' : ''
                      }`}
                  >
                    {/* Manifest Controls */}
                    <div className="control-section">
                      <div className="section-header">
                        <h3>📋 Manifest</h3>
                      </div>
                      <ManifestDropdown
                        currentConfig={getCurrentConfig()}
                        onGetCurrentConfig={getCurrentConfig}
                        onManifestSelect={handleManifestSelect}
                        onManifestSave={handleManifestSave}
                        onManifestDelete={handleManifestDelete}
                      />
                    </div>

                    {/* Room Controls */}
                    <div className="control-section">
                      <div className="section-header">
                        <h3>🏠 Room</h3>
                      </div>
                      <div className="room-selector">
                        <select
                          value={selectedRoom.resourceId}
                          onChange={(e) => {
                            const room = availableRooms.find((r) => r.resourceId === e.target.value);
                            if (room) setSelectedRoom(room);
                          }}
                          className="room-select"
                        >
                          {availableRooms.map((room) => (
                            <option key={room.resourceId} value={room.resourceId}>
                              {room.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Items Controls */}
                    <div className="control-section">
                      <div className="section-header">
                        <h3>🪑 Categories</h3>
                      </div>

                      {/* Single-panel toggle: show either category list or items list */}
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {!selectedCategory ? (
                          // Category panel
                          <div style={{ minWidth: 140, flex: '0 0 220px' }}>
                            <div
                              className="item-categories"
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8,
                                justifyContent: 'center',
                              }}
                            >
                              {categories.map((category) => (
                                <button
                                  key={category}
                                  className="item-category-btn"
                                  style={{
                                    padding: '8px 14px',
                                    borderRadius: 6,
                                    border: '1px solid #d9d9d9',
                                    background: '#fff',
                                    color: '#333',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: 13,
                                    transition: 'all 0.2s',
                                    outline: 'none',
                                    width: 105,
                                    maxWidth: 110,
                                    boxSizing: 'border-box',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                  }}
                                  onClick={() => setSelectedCategory(category)}
                                >
                                  {category}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          // Items panel
                          <div
                            style={{
                              minWidth: 220,
                              flex: '0 0 220px',
                              background: '#fafbfc',
                              padding: 12,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                            }}
                          >
                            {/* Back button */}
                            <button
                              onClick={() => setSelectedCategory(null)}
                              style={{
                                alignSelf: 'flex-start',
                                marginBottom: 8,
                                background: 'none',
                                border: 'none',
                                color: '#1890ff',
                                fontSize: 18,
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: 0,
                              }}
                            >
                              <span style={{ fontSize: 20, marginRight: 4 }}>←</span> Back
                            </button>

                            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 16 }}>
                              {selectedCategory}
                            </div>

                            <div
                              className="item-list-buttons"
                              style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}
                            >
                              {filteredItems.map((item) => (
                                <button
                                  key={item.path}
                                  type="button"
                                  className={`item-list-btn${selectedItemPerCategory[selectedCategory]?.path === item.path ? ' selected' : '' }`}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    border:
                                      selectedItemPerCategory[selectedCategory]?.path === item.path
                                        ? '2px solid #1890ff'
                                        : '1px solid #d9d9d9',
                                    background:
                                      selectedItemPerCategory[selectedCategory]?.path === item.path
                                        ? '#e6f7ff'
                                        : '#fff',
                                    color: '#333',
                                    textAlign: 'left',
                                    fontWeight: 400,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    marginBottom: 2,
                                  }}
                                  onClick={() => {
                                    setSelectedItemPerCategory((prev) => ({ ...prev, [selectedCategory]: item }));
                                  }}
                                >
                                  {item.name}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={handleAddItem}
                              className="add-item-btn"
                              disabled={!selectedItemPerCategory[selectedCategory]}
                              style={{
                                marginTop: 8,
                                padding: '8px 16px',
                                borderRadius: 6,
                                background: '#1890ff',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 500,
                                fontSize: 15,
                                cursor: !selectedItemPerCategory[selectedCategory] ? 'not-allowed' : 'pointer',
                                opacity: !selectedItemPerCategory[selectedCategory] ? 0.6 : 1,
                                transition: 'all 0.2s',
                              }}
                            >
                              ➕ Add Item
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="loaded-items-list">
                        <hr />
                        <h4>Items in Room ({loadedItems.length}):</h4>
                        {loadedItems.length === 0 ? (
                          <p className="no-items">No items yet</p>
                        ) : (
                          <ul className="items-list">
                            {loadedItems.map((item) => {
                              const isSelected = selectedItem && (selectedItem.name === item.id || selectedItem.id === item.id);
                              return (
                                <li 
                                  key={item.id} 
                                  className="item-entry"
                                  style={{
                                    background: isSelected ? '#e6f7ff' : 'transparent',
                                    border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                    borderRadius: '4px',
                                    padding: '8px',
                                    margin: '4px 0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <span style={{ 
                                    fontWeight: isSelected ? 'bold' : 'normal',
                                    color: isSelected ? '#1890ff' : '#333'
                                  }}>
                                    {isSelected ? '🎯 ' : ''}{item.name}
                                  </span>
                                  <button 
                                    onClick={() => handleRemoveItem(item.id)} 
                                    className="remove-item-btn"
                                    style={{
                                      background: '#ff4d4f',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      padding: '4px 8px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✕
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <div className="item-actions">
                          <button onClick={handleClearAllItems} className="clear-items-btn">
                            🗑️ Clear All
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features-section" className="features-section">
          <div className="container">
            <h3>MyRoom Features</h3>
            <div className="features-grid">
              <div className="feature-card">
                <h4>🏠 Interactive Rooms</h4>
                <p>Explore beautifully designed 3D rooms.</p>
              </div>
              <div className="feature-card">
                <h4>👥 Customizable Avatars</h4>
                <p>Create and customize your avatar with many options.</p>
              </div>
              <div className="feature-card">
                <h4>🪑 Dynamic Items</h4>
                <p>Add and remove furniture to personalize your room.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Guide Modal */}
        {showIntegrationGuide && (
          <div
            className={`integration-guide-modal ${isClosing ? 'fade-out' : ''}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeIntegrationGuide();
              }
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2>Integration Guide</h2>
                <button className="close-button" onClick={closeIntegrationGuide}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="integration-tabs">
                  <div className="tab-headers">
                    <button
                      className={`tab-button ${activeTab === 'iframe' ? 'active' : ''}`}
                      onClick={() => handleTabChange('iframe')}
                    >
                      Iframe Integration
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'webcomponent' ? 'active' : ''}`}
                      onClick={() => handleTabChange('webcomponent')}
                    >
                      Web Component
                    </button>
                  </div>

                  <div className="tab-content">
                    {/* Iframe tab */}
                    <div className={`tab-pane ${activeTab === 'iframe' ? 'active' : ''}`}>
                      <h4>Demo Page</h4>
                      <p>
                        <a href="https://myroom.petarainsoft.com/iframe-demo.html">Iframe integration demo</a>
                      </p>
                      <h4>Instruction</h4>
                      <p>The simplest way to embed MyRoom into the website is using an iframe.</p>

                      <div className="code-block">
                        <pre>
                          <code>{`<iframe 
  src="${domainConfig.baseDomain}/embed.html?room=/models/rooms/cate001/MR_KHROOM_0001.glb&gender=female" 
  width="800" 
  height="600" 
  style="border: none; border-radius: 8px;" 
  allow="fullscreen">
</iframe>`}</code>
                        </pre>
                        <button
                          className="copy-button"
                          onClick={() =>
                            handleCopyCode(`<iframe 
  src="${domainConfig.baseDomain}/embed.html?room=/models/rooms/cate001/MR_KHROOM_0001.glb&gender=female" 
  width="800" 
  height="600" 
  style="border: none; border-radius: 8px;" 
  allow="fullscreen">
</iframe>`)
                          }
                        >
                          Copy Code
                        </button>
                      </div>

                      <h4>URL Parameters</h4>
                      <p>Customize your embedded MyRoom content with these parameters:</p>

                      <table className="params-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Description</th>
                            <th>Example</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>room</td>
                            <td>Path to the room model</td>
                            <td>
                              /models/rooms/cate001/MR_KHROOM_0001.glb
                              <br />
                              /models/rooms/cate001/MR_KHROOM_0002.glb
                              <br />
                              /models/rooms/cate002/MR_KHROOM_0003glb
                            </td>
                          </tr>
                          <tr>
                            <td>gender</td>
                            <td>Avatar gender (male/female)</td>
                            <td>female</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Web component tab */}
                    <div className={`tab-pane ${activeTab === 'webcomponent' ? 'active' : ''}`}>
                      <h4>Demo Page</h4>
                      <p>
                        <a href="https://myroom.petarainsoft.com/webcomponent-simple-demo.html">
                          Web Component integration demo
                        </a>
                      </p>
                      <h4>Instruction</h4>
                      <p>You can use Web Component for advanced features and deeper integration.</p>

                      <p>Step 1: Include the Script.</p>
                      <div className="code-block">
                        <pre>
                          <code>{`<script src="${getWebComponentUrl()}"></script>`}</code>
                        </pre>
                        <button
                          className="copy-button"
                          onClick={() => handleCopyCode(`<script src="${getWebComponentUrl()}"></script>`)}
                        >
                          Copy Code
                        </button>
                      </div>

                      <p>Step 2: Use the Component.</p>
                      <div className="code-block">
                        <pre>
                          <code>{`<my-room-scene 
  id="mainScene"
  room="/models/rooms/cate001/MR_KHROOM_0001.glb"
  gender="female"
  width="100%"
  height="600px">
</my-room-scene>`}</code>
                        </pre>
                        <button
                          className="copy-button"
                          onClick={() =>
                            handleCopyCode(`<my-room-scene 
  id="mainScene"
  room="/models/rooms/cate001/MR_KHROOM_0001.glb"
  gender="female"
  width="100%"
  height="600px">
</my-room-scene>`)
                          }
                        >
                          Copy Code
                        </button>
                      </div>

                      <p>Step 3: Customize the web component with these parameters:</p>

                      <table className="params-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Description</th>
                            <th>Example</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>id</td>
                            <td>Unique identifier for the component</td>
                            <td>mainScene</td>
                          </tr>
                          <tr>
                            <td>room</td>
                            <td>Path to the room model</td>
                            <td>
                              /models/rooms/cate001/MR_KHROOM_0001.glb
                              <br />
                              /models/rooms/cate001/MR_KHROOM_0002.glb
                              <br />
                              /models/rooms/cate002/MR_KHROOM_0003.glb
                            </td>
                          </tr>
                          <tr>
                            <td>gender</td>
                            <td>Avatar gender (male/female)</td>
                            <td>female</td>
                          </tr>
                          <tr>
                            <td>width</td>
                            <td>Component width</td>
                            <td>100%</td>
                          </tr>
                          <tr>
                            <td>height</td>
                            <td>Component height</td>
                            <td>600px</td>
                          </tr>
                        </tbody>
                      </table>

                      <h4>JavaScript API</h4>
                      <p>Interact with the component using JavaScript:</p>

                      <div className="code-block">
                        <pre>
                          <code>{`// Get reference to the component
const mainScene = document.getElementById('mainScene');

// Change avatar gender
mainScene.setAttribute('gender', 'male');
// or
mainScene.setAttribute('gender', 'female');

// Change room
mainScene.setAttribute('room', '/models/rooms/cate002/MR_KHROOM_0003.glb');

// Customize avatar with detailed configuration
const avatarConfig = {
  "gender": "male",
  "parts": {
    "body": "/models/male/male_body/male_body.glb",
    "hair": "/models/male/male_hair/male_hair_001.glb",
    "fullset": "/models/male/male_fullset/male_fullset_003.glb"
  }
};
if (mainScene && mainScene.changeAvatar) {
  mainScene.changeAvatar(avatarConfig);
}

// Add items to the scene
const items = [{
  "id": "item_001",
  "name": "Chair",
  "path": "/models/items/catelv1_01/catelv2_01/catelv3_01/MR_CHAIR_0001.glb",
  "position": { "x": 0.37, "y": 0, "z": -0.67 },
  "rotation": { "x": 0, "y": 0, "z": 0 },
  "scale": { "x": 1, "y": 1, "z": 1 }
}];
if (mainScene && mainScene.loadItems) {
  mainScene.loadItems(items);
}

// Listen for events
mainScene.addEventListener('scene-ready', (event) => {
  console.log('Scene loaded:', event.detail.scene);
});

mainScene.addEventListener('avatar-changed', (event) => {
  console.log('Avatar changed:', event.detail);
});`}</code>
                        </pre>
                        <button
                          className="copy-button"
                          onClick={() =>
                            handleCopyCode(`// Get reference to the component
const mainScene = document.getElementById('mainScene');

// Change avatar gender
mainScene.setAttribute('gender', 'male');
// or
mainScene.setAttribute('gender', 'female');

// Change room
mainScene.setAttribute('room', '/models/rooms/cate002/MR_BEDROOM_0001.glb');

// Customize avatar with detailed configuration
const avatarConfig = {
  "gender": "male",
  "parts": {
    "body": "/models/male/male_body/male_body.glb",
    "hair": "/models/male/male_hair/male_hair_001.glb",
    "fullset": "/models/male/male_fullset/male_fullset_003.glb"
  },
  "colors": {
    "hair": "#4A301B",
    "top": "#1E90FF"
  }
};
if (mainScene && mainScene.changeAvatar) {
  mainScene.changeAvatar(avatarConfig);
}

// Add items to the scene
const items = [{
  "id": "item_001",
  "name": "Chair",
  "path": "/models/items/catelv1_01/catelv2_01/catelv3_01/MR_CHAIR_0001.glb",
  "position": { "x": 0.37, "y": 0, "z": -0.67 },
  "rotation": { "x": 0, "y": 0, "z": 0 },
  "scale": { "x": 1, "y": 1, "z": 1 }
}];
if (mainScene && mainScene.loadItems) {
  mainScene.loadItems(items);
}

// Camera controls
if (mainScene && mainScene.resetCamera) {
  mainScene.resetCamera();
}

// Listen for events
mainScene.addEventListener('scene-ready', (event) => {
  console.log('Scene loaded:', event.detail.scene);
});

mainScene.addEventListener('avatar-changed', (event) => {
  console.log('Avatar changed:', event.detail);
});`)
                          }
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer of modal */}
                <div className="modal-footer">
                  <button className="primary-button" onClick={closeIntegrationGuide}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Website Footer */}
      <footer id="footer-section" className="website-footer">
        <div className="container">
          <div className="footer-content">
            <div id="feature-section-id" className="footer-section">
              <h4>Company</h4>
              <ul>
                <li>
                  <a href="https://petarainsoft.com">About Us</a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Products</h4>
              <ul>
                <li>
                  <a href="https://petarainsoft.com">3D Graphics Services</a>
                </li>
                <li>
                  <a href="https://petarainsoft.com">Web Services</a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li>
                  <a href="https://petarainsoft.com">Contact</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Petarainsoft - MyRoom Service.</p>
          </div>
        </div>
      </footer>
      
      {/* GLB Cache Debug Panel */}
      <CacheDebugPanel />
    </div>
  );

};

// CSS for Integration Guide Modal
const modalStyles = `
  .integration-guide-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    animation: fadeIn 0.15s ease-out;
  }

  .integration-guide-modal.fade-out {
    animation: fadeOutSlideDown 0.15s ease-out; /* Fade-out animation */
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOutSlideDown {
  from {
    opacity: 1;
    transform: translateY(0); /* Start at the current position */
  }
  to {
    opacity: 0;
    transform: translateY(20px); /* Slide up by 20px */
  }
}
  
  .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 900px;
    height: 70vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
    overflow: hidden;
  }
  
  @keyframes slideIn {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 30px;
    border-bottom: 1px solid #eee;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #999;
    transition: color 0.2s;
  }
  
  .close-button:hover {
    color: #333;
  }
  
  .modal-body {
    padding: 20px 30px;
    overflow-y: auto;
    flex: 1;
  }
  
  .modal-footer {
    padding: 15px 30px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  .primary-button, .secondary-button {
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .primary-button {
    background-color: #4CAF50;
    color: white;
    border: none;
  }
  
  .primary-button:hover {
    background-color: #3e8e41;
  }
  
  .secondary-button {
    background-color: white;
    color: #333;
    border: 1px solid #ddd;
    text-decoration: none;
  }
  
  .secondary-button:hover {
    background-color: #f5f5f5;
  }
  
  /* Tabs Styling */
  .integration-tabs {
    margin-bottom: 30px;
  }
  
  .tab-headers {
    display: flex;
    border-bottom: 1px solid #ddd;
    margin-bottom: 20px;
  }
  
  .tab-button {
    padding: 12px 24px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    font-size: 16px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
    outline: none;
  }
  
  .tab-button:hover {
    color: #333;
    outline: none;
  }

  .tab-button:focus {
    outline: none;
  }
  
  .tab-button.active {
    color: #4CAF50;
    border-bottom-color: #4CAF50;
    outline: none;
  }
  
  .tab-content {
    position: relative;
  }
  
  .tab-pane {
    display: none;
    animation: fadeIn 0.3s ease-out;
  }
  
  .tab-pane.active {
    display: block;
  }
  
  /* Code Block Styling */
  .code-block {
    background-color: #f5f5f5;
    border-radius: 6px;
    margin: 15px 0 25px;
    position: relative;
    overflow: hidden;
  }
  
  .code-block pre {
    margin: 0;
    padding: 20px;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
  }
  
  .code-block code {
    display: block;
  }
  
  .copy-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .copy-button:hover {
    background-color: white;
    border-color: #bbb;
  }
  
  /* Table Styling */
  .params-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0 25px;
    font-size: 14px;
  }
  
  .params-table th, .params-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  .params-table th {
    background-color: #f5f5f5;
    font-weight: 600;
  }
  
  .params-table tr:last-child td {
    border-bottom: none;
  }
  
  /* Notes Section */
  .integration-notes {
    background-color: #f9f9f9;
    border-left: 4px solid #4CAF50;
    padding: 15px 20px;
    margin-top: 30px;
    border-radius: 0 4px 4px 0;
  }
  
  .integration-notes h4 {
    margin-top: 0;
    color: #333;
  }
  
  .integration-notes ul {
    margin-bottom: 0;
    padding-left: 20px;
  }
  
  .integration-notes li {
    margin-bottom: 8px;
    line-height: 1.5;
  }
  
  .integration-notes li:last-child {
    margin-bottom: 0;
  }
  
  .integration-notes a {
    color: #4CAF50;
    text-decoration: none;
  }
  
  .integration-notes a:hover {
    text-decoration: underline;
  }
`;

export default IntegratedApp;