import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IntegratedBabylonScene } from '../../shared/components/babylon/IntegratedBabylonScene';
// AvatarControls inlined below
import { getDefaultConfigForGender, availablePartsData } from '../../shared/data/avatarPartsData';
import { AvatarConfig, AvailableParts, Gender } from '../../shared/types/AvatarTypes';
import { ActiveMovement, TouchMovement } from '../../shared/types/AvatarTypes';
import { domainConfig, getEmbedUrl, getWebComponentUrl } from '../../shared/config/appConfig';
import './App.css';
import './IntegratedApp.css';

type AppMode = 'room' | 'avatar' | 'integrated';

const IntegratedApp: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('integrated');
  const [showModeSelector, setShowModeSelector] = useState(true);

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
  path: string;
  resourcePath?: string | null;
}
const availableRooms: Room[] = [
  { name: "Living Room", path: "/models/rooms/cate001/MR_KHROOM_0001.glb", resourcePath: null },
  { name: "Exercise Room", path: "/models/rooms/cate001/MR_KHROOM_0002.glb", resourcePath: null },
  { name: "Lounge Room", path: "/models/rooms/cate002/MR_KHROOM_0003.glb", resourcePath: null },
];

// Available items data
// const availableItems = [
//   { name: "Chair", path: "/models/items/catelv1_01/catelv2_01/catelv3_01/MR_CHAIR_0001.glb", category: "Chair" },
//   { name: "Light stand", path: "/models/items/catelv1_01/catelv2_01/catelv3_02/MR_LIGHTSTAND_0002.glb", category: "Light" },
//   { name: "Board", path: "/models/items/catelv1_02/catelv2_02/catelv3_02/MR_KH_BOARD_0001.glb", category: "Decor" },
//   { name: "Mirror", path: "/models/items/catelv1_02/catelv2_03/catelv3_02/MR_MIRROR_0001.glb", category: "Decor" },
// ];

interface Item {
  name: string;
  path: string;
  category: string;
  resourcePath?: string | null;
}
const availableItems: Item[] = [
  { name: "Chair", path: "/models/items/catelv1_01/catelv2_01/catelv3_01/MR_CHAIR_0001.glb", category: "Chair", resourcePath: null },
  { name: "Light stand", path: "/models/items/catelv1_01/catelv2_01/catelv3_02/MR_LIGHTSTAND_0002.glb", category: "Light", resourcePath: null },
  { name: "Board", path: "/models/items/catelv1_02/catelv2_02/catelv3_02/MR_KH_BOARD_0001.glb", category: "Decor", resourcePath: null },
  { name: "Mirror", path: "/models/items/catelv1_02/catelv2_03/catelv3_02/MR_MIRROR_0001.glb", category: "Decor", resourcePath: null },
];

interface LoadedItem {
  id: string;
  name: string;
  path: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  resourcePath?: string | null;
}

// Component integrating room and avatar with full UI controls
const InteractiveRoomWithAvatar: React.FC = () => {
  // Add state for availableItems
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedItemToAdd, setSelectedItemToAdd] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Room state management
  const [selectedRoom, setSelectedRoom] = useState(availableRooms[0]);

  // Items state management
  const [loadedItems, setLoadedItems] = useState<LoadedItem[]>([]);
  const [gizmoMode, setGizmoMode] = useState<'position' | 'rotation' | 'scale'>('position');

  // Auto-reset gizmo mode to position when item is selected
  useEffect(() => {
    if (selectedItem) {
      setGizmoMode('position');
    }
  }, [selectedItem]);

  // Check if selected item still exists in loaded items
  useEffect(() => {
    if (selectedItem) {
      const itemExists = loadedItems.some(item => item.id === selectedItem.name);
      if (!itemExists) {
        setSelectedItem(null);
      }
    }
  }, [loadedItems, selectedItem]);

  // Fetch available items from items-manifest.json
  useEffect(() => {
    fetch('/manifest/item/items-manifest.json')
      .then((res) => res.json())
      .then((data) => {
        setAvailableItems(data.items || []);
        // Set default selected item if not already set
        if (!selectedItemToAdd && data.items && data.items.length > 0) {
          setSelectedItemToAdd(data.items[0]);
        }
      });
  }, []);

  // Avatar state management
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
  const [showIntegrationGuide, setShowIntegrationGuide] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // New state for fade-out effect
  const [activeTab, setActiveTab] = useState('iframe');

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
        } else {
          // When removing fullset, just clear it
          newConfig.parts = {
            ...newConfig.parts,
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
        } else {
          newConfig.parts = {
            ...newConfig.parts,
            [partType]: fileName
          };
        }
      } else {
        // For other parts, just update normally
        newConfig.parts = {
          ...newConfig.parts,
          [partType]: fileName
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
    const saveData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      room: {
        name: selectedRoom.name,
        path: selectedRoom.path,
        resourcePath: selectedRoom.resourcePath
      },
      avatar: avatarConfig,
      items: loadedItems.map(item => ({
        id: item.id,
        name: item.name,
        path: item.path,
        position: item.position,
        rotation: item.rotation || { x: 0, y: 0, z: 0 },
        scale: item.scale || { x: 1, y: 1, z: 1 },
        resourcePath: item.resourcePath
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
            const roomToLoad = availableRooms.find(room => room.path === data.room.path);
            if (roomToLoad) {
              setSelectedRoom(roomToLoad);
            }

            // Load avatar
            setAvatarConfig(data.avatar);

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
    // Constrain position within 4x4 area centered at (0,0,0)
    // Random position between -2 and 2 for both X and Z
    const randomX = Math.random() * 4 - 2;
    const randomZ = Math.random() * 4 - 2;
    const constrainedX = Math.max(-2, Math.min(2, randomX));
    const constrainedZ = Math.max(-2, Math.min(2, randomZ));
    const newItem: LoadedItem = {
      id: `item_${Date.now()}` ,
      name: selectedItemToAdd.name,
      path: selectedItemToAdd.path,
      position: { x: constrainedX, y: 0, z: constrainedZ },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      resourcePath: selectedItemToAdd.resourcePath
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

  return (
    <div className="website-layout">
      {/* Website Header - Pure Web Content */}
      <header className="website-header">
        <div className="container">
          <h1>
            <img
              src="/icon/petarainlogo.png"
              alt="Petarainsoft - MyRoom Service"
              style={{ height: '40px', verticalAlign: 'middle', cursor: 'pointer' }}
              onClick={() => window.location.reload()} // Refresh the page when clicking the logo
            />
          </h1>
          <nav className="main-nav">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.reload(); // Refresh the page when clicking Home
              }}
            >Home</a>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>Services</a>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              document.getElementById('footer-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>About</a>
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
          <div><br></br></div>
          <div><br></br></div>
          <div className="container">
            {/* <h3>Ready to Get Started?</h3> */}
            {/* <p>It only takes a couple of minutes to integrate our 3D room and avatar into your website.</p> */}
            <button className="cta-button" onClick={() => setShowIntegrationGuide(true)}>Get Started Now</button>
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
                  <IntegratedBabylonScene
                    ref={integratedSceneRef}
                    roomPath={selectedRoom.path}
                    roomResourcePath={selectedRoom.resourcePath}
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
                  />



                </div>

                {/* Movement Instructions */}
                <div className="movement-instructions" style={{
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
                  backdropFilter: 'blur(5px)'
                }}>
                  <strong>Control instructions:</strong><br />
                  <span>
                    Click and hold the left mouse button to orbit the camera <br />
                    Double-click to move your character  <br />
                    {/* Mouse right Click hold / 2 fingers to pan camera */}
                  </span>
                </div>

                {/* Integrated UI Controls Overlay - Docked to Right */}
                {showAvatarOverlay && (
                  <div className={`integrated-ui-overlay ${ultraCompactMode ? 'ultra-compact' : compactMode ? 'compact-mode' : ''}`}>
                    {/* Avatar Controls */}
                    {availablePartsData[avatarConfig.gender] ? (
                      <div className="control-section">
                        <div className="section-header">
                          <h3>👥 Avatar</h3>
                        </div>
                        <div className="parts-grid">
                          {/* Gender Control as first item */}
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
                          {Object.entries(availablePartsData[avatarConfig.gender].selectableParts).map(([partType, items]: [string, any[]]) => {
                            const currentSelection = avatarConfig.parts[partType] || null;
                            const currentColor = avatarConfig.colors[partType] || availablePartsData[avatarConfig.gender].defaultColors[partType] || "#ffffff";
                            return (
                              <div key={partType} className="control-group">
                                <div className="control-row">
                                  <label htmlFor={`${partType}-select`}>
                                    {partType.charAt(0).toUpperCase() + partType.slice(1)}:
                                  </label>
                                  <select
                                    id={`${partType}-select`}
                                    value={currentSelection || ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      handlePartChange(partType, value === "" ? null : value);
                                    }}
                                  >
                                    {items.map((item: any, index: number) => (
                                      <option key={index} value={item.fileName || ""}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {/* Uncomment for color picker
                              <div className="control-row">
                                <label htmlFor={`${partType}-color`}>Color:</label>
                                <input
                                  id={`${partType}-color`}
                                  type="color"
                                  value={currentColor}
                                  onChange={(e) => handleColorChange(partType, e.target.value)}
                                />
                              </div> */}
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
                  <div className={`integrated-ui-overlay ${ultraCompactMode ? 'ultra-compact' : compactMode ? 'compact-mode' : ''}`}>
                    {/* Room Controls */}
                    <div className="control-section">
                      <div className="section-header">
                        <h3>🏠 Room</h3>
                      </div>
                      <div className="room-selector">
                        {/* <label>Select Room:</label> */}
                        <select
                          value={selectedRoom.path}
                          onChange={(e) => {
                            const room = availableRooms.find(r => r.path === e.target.value);
                            if (room) setSelectedRoom(room);
                          }}
                          className="room-select"
                        >
                          {availableRooms.map((room) => (
                            <option key={room.path} value={room.path}>
                              {room.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* <div className="camera-controls">
                          <button onClick={() => integratedSceneRef.current?.resetCamera()} className="reset-camera-btn">
                            📷 Reset Camera View
                          </button>
                        </div> */}
                    </div>

                    {/* Items Controls */}
                    <div className="control-section">
                      <div className="section-header">
                        <h3>🪑 Categories</h3>
                      </div>
                      {/* Category List */}
                      <div className="item-categories" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        {categories.map(category => (
                          <button
                            key={category}
                            className={`item-category-btn${selectedCategory === category ? ' selected' : ''}`}
                            style={{
                              padding: '5px 14px 8px',
                              borderRadius: 12,
                              border: '1px solid #d9d9d9',
                              background: selectedCategory === category ? '#1890ff' : '#fff',
                              color: selectedCategory === category ? '#fff' : '#333',
                              cursor: 'pointer',
                              fontWeight: 500,
                              fontSize: 14,
                              transition: 'all 0.2s',
                              marginBottom: 2
                            }}
                            onClick={() => setSelectedCategory(category)}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                      {/* Item List for selected category */}
                      {selectedCategory && (
                        <div className="item-selector" style={{ marginBottom: 12 }}>
                          <div className="item-list-buttons" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filteredItems.map((item) => (
                              <button
                                key={item.path}
                                type="button"
                                className={`item-list-btn${selectedItemPerCategory[selectedCategory]?.path === item.path ? ' selected' : ''}`}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: 6,
                                  border: selectedItemPerCategory[selectedCategory]?.path === item.path ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                  background: selectedItemPerCategory[selectedCategory]?.path === item.path ? '#e6f7ff' : '#fff',
                                  color: '#333',
                                  textAlign: 'left',
                                  fontWeight: 400,
                                  fontSize: 14,
                                  cursor: 'pointer',
                                  outline: 'none',
                                  transition: 'all 0.2s',
                                  marginBottom: 2
                                }}
                                onClick={() => {
                                  setSelectedItemPerCategory(prev => ({ ...prev, [selectedCategory]: item }));
                                }}
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="item-actions">
                        <button onClick={handleAddItem} className="add-item-btn" disabled={!selectedCategory || !selectedItemPerCategory[selectedCategory]}>
                          ➕ Add Item
                        </button>
                      </div>
                      <div className="loaded-items-list">
                        <hr />
                        <h4>Items in Room ({loadedItems.length}):</h4>
                        {loadedItems.length === 0 ? (
                          <p className="no-items">No items yet</p>
                        ) : (
                          <ul className="items-list">
                            {loadedItems.map((item) => (
                              <li key={item.id} className="item-entry">
                                <span>{item.name}</span>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="remove-item-btn"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
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

        {/* Selected Item Transform Panel */}
        {selectedItem && (
          <div className="selected-item-panel" style={{
            position: 'fixed',
            top: '50%',
            right: '10px',
            transform: 'translateY(-50%)',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            minWidth: '250px',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            display: 'none'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>🎯 Selected Item</h4>
            <div style={{ marginBottom: '10px', fontSize: '14px' }}>
              <strong>Name:</strong> {selectedItem.name || 'Unknown Item'}
            </div>
            <div style={{ marginBottom: '15px', fontSize: '14px' }}>
              <strong>Mode:</strong>
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                borderRadius: '4px',
                // background: gizmoMode === 'position' ? '#2196F3' : gizmoMode === 'rotation' ? '#FF9800' : '#9C27B0',
                fontSize: '12px'
              }}>
                {gizmoMode === 'position' && 'Move'}
                {gizmoMode === 'rotation' && 'Rotate'}
                {gizmoMode === 'scale' && 'Scale'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.4' }}>
              <div style={{ marginBottom: '5px' }}>
                <strong>Position:</strong>
                <div style={{ marginLeft: '10px' }}>
                  X: {selectedItem.position?.x?.toFixed(2) || '0.00'}<br />
                  Y: {selectedItem.position?.y?.toFixed(2) || '0.00'}<br />
                  Z: {selectedItem.position?.z?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong>Rotation:</strong>
                <div style={{ marginLeft: '10px' }}>
                  X: {selectedItem.rotation?.x?.toFixed(2) || '0.00'}<br />
                  Y: {selectedItem.rotation?.y?.toFixed(2) || '0.00'}<br />
                  Z: {selectedItem.rotation?.z?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Scale:</strong>
                <div style={{ marginLeft: '10px' }}>
                  X: {selectedItem.scaling?.x?.toFixed(2) || '1.00'}<br />
                  Y: {selectedItem.scaling?.y?.toFixed(2) || '1.00'}<br />
                  Z: {selectedItem.scaling?.z?.toFixed(2) || '1.00'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              style={{
                width: '100%',
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = '#d32f2f')}
              onMouseOut={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = '#f44336')}
            >
              ❌ Deselect Item
            </button>
          </div>
        )}

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

        {/* Simple Info Section */}
        {/* <section className="info-section">
          <div className="container">
            <h3>🚀 Built with Modern Technology</h3>
            <p>This 3D experience is powered by Babylon.js and React, providing smooth 60fps performance across all modern browsers. Perfect for embedding interactive 3D content into any website.</p>
          </div>
        </section> */}

        {/* <section className="cta-section">
          <div className="container">
            <h3>Ready to Get Started?</h3>
            <p>It only takes a couple of minutes to integrate our 3D room and avatar into your website.</p>
            <button className="cta-button" onClick={() => setShowIntegrationGuide(true)}>Get Started Now</button>
          </div>
        </section> */}

        {/* Integration Guide Modal */}
        {showIntegrationGuide && (
          <div className={`integration-guide-modal ${isClosing ? 'fade-out' : ''}`}
            onClick={(e) => {
              // Close modal if the click is outside the modal content
              if (e.target === e.currentTarget) {
                closeIntegrationGuide();
              }
            }}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>Integration Guide</h2>
                <button className="close-button" onClick={() => closeIntegrationGuide()}>×</button>
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
                    <div className={`tab-pane ${activeTab === 'iframe' ? 'active' : ''}`}>
                      <h4>Demo Page</h4>
                      <p><a href="https://myroom.petarainsoft.com/iframe-demo.html">Iframe integration demo</a></p>
                      <h4>Instruction</h4>
                      <p>The simplest way to embed MyRoom into the website is using an iframe.</p>

                      <div className="code-block">
                        <pre><code>
                          {`<iframe 
  src="${domainConfig.baseDomain}/embed.html?room=/models/rooms/cate001/MR_KHROOM_0001.glb&gender=female" 
  width="800" 
  height="600" 
  style="border: none; border-radius: 8px;" 
  allow="fullscreen">
</iframe>`}
                        </code></pre>
                        <button
                          className="copy-button"
                          onClick={() => handleCopyCode(`<iframe 
  src="${domainConfig.baseDomain}/embed.html?room=/models/rooms/cate001/MR_KHROOM_0001.glb&gender=female" 
  width="800" 
  height="600" 
  style="border: none; border-radius: 8px;" 
  allow="fullscreen">
</iframe>`)}
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
                            <td>/models/rooms/cate001/MR_KHROOM_0001.glb
                              <br />/models/rooms/cate001/MR_KHROOM_0002.glb
                              <br />/models/rooms/cate002/MR_KHROOM_0003glb
                            </td>
                          </tr>
                          <tr>
                            <td>gender</td>
                            <td>Avatar gender (male/female)</td>
                            <td>female</td>
                          </tr>
                          {/* <tr>
                            <td>autoplay</td>
                            <td>Auto-start the scene (true/false)</td>
                            <td>true</td>
                          </tr> */}
                        </tbody>
                      </table>

                      {/* <h4>Communication with Parent Window</h4>
                      <p>The iframe can communicate with your parent window using postMessage:</p>
                      
                      <div className="code-block">
                        <pre><code>
{`// Listen for messages from the embedded MyRoom
window.addEventListener('message', (event) => {
  if (event.data.type === 'MYROOM_READY') {
    console.log('MyRoom is ready!');
  }
  if (event.data.type === 'AVATAR_CHANGED') {
    console.log('Avatar changed:', event.data.avatar);
  }
});

// Send commands to MyRoom
document.getElementById('myRoomIframe').contentWindow.postMessage({
  type: 'CHANGE_ROOM',
  roomPath: '/models/rooms/cate001/MR_KHROOM_0002.glb'
}, '*');`}
                        </code></pre>
                        <button 
                           className="copy-button"
                           onClick={() => handleCopyCode(`// Listen for messages from the embedded MyRoom
window.addEventListener('message', (event) => {
  if (event.data.type === 'MYROOM_READY') {
    console.log('MyRoom is ready!');
  }
  if (event.data.type === 'AVATAR_CHANGED') {
    console.log('Avatar changed:', event.data.avatar);
  }
});

// Send commands to MyRoom
document.getElementById('myRoomIframe').contentWindow.postMessage({
  type: 'CHANGE_ROOM',
  roomPath: '/models/rooms/cate001/MR_KHROOM_0002.glb'
}, '*');`)}
                         >
                           Copy Code
                         </button>
                      </div> */}
                    </div>

                    <div className={`tab-pane ${activeTab === 'webcomponent' ? 'active' : ''}`}>
                      <h4>Demo Page</h4>
                      <p><a href="https://myroom.petarainsoft.com/webcomponent-simple-demo.html">Web Component integration demo</a> </p>
                      <h4>Instruction</h4>
                      <p>You can use Web Componen for coming advanced features and deeper integration.</p>

                      <p>Step 1: Include the Script.</p>
                      <div className="code-block">
                        <pre><code>
                          {`<script src="${getWebComponentUrl()}"></script>`}
                        </code></pre>
                        <button
                          className="copy-button"
                          onClick={() => handleCopyCode(`<script src="${getWebComponentUrl()}"></script>`)}
                        >
                          Copy Code
                        </button>
                      </div>

                      <p>Step 2:  Use the Component.</p>
                      <div className="code-block">
                        <pre><code>
                          {`<my-room-scene> 
  id="mainScene"
  room="/models/rooms/cate001/MR_KHROOM_0001.glb"
  gender="female"
  width="100%"
  height="600px">
</my-room-scene>`}
                        </code></pre>
                        <button
                          className="copy-button"
                          onClick={() => handleCopyCode(`<my-room-scene> 
  id="mainScene"
  room="/models/rooms/cate001/MR_KHROOM_0001.glb"
  gender="female"
  width="100%"
  height="600px">
</my-room-scene>`)}
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
                            <td>/models/rooms/cate001/MR_KHROOM_0001.glb
                              <br />/models/rooms/cate001/MR_KHROOM_0002.glb
                              <br />/models/rooms/cate002/MR_KHROOM_0003.glb
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
                        <pre><code>
                          {`// Get reference to the component
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
});`}
                        </code></pre>
                        <button
                          className="copy-button"
                          onClick={() => handleCopyCode(`// Get reference to the component
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
});`)}
                        >
                          Copy Code
                        </button>
                      </div>

                      {/* <h4>4. Styling</h4>
                      <p>The component can be styled using CSS:</p>
                      
                      <div className="code-block">
                        <pre><code>
{`my-room-scene {
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}`}
                        </code></pre>
                        <button 
                           className="copy-button"
                           onClick={() => handleCopyCode(`my-room-scene {
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}`)}
                         >
                           Copy Code
                         </button>
                      </div> */}
                    </div>
                  </div>
                </div>

                {/* <div className="integration-notes">
                  <h4>📝 Notes</h4>
                  <ul>
                    <li>Ensure your server has proper CORS headers set up if hosting on a different domain.</li>
                    <li>The Web Component requires modern browsers that support Custom Elements v1.</li>
                    <li>For production use, we recommend implementing user authentication for the embed.</li>
                    <li>See our <a href="#">full documentation</a> for more advanced integration options.</li>
                  </ul>
                </div> */}
              </div>
              <div className="modal-footer">
                <button className="primary-button" onClick={() => closeIntegrationGuide()}>Close</button>
                {/* <a href="https://petarainsoft.com" className="secondary-button" target="_blank" rel="noopener noreferrer">Contact Support</a> */}
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
                <li><a href="https://petarainsoft.com">About Us</a></li>
                {/* <li><a href="https://petarainsoft.com">Careers</a></li> */}
                {/* <li><a href="#">Press</a></li> */}
              </ul>
            </div>
            <div className="footer-section">
              <h4>Products</h4>
              <ul>
                <li><a href="https://petarainsoft.com">3D Graphics Services</a></li>
                <li><a href="https://petarainsoft.com">Web Services</a></li>
                {/* <li><a href="#">API</a></li> */}
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                {/* <li><a href="#">Documentation</a></li> */}
                {/* <li><a href="#">Help Center</a></li> */}
                <li><a href="https://petarainsoft.com">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Petarainsoft - MyRoom Service.</p>
          </div>
        </div>
      </footer>
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