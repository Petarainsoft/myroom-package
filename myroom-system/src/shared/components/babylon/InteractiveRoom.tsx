import React, { useRef, useEffect, useState } from 'react'
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  SceneLoader,
  Color3,
  UtilityLayerRenderer,
  PositionGizmo,
  RotationGizmo,
  ScaleGizmo,
  TransformNode,
  PointerEventTypes,
  AbstractMesh
} from '@babylonjs/core'
import '@babylonjs/loaders'
import { domainConfig } from '../../config/appConfig';
import { manifestService } from '../../services/ManifestService'

// LoadedItem interface
interface LoadedItem {
  id: string;
  name: string;
  path: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  resourcePath?: string | null;
}

export default function InteractiveRoom() {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const engineRef = useRef(null)

  const floorMatRef = useRef(null)
  const wallMatRef = useRef(null)
  const roomRef = useRef(null)
  // Temporarily disabled avatar feature
  // const avatarRef = useRef(null)
  const itemsRef = useRef([])
  const selectedItemRef = useRef(null)
  const gizmoManagerRef = useRef(null)
  const utilityLayerRef = useRef(null)

  const [rooms, setRooms] = useState([])
  const [items, setItems] = useState([])
  // Temporarily disabled avatar feature
  // const [avatars, setAvatars] = useState([])

  const [roomResourceId, setRoomResourceId] = useState('')
  const [itemResourceId, setItemResourceId] = useState('')
  // Temporarily disabled avatar feature
  // const [avatarResourceId, setAvatarResourceId] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [gizmoMode, setGizmoMode] = useState('position')
  // Temporarily disabled floor and wall color features
  // const [floorColor, setFloorColor] = useState('#808080')
  // const [wallColor, setWallColor] = useState('#ffffff')

  // New state for integrated UI overlay
  const [showRoomOverlay, setShowRoomOverlay] = useState(false)
  const [loadedItems, setLoadedItems] = useState<LoadedItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItemPerCategory, setSelectedItemPerCategory] = useState<{ [category: string]: any | null }>({})
  
  // Compute categories from items
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)))
  
  // Filter items by selected category
  const filteredItems = selectedCategory
    ? items.filter(item => item.category === selectedCategory)
    : []

  useEffect(() => {
    const loadManifests = async () => {
      try {
        // Load rooms and items from ManifestService (backend API)
        console.log('📁 Loading manifests from backend API via ManifestService...');
        
        // Load rooms from ManifestService
        const roomsManifest = await manifestService.loadRoomsManifest();
        setRooms(roomsManifest.rooms || []);
        console.log('✅ Loaded rooms from ManifestService:', roomsManifest.rooms?.length || 0);
        
        // Load items from ManifestService
        const itemsManifest = await manifestService.loadItemsManifest();
        setItems(itemsManifest.items || []);
        console.log('✅ Loaded items from ManifestService:', itemsManifest.items?.length || 0);
        
      } catch (error) {
        console.error('❌ Failed to load manifests from backend API:', error);
      }
    };
    loadManifests();
  }, [])

  // Update gizmo when mode changes
  useEffect(() => {
    if (selectedItemRef.current) {
      updateGizmo(selectedItemRef.current)
    }
  }, [gizmoMode])

  // When category changes, set default selected item for that category if not already set
  useEffect(() => {
    if (selectedCategory && filteredItems.length > 0 && !selectedItemPerCategory[selectedCategory]) {
      setSelectedItemPerCategory(prev => ({ ...prev, [selectedCategory]: filteredItems[0] }));
    }
  }, [selectedCategory, filteredItems]);

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

  const splitPath = (p) => {
    const i = p.lastIndexOf('/')
    return { root: p.slice(0, i + 1), file: p.slice(i + 1) }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const engine = new Engine(canvas, true)
    engineRef.current = engine
    const scene = new Scene(engine)
    sceneRef.current = scene

    const camera = new ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 2.5, 12, new Vector3(0, 1, 0), scene)
    camera.attachControl(canvas, true)
    new HemisphericLight('light', new Vector3(0, 1, 0), scene)

    // Temporarily disabled floor and wall rendering
    // const floor = MeshBuilder.CreateGround('floor', { width: 10, height: 10 }, scene)
    // const floorMat = new StandardMaterial('floorMat', scene)
    // floorMat.diffuseColor = Color3.FromHexString(floorColor)
    // floor.material = floorMat
    // floorMatRef.current = floorMat

    // const wall = MeshBuilder.CreatePlane('wall', { width: 10, height: 5 }, scene)
    // wall.position.z = -5
    // wall.position.y = 2.5
    // const wallMat = new StandardMaterial('wallMat', scene)
    // wallMat.diffuseColor = Color3.FromHexString(wallColor)
    // wall.material = wallMat
    // wallMatRef.current = wallMat

    // Setup utility layer for gizmos
    const utilityLayer = new UtilityLayerRenderer(scene)
    utilityLayerRef.current = utilityLayer

    // Setup click/touch selection
    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        const pickInfo = scene.pick(scene.pointerX, scene.pointerY)
        if (pickInfo.hit && pickInfo.pickedMesh) {
          const mesh = pickInfo.pickedMesh
          // Check if clicked mesh is an item (not room or avatar)
          const isItem = itemsRef.current.some(item => {
            return item === mesh || (item.getChildren && item.getChildren().includes(mesh))
          })
          
          if (isItem) {
            selectItem(mesh)
          } else {
            deselectItem()
          }
        } else {
          deselectItem()
        }
      }
    })

    engine.runRenderLoop(() => scene.render())

    return () => {
      if (gizmoManagerRef.current) {
        gizmoManagerRef.current.dispose()
      }
      if (utilityLayerRef.current) {
        utilityLayerRef.current.dispose()
      }
      scene.dispose()
      engine.dispose()
    }
  }, [])

  // Temporarily disabled floor and wall color change effects
  // useEffect(() => {
  //   if (floorMatRef.current) {
  //     floorMatRef.current.diffuseColor = Color3.FromHexString(floorColor)
  //   }
  // }, [floorColor])

  // useEffect(() => {
  //   if (wallMatRef.current) {
  //     wallMatRef.current.diffuseColor = Color3.FromHexString(wallColor)
  //   }
  // }, [wallColor])

  useEffect(() => {
    if (!sceneRef.current || !roomResourceId) return
    
    const loadRoom = async () => {
      console.log('🏠 [loadRoom] Starting room loading process...');
      console.log('🏠 [loadRoom] roomResourceId:', roomResourceId);
      console.log('🏠 [loadRoom] domainConfig:', domainConfig);
      console.log('🏠 [loadRoom] rooms array:', rooms);
      console.log('🏠 [loadRoom] sceneRef.current:', sceneRef.current);
      
      try {
        // Load room using backend API
        if (domainConfig.backendDomain && domainConfig.apiKey) {
          console.log('🏠 [loadRoom] Using backend API for room loading');
          console.log('🏠 [loadRoom] Backend URL:', `${domainConfig.backendDomain}/api/rooms/resource/${roomResourceId}/presigned-download`);
          
          const response = await fetch(`${domainConfig.backendDomain}/api/rooms/resource/${roomResourceId}/presigned-download`, {
            headers: {
              'x-api-key': domainConfig.apiKey
            }
          });
          
          console.log('🏠 [loadRoom] Backend response status:', response.status);
          console.log('🏠 [loadRoom] Backend response ok:', response.ok);
          
          if (response.ok) {
            const data = await response.json();
            console.log('🏠 [loadRoom] Backend response data:', data);
            
            const presignedUrl = data.data.downloadUrl;
            console.log('🏠 [loadRoom] Presigned URL:', presignedUrl);
            
            const { root, file } = splitPath(presignedUrl);
            console.log('🏠 [loadRoom] Split path - root:', root, 'file:', file);
            
            console.log('🏠 [loadRoom] Starting SceneLoader.ImportMeshAsync...');
            const res = await SceneLoader.ImportMeshAsync('', root, file, sceneRef.current);
            console.log('🏠 [loadRoom] SceneLoader result:', res);
            console.log('🏠 [loadRoom] Loaded meshes count:', res.meshes.length);
            console.log('🏠 [loadRoom] First mesh:', res.meshes[0]);
            
            if (roomRef.current) {
              console.log('🏠 [loadRoom] Disposing previous room mesh');
              roomRef.current.dispose();
            }
            roomRef.current = res.meshes[0];
            console.log('🏠 [loadRoom] Room loaded successfully via backend API');
            return;
          } else {
            const errorText = await response.text();
            console.error('🏠 [loadRoom] Backend API error response:', errorText);
            throw new Error(`Failed to load room from backend: ${response.status} - ${errorText}`);
          }
        } else {
          console.log('🏠 [loadRoom] Using fallback direct path loading');
          console.log('🏠 [loadRoom] Missing backend config - domain:', domainConfig.backendDomain, 'apiKey:', domainConfig.apiKey ? 'present' : 'missing');
          
          // Fallback to direct path loading
          const room = rooms.find(r => r.resourceId === roomResourceId);
          console.log('🏠 [loadRoom] Found room in rooms array:', room);
          
          if (room && room.path) {
            const fullRoomUrl = room.path.startsWith('http') ? room.path : room.path;
            console.log('🏠 [loadRoom] Full room URL:', fullRoomUrl);
            
            const { root, file } = splitPath(fullRoomUrl);
            console.log('🏠 [loadRoom] Split path - root:', root, 'file:', file);
            
            console.log('🏠 [loadRoom] Starting SceneLoader.ImportMeshAsync (fallback)...');
            const res = await SceneLoader.ImportMeshAsync('', root, file, sceneRef.current);
            console.log('🏠 [loadRoom] SceneLoader result (fallback):', res);
            console.log('🏠 [loadRoom] Loaded meshes count (fallback):', res.meshes.length);
            
            if (roomRef.current) {
              console.log('🏠 [loadRoom] Disposing previous room mesh (fallback)');
              roomRef.current.dispose();
            }
            roomRef.current = res.meshes[0];
            console.log('🏠 [loadRoom] Room loaded successfully via fallback');
          } else {
            console.error('🏠 [loadRoom] No room found or missing path. Room:', room);
            throw new Error('Backend domain and API key are required for room loading');
          }
        }
      } catch (error) {
        console.error('🏠 [loadRoom] Failed to load room - Error details:', error);
        console.error('🏠 [loadRoom] Error stack:', error.stack);
        console.error('🏠 [loadRoom] Error name:', error.name);
        console.error('🏠 [loadRoom] Error message:', error.message);
      }
    };
    
    loadRoom();
  }, [roomResourceId, rooms])

  const selectItem = (mesh) => {
    // Find the root mesh of the item
    let rootMesh = mesh
    while (rootMesh.parent && rootMesh.parent !== sceneRef.current) {
      rootMesh = rootMesh.parent
    }
    
    selectedItemRef.current = rootMesh
    setSelectedItem(rootMesh)
    
    // Create or update gizmo
    updateGizmo(rootMesh)
  }

  const deselectItem = () => {
    selectedItemRef.current = null
    setSelectedItem(null)
    
    // Hide gizmo
    if (gizmoManagerRef.current) {
      gizmoManagerRef.current.dispose()
      gizmoManagerRef.current = null
    }
  }

  const updateGizmo = (mesh) => {
    if (!utilityLayerRef.current) return
    
    // Dispose existing gizmo
    if (gizmoManagerRef.current) {
      gizmoManagerRef.current.dispose()
    }
    
    // Create new gizmo based on mode
    switch (gizmoMode) {
      case 'position':
        gizmoManagerRef.current = new PositionGizmo(utilityLayerRef.current)
        break
      case 'rotation':
        gizmoManagerRef.current = new RotationGizmo(utilityLayerRef.current)
        break
      case 'scale':
        gizmoManagerRef.current = new ScaleGizmo(utilityLayerRef.current)
        break
      default:
        return
    }
    
    // Attach gizmo to mesh with proper synchronization
    gizmoManagerRef.current.attachedMesh = mesh
    gizmoManagerRef.current.updateGizmoRotationToMatchAttachedMesh = true
    gizmoManagerRef.current.updateGizmoPositionToMatchAttachedMesh = true
  }

  const handleAddItem = async () => {
    if (!selectedCategory) return;
    const selectedItemToAdd = selectedItemPerCategory[selectedCategory];
    if (!selectedItemToAdd) return;
    
    const newItem: LoadedItem = {
      id: `item_${Date.now()}`,
      name: selectedItemToAdd.name,
      path: selectedItemToAdd.path,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      resourcePath: selectedItemToAdd.resourcePath
    };
    setLoadedItems(prev => [...prev, newItem]);
  };

  const handleAddItemOld = async () => {
    if (!sceneRef.current || !itemResourceId) return
    
    try {
      let itemUrl = null;
      
      // Load item using backend API
      if (domainConfig.backendDomain && domainConfig.apiKey) {
        const response = await fetch(`${domainConfig.backendDomain}/api/customer/items/${itemResourceId}/download`, {
          headers: {
            'x-api-key': domainConfig.apiKey
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          itemUrl = data.data.downloadUrl;
        } else {
          throw new Error(`Failed to load item from backend: ${response.status}`);
        }
      } else {
        // Fallback to direct path loading
        const item = items.find(i => i.resourceId === itemResourceId);
        if (item && item.path) {
          itemUrl = item.path.startsWith('http') ? item.path : item.path;
        } else {
          throw new Error('Backend domain and API key are required for item loading');
        }
      }
      
      if (itemUrl) {
        const { root, file } = splitPath(itemUrl);
        const res = await SceneLoader.ImportMeshAsync('', root, file, sceneRef.current);
        const m = res.meshes[0];
        m.position = new Vector3(0, 0, 0);
        
        // Add to items array for selection tracking
        itemsRef.current.push(m);
        
        // Make mesh pickable
        m.isPickable = true;
        if (m.getChildren) {
          m.getChildren().forEach(child => {
            if (child instanceof AbstractMesh && 'isPickable' in child) {
              child.isPickable = true;
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load item:', error);
    }
  }

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

  // Handler to toggle Room overlay
  const handleToggleRoomOverlay = () => {
    setShowRoomOverlay(prev => !prev);
  };

  // Temporarily disabled avatar feature
  // useEffect(() => {
  //   if (!sceneRef.current || !avatarPath) return
  //   const { root, file } = splitPath(avatarPath)
  //   SceneLoader.ImportMeshAsync('', root, file, sceneRef.current).then((res) => {
  //     if (avatarRef.current) avatarRef.current.dispose()
  //     avatarRef.current = res.meshes[0]
  //     avatarRef.current.position = new Vector3(0, 0, 2)
  //   })
  // }, [avatarPath])

  // Temporarily disabled avatar movement feature
  // useEffect(() => {
  //   const move = (e) => {
  //     if (!avatarRef.current) return
  //     const step = 0.1
  //     switch (e.key) {
  //       case 'ArrowUp':
  //         avatarRef.current.position.z -= step
  //         break
  //       case 'ArrowDown':
  //         avatarRef.current.position.z += step
  //         break
  //       case 'ArrowLeft':
  //         avatarRef.current.position.x -= step
  //         break
  //       case 'ArrowRight':
  //         avatarRef.current.position.x += step
  //         break
  //       default:
  //         break
  //     }
  //   }
  //   window.addEventListener('keydown', move)
  //   return () => window.removeEventListener('keydown', move)
  // }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Toggle button for room overlay */}
      <button 
        onClick={handleToggleRoomOverlay}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: '#1890ff',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 1001
        }}
      >
        🏠 Room Controls
      </button>

      {/* Integrated UI Overlay - similar to myroom-systemc */}
      {showRoomOverlay && (
        <div className="integrated-ui-overlay" style={{
          position: 'absolute',
          top: '70px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          padding: '20px',
          minWidth: '300px',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Room Controls */}
          <div className="control-section" style={{ marginBottom: '20px' }}>
            <div className="section-header" style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>🏠 Room</h3>
            </div>
            <div className="room-selector">
              <select
                value={roomResourceId}
                onChange={(e) => setRoomResourceId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d9d9d9',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Room...</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.resourceId || room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Controls */}
          <div className="control-section">
            <div className="section-header" style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>🪑 Categories</h3>
            </div>
            
            {/* Single-panel toggle: show either category or items panel */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Show Category Panel if no category is selected */}
              {!selectedCategory && (
                <div style={{ minWidth: 140, flex: '0 0 220px' }}>
                  <div className="item-categories" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {categories.map(category => (
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
              )}

              {/* Show Items Panel if a category is selected */}
              {selectedCategory && (
                <div
                  style={{
                    minWidth: 220,
                    flex: '0 0 220px',
                    background: '#fafbfc',
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    borderRadius: '6px'
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
                  <div className="item-list-buttons" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
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
                  <button
                    onClick={handleAddItem}
                    className="add-item-btn"
                    disabled={!selectedCategory || !selectedItemPerCategory[selectedCategory]}
                    style={{
                      marginTop: 8,
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: '#1890ff',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 500,
                      fontSize: 15,
                      cursor: !selectedCategory || !selectedItemPerCategory[selectedCategory] ? 'not-allowed' : 'pointer',
                      opacity: !selectedCategory || !selectedItemPerCategory[selectedCategory] ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    ➕ Add Item
                  </button>
                </div>
              )}
            </div>
            
            {/* Loaded Items List */}
            <div className="loaded-items-list" style={{ marginTop: '20px' }}>
              <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #e8e8e8' }} />
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Items in Room ({loadedItems.length}):</h4>
              {loadedItems.length === 0 ? (
                <p className="no-items" style={{ color: '#999', fontStyle: 'italic', margin: '10px 0' }}>No items yet</p>
              ) : (
                <ul className="items-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {loadedItems.map((item) => (
                    <li key={item.id} className="item-entry" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      margin: '4px 0',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      <span>{item.name}</span>
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
                  ))}
                </ul>
              )}
              <div className="item-actions" style={{ marginTop: '10px' }}>
                <button 
                  onClick={handleClearAllItems} 
                  className="clear-items-btn"
                  style={{
                    background: '#ff7875',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy overlay for old controls */}
      <div className="overlay" style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '15px',
        borderRadius: '8px',
        display: showRoomOverlay ? 'none' : 'block'
      }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          Room
          <select value={roomResourceId} onChange={(e) => setRoomResourceId(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
            <option value="">Select...</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.resourceId || r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          Item
          <select value={itemResourceId} onChange={(e) => setItemResourceId(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
            <option value="">Item...</option>
            {items.map((i) => (
              <option key={i.id} value={i.resourceId || i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <button onClick={handleAddItemOld} style={{ marginLeft: '10px', padding: '5px 10px' }}>Add</button>
        </label>
      </div>
        
      {/* Transform Controls */}
      {selectedItem && (
        <div style={{ 
          position: 'absolute', 
          top: '10px', 
          right: showRoomOverlay ? '450px' : '10px', 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px',
          minWidth: '200px',
          zIndex: 999
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Transform Controls</h4>
          <div style={{ marginBottom: '10px' }}>
            <label>Mode: </label>
            <select 
              value={gizmoMode} 
              onChange={(e) => setGizmoMode(e.target.value)}
              style={{ marginLeft: '5px' }}
            >
              <option value="position">Position</option>
              <option value="rotation">Rotation</option>
              <option value="scale">Scale</option>
            </select>
          </div>
          <div style={{ fontSize: '12px', color: '#ccc' }}>
            <div>Position: {selectedItem.position.x.toFixed(2)}, {selectedItem.position.y.toFixed(2)}, {selectedItem.position.z.toFixed(2)}</div>
            <div>Rotation: {selectedItem.rotation.x.toFixed(2)}, {selectedItem.rotation.y.toFixed(2)}, {selectedItem.rotation.z.toFixed(2)}</div>
            <div>Scale: {selectedItem.scaling.x.toFixed(2)}, {selectedItem.scaling.y.toFixed(2)}, {selectedItem.scaling.z.toFixed(2)}</div>
          </div>
          <button 
            onClick={deselectItem}
            style={{ 
              marginTop: '10px', 
              background: '#ff4444', 
              color: 'white', 
              border: 'none', 
              padding: '5px 10px', 
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  )
}