import { useState, useEffect, useRef } from 'react'
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  SceneLoader,
  PointerEventTypes,
  TransformNode,
  UtilityLayerRenderer,
} from '@babylonjs/core'
import { PositionGizmo, RotationGizmo, ScaleGizmo } from '@babylonjs/core/Gizmos'
import '@babylonjs/loaders'

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

  const [roomPath, setRoomPath] = useState('')
  const [itemPath, setItemPath] = useState('')
  // Temporarily disabled avatar feature
  // const [avatarPath, setAvatarPath] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [gizmoMode, setGizmoMode] = useState('position')
  // Temporarily disabled floor and wall color features
  // const [floorColor, setFloorColor] = useState('#808080')
  // const [wallColor, setWallColor] = useState('#ffffff')

  useEffect(() => {
    fetch('/manifest/room/room-manifest.json')
      .then((r) => r.json())
      .then((d) => setRooms(d.rooms || []))
    fetch('/manifest/item/items-manifest.json')
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
    // Temporarily disabled avatar feature
    // fetch('/manifest/avatar/avatar-manifest.json')
    //   .then((r) => r.json())
    //   .then((d) => setAvatars(d.avatars || []))
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
    if (!sceneRef.current || !roomPath) return
    const { root, file } = splitPath(roomPath)
    SceneLoader.ImportMeshAsync('', root, file, sceneRef.current).then((res) => {
      if (roomRef.current) {
        roomRef.current.dispose()
      }
      roomRef.current = res.meshes[0]
    })
  }, [roomPath])

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

  const handleAddItem = () => {
    if (!sceneRef.current || !itemPath) return
    const { root, file } = splitPath(itemPath)
    SceneLoader.ImportMeshAsync('', root, file, sceneRef.current).then((res) => {
      const m = res.meshes[0]
      m.position = new Vector3(0, 0, 0)
      
      // Add to items array for selection tracking
      itemsRef.current.push(m)
      
      // Make mesh pickable
      m.isPickable = true
      if (m.getChildren) {
        m.getChildren().forEach(child => {
          if (child.isPickable !== undefined) {
            child.isPickable = true
          }
        })
      }
    })
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
          <select value={roomPath} onChange={(e) => setRoomPath(e.target.value)}>
            <option value="">Select...</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.modelPath}>
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
          <select value={itemPath} onChange={(e) => setItemPath(e.target.value)}>
            <option value="">Item...</option>
            {items.map((i) => (
              <option key={i.id} value={i.modelPath}>
                {i.name}
              </option>
            ))}
          </select>
          <button onClick={handleAddItem}>Add</button>
        </label>
        {/* Temporarily disabled avatar feature */}
        {/* <label>
          Avatar
          <select value={avatarPath} onChange={(e) => setAvatarPath(e.target.value)}>
            <option value="">Avatar...</option>
            {avatars.map((a) => (
              <option key={a.id} value={a.modelPath}>
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
