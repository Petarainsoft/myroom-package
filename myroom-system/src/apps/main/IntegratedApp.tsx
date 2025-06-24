import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IntegratedBabylonScene } from '../../shared/components/babylon/IntegratedBabylonScene';
import { AvatarControls } from '../../shared/components/avatar/AvatarControls';
import { AvatarConfig, getDefaultConfigForGender, availablePartsData } from '../../shared/data/avatarPartsData';
import { ActiveMovement, TouchMovement } from '../../shared/types/AvatarTypes';
import { domainConfig, getEmbedUrl, getWebComponentUrl } from '../../shared/config/appConfig';
import './App.css';
import '../../shared/components/avatar/AvatarControls.css';

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
      <div className="integrated-header">
        {/* <h1>🎮 Integrated Room & Avatar System</h1> */}
        {/* <button 
          className="back-btn"
          onClick={() => setShowModeSelector(true)}
        >
          ← Back
        </button> */}
      </div>
      
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
const availableRooms = [
  { name: "Living Room 1", path: "/models/rooms/cate001/MR_KHROOM_0001.glb" },
  { name: "Living Room 2", path: "/models/rooms/cate001/MR_KHROOM_0002.glb" },
  { name: "Bedroom", path: "/models/rooms/cate002/MR_KHROOM_0003.glb" },
];

// Available items data
const availableItems = [
  { name: "Chair", path: "/models/items/catelv1_01/catelv2_01/catelv3_01/MR_CHAIR_0001.glb", category: "Chair" },
    { name: "Light stand", path: "/models/items/catelv1_01/catelv2_01/catelv3_02/MR_LIGHTSTAND_0002.glb", category: "Light" },
    { name: "Board", path: "/models/items/catelv1_02/catelv2_02/catelv3_02/MR_KH_BOARD_0001.glb", category: "Decor" },
    { name: "Mirror", path: "/models/items/catelv1_02/catelv2_03/catelv3_02/MR_MIRROR_0001.glb", category: "Decor" },
];

interface LoadedItem {
  id: string;
  name: string;
  path: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}

// Component integrating room and avatar with full UI controls
const InteractiveRoomWithAvatar: React.FC = () => {
  const [selectedItemToAdd, setSelectedItemToAdd] = useState(availableItems[0]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Room state management
  const [selectedRoom, setSelectedRoom] = useState(availableRooms[0]);
  
  // Items state management
  const [loadedItems, setLoadedItems] = useState<LoadedItem[]>([]);
  const [gizmoMode, setGizmoMode] = useState<'position' | 'rotation' | 'scale'>('position');
  
  // Reset gizmo mode to 'position' when a new item is selected
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
  const [showControls, setShowControls] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');
  const [compactMode, setCompactMode] = useState(false);
  const [ultraCompactMode, setUltraCompactMode] = useState(true);
  const [babylonScene, setBabylonScene] = useState<any>(null);
  const integratedSceneRef = useRef<any>(null);
  const [showIntegrationGuide, setShowIntegrationGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('iframe');
  
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
        setShowIntegrationGuide(false);
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
    setAvatarConfig(prev => {
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
    setAvatarConfig(prev => ({
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
        path: selectedRoom.path
      },
      avatar: avatarConfig,
      items: loadedItems.map(item => ({
        id: item.id,
        name: item.name,
        path: item.path,
        position: item.position,
        rotation: item.rotation || { x: 0, y: 0, z: 0 },
        scale: item.scale || { x: 1, y: 1, z: 1 }
      }))
    };
    
    const dataStr = JSON.stringify(saveData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
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
  const handleAddItem = () => {
    const newItem: LoadedItem = {
      id: `item_${Date.now()}`,
      name: selectedItemToAdd.name,
      path: selectedItemToAdd.path,
      position: { x: Math.random() * 4 - 2, y: 0, z: Math.random() * 4 - 2 }
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



  return (
    <div className="website-layout">
      {/* Website Header - Pure Web Content */}
      <header className="website-header">
        <div className="container">
          <h1><img src="/icon/petarainlogo.png" alt="Petarainsoft - MyRoom Service" style={{height: '40px', verticalAlign: 'middle'}} /></h1>
          <nav className="main-nav">
            <a href="#">Home</a>
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
                  <strong>Control Guide</strong><br />
                  <span>
                    Left mouse click and hold to orbit the camera<br />
                    Left mouse double click to move avatar<br />
                    {/* Mouse right Click hold / 2 fingers to pan camera */}
                  </span>
                </div>
                  
                  {/* Debug Info - Hidden when touch controller is active */}
                  {/* {debugInfo && !touchMovement.isMoving && (
                    <div className="debug-info">
                      <h4>Debug Info</h4>
                      <p>Touch: {touchMovement.isMoving ? 'Active' : 'Inactive'}</p>
                      <p>X: {touchMovement.x.toFixed(2)}, Y: {touchMovement.y.toFixed(2)}</p>
                      <p>Active: {Object.entries(activeMovement)
                        .filter(([_, active]) => active)
                        .map(([action]) => action)
                        .join(', ') || 'None'}
                      </p>
                    </div>
                  )} */}
                  
                  {/* Integrated UI Controls Overlay */}
                  {showControls && (
                    <div className={`integrated-ui-overlay ${
                      ultraCompactMode ? 'ultra-compact' : compactMode ? 'compact-mode' : ''
                    }`}>
                      {/* Avatar Controls */}
                      <AvatarControls
                        avatarConfig={avatarConfig}
                        availableParts={availablePartsData}
                        onGenderChange={handleGenderChange}
                        onPartChange={handlePartChange}
                        onColorChange={handleColorChange}
                        onSaveAvatar={handleSaveAvatar}
                        onLoadAvatar={handleLoadAvatar}
                      />
                      
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
                          <h3>🪑 Items</h3>
                        </div>
                        <div className="items-controls">
                          <div className="item-selector">
                            {/* <label>Select Item:</label> */}
                            <select 
                              value={selectedItemToAdd.path} 
                              onChange={(e) => {
                                const item = availableItems.find(i => i.path === e.target.value);
                                if (item) setSelectedItemToAdd(item);
                              }}
                              className="item-select"
                            >
                              {availableItems.map((item) => (
                                <option key={item.path} value={item.path}>
                                  {item.name} ({item.category})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="item-actions">
                            <button onClick={handleAddItem} className="add-item-btn">
                              ➕ Add Item
                            </button>
                            <button onClick={handleClearAllItems} className="clear-items-btn">
                              🗑️ Clear All
                            </button>
                          </div>
                          
                          <div className="loaded-items-list">
                            <h4>Items ({loadedItems.length}):</h4>
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
                          </div>
                          
                          {/* Item Manipulation Controls */}
                          {/* <div className="item-manipulation-controls">
                            <h4>🎛️ Item Manipulation</h4>
                            <div className="gizmo-mode-selector">
                              <label>Transform Mode:</label>
                              <select 
                                value={gizmoMode} 
                                onChange={(e) => setGizmoMode(e.target.value as 'position' | 'rotation' | 'scale')}
                                className="gizmo-select"
                              >
                                <option value="position">📍 Move (Position)</option>
                                <option value="rotation">🔄 Rotate</option>
                                <option value="scale">📏 Scale</option>
                              </select>
                            </div>
                            <div className="manipulation-instructions">
                              <p className="instruction-text">
                                {gizmoMode === 'position' && '📍 Click and drag the arrows to move items'}
                                {gizmoMode === 'rotation' && '🔄 Click and drag the rings to rotate items'}
                                {gizmoMode === 'scale' && '📏 Click and drag the cubes to scale items'}
                              </p>
                              <p className="instruction-note">
                                💡 Click on any item in the 3D scene to select it for manipulation
                              </p>
                            </div>
                          </div> */}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show Controls Button */}
                  {!showControls && (
                    <button 
                      className="show-controls-btn"
                      onClick={() => setShowControls(true)}
                    >
                      ⚙️ Show Controls
                    </button>
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
                background: gizmoMode === 'position' ? '#2196F3' : gizmoMode === 'rotation' ? '#FF9800' : '#9C27B0',
                fontSize: '12px'
              }}>
                {gizmoMode === 'position' && '📍 Move'}
                {gizmoMode === 'rotation' && '🔄 Rotate'}
                {gizmoMode === 'scale' && '📏 Scale'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.4' }}>
              <div style={{ marginBottom: '5px' }}>
                <strong>Position:</strong> 
                <div style={{ marginLeft: '10px' }}>
                  X: {selectedItem.position?.x?.toFixed(2) || '0.00'}<br/>
                  Y: {selectedItem.position?.y?.toFixed(2) || '0.00'}<br/>
                  Z: {selectedItem.position?.z?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong>Rotation:</strong>
                <div style={{ marginLeft: '10px' }}>
                  X: {selectedItem.rotation?.x?.toFixed(2) || '0.00'}<br/>
                  Y: {selectedItem.rotation?.y?.toFixed(2) || '0.00'}<br/>
                  Z: {selectedItem.rotation?.z?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Scale:</strong>
                <div style={{ marginLeft: '10px' }}>
                  X: {selectedItem.scaling?.x?.toFixed(2) || '1.00'}<br/>
                  Y: {selectedItem.scaling?.y?.toFixed(2) || '1.00'}<br/>
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
              onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
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
        
        <section className="cta-section">
          <div className="container">
            <h3>Ready to Get Started?</h3>
            <p>It only takes a couple of minutes to integrate our 3D room and avatar into your website.</p>
            <button className="cta-button" onClick={() => setShowIntegrationGuide(true)}>Get Started Now</button>
          </div>
        </section>
        
        {/* Integration Guide Modal */}
        {showIntegrationGuide && (
          <div className="integration-guide-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Integration Guide</h2>
                <button className="close-button" onClick={() => setShowIntegrationGuide(false)}>×</button>
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
                      <h4>Instruction</h4>
                      <p>The simplest way to embed MyRoom into the website is using an iframe.</p>
                      
                      <div className="code-block">
                        <pre><code>
{`<iframe 
  src="${domainConfig.baseDomain}/embed.html?room=/models/rooms/cate001/MR_KHROOM_0001.glb&gender=male" 
  width="800" 
  height="600" 
  allow="fullscreen" 
  frameborder="1">
</iframe>`}
                        </code></pre>
                        <button 
                           className="copy-button" 
                           onClick={() => handleCopyCode(`<iframe 
  src="${domainConfig.baseDomain}/embed.html?room=/models/rooms/cate001/MR_KHROOM_0001.glb&gender=male" 
  width="800" 
  height="600" 
  allow="fullscreen" 
  frameborder="1">
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
                              <br />/models/rooms/cate002/MR_KHROOM_0001.glb
                            </td>
                          </tr>
                          <tr>
                            <td>gender</td>
                            <td>Avatar gender (male/female)</td>
                            <td>female</td>
                          </tr>
                          <tr>
                            <td>controls</td>
                            <td>Show UI controls (true/false)</td>
                            <td>false</td>
                          </tr>
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
{`<my-room-component 
  room-path="/models/rooms/cate001/MR_KHROOM_0001.glb"
  avatar-gender="female"
  show-controls="false"
  width="800px"
  height="600px">
</my-room-component>`}
                        </code></pre>
                        <button 
                           className="copy-button"
                           onClick={() => handleCopyCode(`<my-room-component 
  room-path="/models/rooms/cate001/MR_KHROOM_0001.glb"
  avatar-gender="female"
  show-controls="false"
  width="800px"
  height="600px">
</my-room-component>`)}
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
                            <td>room-path</td>
                            <td>Path to the room model</td>
                            <td>/models/rooms/cate001/MR_KHROOM_0001.glb
                              <br />/models/rooms/cate001/MR_KHROOM_0002.glb
                              <br />/models/rooms/cate002/MR_KHROOM_0001.glb
                            </td>
                          </tr>
                          <tr>
                            <td>avatar-gender</td>
                            <td>Avatar gender (male/female)</td>
                            <td>female</td>
                          </tr>
                          <tr>
                            <td>show-controls</td>
                            <td>Show UI controls (true/false)</td>
                            <td>false</td>
                          </tr>
                        </tbody>
                      </table>
                      {/* <h4>3. JavaScript API</h4>
                      <p>Interact with the component using JavaScript:</p>
                      
                      <div className="code-block">
                        <pre><code>
{`// Get reference to the component
const myRoom = document.querySelector('my-room-component');

// Change room
myRoom.changeRoom('/models/rooms/cate001/MR_KHROOM_0002.glb');

// Change avatar gender
myRoom.changeAvatarGender('male');

// Add item to room
myRoom.addItem({
  name: 'Chair',
  path: '/models/items/catelv1_01/catelv2_01/catelv3_01/MR_CHAIR_0001.glb',
  position: { x: 0, y: 0, z: 0 }
});

// Listen for events
myRoom.addEventListener('roomReady', (event) => {
  console.log('Room is ready!');
});

myRoom.addEventListener('avatarChanged', (event) => {
  console.log('Avatar changed:', event.detail);
});`}
                        </code></pre>
                        <button 
                           className="copy-button"
                           onClick={() => handleCopyCode(`// Get reference to the component
const myRoom = document.querySelector('my-room-component');

// Change room
myRoom.changeRoom('/models/rooms/cate001/MR_KHROOM_0002.glb');

// Change avatar gender
myRoom.changeAvatarGender('male');

// Add item to room
myRoom.addItem({
  name: 'Chair',
  path: '/models/items/catelv1_01/catelv2_01/catelv3_01/MR_CHAIR_0001.glb',
  position: { x: 0, y: 0, z: 0 }
});

// Listen for events
myRoom.addEventListener('roomReady', (event) => {
  console.log('Room is ready!');
});

myRoom.addEventListener('avatarChanged', (event) => {
  console.log('Avatar changed:', event.detail);
});`)}
                         >
                           Copy Code
                         </button>
                      </div> */}
                      
                      {/* <h4>4. Styling</h4>
                      <p>The component can be styled using CSS:</p>
                      
                      <div className="code-block">
                        <pre><code>
{`my-room-component {
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}`}
                        </code></pre>
                        <button 
                           className="copy-button"
                           onClick={() => handleCopyCode(`my-room-component {
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
                <button className="primary-button" onClick={() => setShowIntegrationGuide(false)}>Close</button>
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
            <div  id="feature-section-id" className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="https://petarainsoft.com">About Us</a></li>
                <li><a href="https://petarainsoft.com">Careers</a></li>
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
    animation: fadeIn 0.3s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 900px;
    max-height: 90vh;
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
  }
  
  .tab-button:hover {
    color: #333;
  }
  
  .tab-button.active {
    color: #4CAF50;
    border-bottom-color: #4CAF50;
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