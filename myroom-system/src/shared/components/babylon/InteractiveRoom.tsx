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
  PointerEventTypes
} from '@babylonjs/core'
import '@babylonjs/loaders'
import { domainConfig, DISABLE_LOCAL_GLB_LOADING } from '../../config/appConfig'

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

  useEffect(() => {
    const loadManifests = async () => {
      try {
        const { manifestService } = await import('../../services/ManifestService');
        
        // Load rooms
        const roomsData = await manifestService.loadRoomsManifest();
        setRooms(roomsData.rooms || []);
        
        // Load items
        const itemsData = await manifestService.loadItemsManifest();
        setItems(itemsData.items || []);
        
        // Temporarily disabled avatar feature
        // const avatarsData = await manifestService.loadAvatarsManifest();
        // setAvatars(avatarsData.avatars || []);
      } catch (error) {
        console.error('Failed to load manifests:', error);
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
      try {
        // Check if local GLB loading is disabled
        if (DISABLE_LOCAL_GLB_LOADING) {
          console.warn('⚠️ [InteractiveRoom] Local GLB loading is disabled by DISABLE_LOCAL_GLB_LOADING flag');
          // throw new Error('Local GLB room loading is temporarily disabled');
        }
        
        // Try to get presigned URL from backend if available
        if (domainConfig.backendDomain && domainConfig.apiKey) {
          const response = await fetch(`${domainConfig.backendDomain}/api/rooms/resource/${roomResourceId}/presigned-download`, {
            headers: {
              'x-api-key': domainConfig.apiKey
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const presignedUrl = data.data.downloadUrl;
            const { root, file } = splitPath(presignedUrl);
            const res = await SceneLoader.ImportMeshAsync('', root, file, sceneRef.current);
            if (roomRef.current) {
              roomRef.current.dispose();
            }
            roomRef.current = res.meshes[0];
            return;
          }
        }
        if (DISABLE_LOCAL_GLB_LOADING) { return;}
        // Fallback: find room by resourceId in manifest and use local path
        const room = rooms.find(r => r.resourceId === roomResourceId);
        if (room && room.path) {
          const fullRoomUrl = room.path.startsWith('http') ? room.path : `${domainConfig.baseDomain}${room.path}`;
          const { root, file } = splitPath(fullRoomUrl);
          const res = await SceneLoader.ImportMeshAsync('', root, file, sceneRef.current);
          if (roomRef.current) {
            roomRef.current.dispose();
          }
          roomRef.current = res.meshes[0];
        }
      } catch (error) {
        console.error('Failed to load room:', error);
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
    
    // Attach gizmo to mesh
    gizmoManagerRef.current.attachedMesh = mesh
    gizmoManagerRef.current.updateGizmoRotationToMatchAttachedMesh = true
    gizmoManagerRef.current.updateGizmoPositionToMatchAttachedMesh = true
  }

  const handleAddItem = async () => {
    if (!sceneRef.current || !itemResourceId) return
    
    try {
      // Check if local GLB loading is disabled
      if (DISABLE_LOCAL_GLB_LOADING) {
        console.warn('⚠️ [InteractiveRoom.handleAddItem] Local GLB loading is disabled by DISABLE_LOCAL_GLB_LOADING flag');
        throw new Error('Local GLB item loading is temporarily disabled');
      }
      
      let itemUrl = null;
      
      // Try to get presigned URL from backend if available
      if (domainConfig.backendDomain && domainConfig.apiKey) {
        const response = await fetch(`${domainConfig.backendDomain}/api/customer/items/${itemResourceId}/download`, {
          headers: {
            'x-api-key': domainConfig.apiKey
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          itemUrl = data.data.downloadUrl;
        }
      }
      
      // Fallback: find item by resourceId in manifest and use local path
      if (!itemUrl) {
        const item = items.find(i => i.resourceId === itemResourceId);
        if (item && item.path) {
          itemUrl = item.path.startsWith('http') ? item.path : `${domainConfig.baseDomain}${item.path}`;
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
            if (child.isPickable !== undefined) {
              child.isPickable = true;
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load item:', error);
    }
  }

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
      <div className="overlay">
        <label>
          Room
          <select value={roomResourceId} onChange={(e) => setRoomResourceId(e.target.value)}>
            <option value="">Select...</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.resourceId || r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        {/* Temporarily disabled floor and wall color controls */}
        {/* <label>
          Floor
          <input type="color" value={floorColor} onChange={(e) => setFloorColor(e.target.value)} />
        </label>
        <label>
          Wall
          <input type="color" value={wallColor} onChange={(e) => setWallColor(e.target.value)} />
        </label> */}
        <label>
          Item
          <select value={itemResourceId} onChange={(e) => setItemResourceId(e.target.value)}>
            <option value="">Item...</option>
            {items.map((i) => (
              <option key={i.id} value={i.resourceId || i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <button onClick={handleAddItem}>Add</button>
        </label>
        {/* Temporarily disabled avatar feature */}
        {/* <label>
          Avatar
          <select value={avatarResourceId} onChange={(e) => setAvatarResourceId(e.target.value)}>
            <option value="">Avatar...</option>
            {avatars.map((a) => (
              <option key={a.id} value={a.resourceId || a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label> */}
        
        {/* Transform Controls */}
        {selectedItem && (
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px',
            minWidth: '200px'
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
    </div>
  )
}