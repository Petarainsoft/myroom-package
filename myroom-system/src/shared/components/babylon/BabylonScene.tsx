import { useEffect, useRef } from 'react'
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from '@babylonjs/core'
import { AdvancedDynamicTexture, StackPanel, Button, Image, Rectangle, ScrollViewer, TextBlock, Control } from '@babylonjs/gui'
import '@babylonjs/loaders'
import '@babylonjs/loaders/glTF'



const createPanel = (adt, hierarchicalData) => {
    // Create main panel with Material Design styling
    const panel = new Rectangle('panel')
    panel.widthInPixels = 320
    panel.heightInPixels = 640
    panel.cornerRadius = 16
    panel.color = 'transparent'
    panel.thickness = 0
    panel.background = 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))'
    panel.shadowColor = 'rgba(0,0,0,0.15)'
    panel.shadowOffsetX = 0
    panel.shadowOffsetY = 8
    panel.shadowBlur = 24
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER
    panel.leftInPixels = 24
    adt.addControl(panel)

    // Add panel header
    const headerPanel = new Rectangle('headerPanel')
    headerPanel.widthInPixels = 320
    headerPanel.heightInPixels = 64
    headerPanel.cornerRadius = 16
    headerPanel.color = 'transparent'
    headerPanel.thickness = 0
    headerPanel.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    headerPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    headerPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    headerPanel.topInPixels = 0
    panel.addControl(headerPanel)

    // Add header title
    const headerTitle = new TextBlock('headerTitle', 'Item Catalog')
    headerTitle.color = 'white'
    headerTitle.fontSize = 18
    headerTitle.fontWeight = '600'
    headerTitle.fontFamily = 'Segoe UI, system-ui, sans-serif'
    headerTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    headerTitle.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER
    headerPanel.addControl(headerTitle)

    // Create breadcrumb navigation with Material Design
    const breadcrumbContainer = new Rectangle('breadcrumbContainer')
    breadcrumbContainer.widthInPixels = 288
    breadcrumbContainer.heightInPixels = 48
    breadcrumbContainer.cornerRadius = 8
    breadcrumbContainer.color = 'transparent'
    breadcrumbContainer.thickness = 0
    breadcrumbContainer.background = 'rgba(248,250,252,0.8)'
    breadcrumbContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    breadcrumbContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    breadcrumbContainer.topInPixels = 72
    panel.addControl(breadcrumbContainer)

    const breadcrumbPanel = new StackPanel('breadcrumbPanel')
    breadcrumbPanel.isVertical = false
    breadcrumbPanel.heightInPixels = 32
    breadcrumbPanel.spacing = 8
    breadcrumbPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    breadcrumbPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER
    breadcrumbContainer.addControl(breadcrumbPanel)

    // Create scroll viewer with Material Design styling
    const scrollViewer = new ScrollViewer('scrollViewer')
    scrollViewer.widthInPixels = 288
    scrollViewer.heightInPixels = 496
    scrollViewer.color = 'transparent'
    scrollViewer.background = 'rgba(248,250,252,0.95)'
    scrollViewer.barColor = '#e2e8f0'
    scrollViewer.barBackground = 'rgba(226,232,240,0.3)'
    scrollViewer.thumbLength = 0.8
    scrollViewer.thumbHeight = 20
    scrollViewer.barSize = 6
    scrollViewer.cornerRadius = 0
    scrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    scrollViewer.topInPixels = 128
    scrollViewer.paddingLeftInPixels = 16
    scrollViewer.paddingRightInPixels = 16
    panel.addControl(scrollViewer)

    // Create main stack panel with Material Design spacing
    const stackPanel = new StackPanel('stackPanel')
    stackPanel.isVertical = true
    stackPanel.spacing = 12
    stackPanel.paddingTopInPixels = 8
    stackPanel.paddingBottomInPixels = 16
    scrollViewer.addControl(stackPanel)

    // Navigation state
    let currentPath = []
    let currentData = hierarchicalData.categories

    // Function to update breadcrumb
    const updateBreadcrumb = () => {
      // Clear all existing breadcrumb controls
      const childrenToRemove = [...breadcrumbPanel.children]
      childrenToRemove.forEach((child) => {
        breadcrumbPanel.removeControl(child)
        child.dispose()
      })

      // Home button with enhanced Material Design
      const homeBtn = Button.CreateSimpleButton('homeBtn', '🏠 Home')
      homeBtn.widthInPixels = 72
      homeBtn.heightInPixels = 32
      homeBtn.color = '#ffffff'
      homeBtn.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
      homeBtn.cornerRadius = 16
      homeBtn.fontSize = 12
      homeBtn.fontWeight = '600'
      homeBtn.fontFamily = 'Segoe UI, system-ui, sans-serif'
      homeBtn.shadowColor = 'rgba(59,130,246,0.3)'
      homeBtn.shadowOffsetX = 0
      homeBtn.shadowOffsetY = 2
      homeBtn.shadowBlur = 4
      breadcrumbPanel.addControl(homeBtn)
      
      // Enhanced hover effect
      homeBtn.onPointerEnterObservable.add(() => {
        homeBtn.background = 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
        homeBtn.shadowOffsetY = 4
        homeBtn.shadowBlur = 8
      })
      homeBtn.onPointerOutObservable.add(() => {
        homeBtn.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        homeBtn.shadowOffsetY = 2
        homeBtn.shadowBlur = 4
      })
      
      homeBtn.onPointerClickObservable.add(() => {
        currentPath = []
        currentData = hierarchicalData.categories
        updateContent()
      })

      // Path buttons
      currentPath.forEach((pathItem, index) => {
        const separator = new TextBlock('separator', ' › ')
        separator.color = '#64748b'
        separator.fontSize = 14
        separator.fontWeight = '400'
        separator.widthInPixels = 24
        breadcrumbPanel.addControl(separator)

        const pathBtn = Button.CreateSimpleButton(`pathBtn_${index}`, pathItem.name)
        pathBtn.widthInPixels = Math.min(pathItem.name.length * 8 + 24, 80)
        pathBtn.heightInPixels = 32
        pathBtn.color = '#64748b'
        pathBtn.background = 'rgba(248,250,252,0.9)'
        pathBtn.cornerRadius = 16
        pathBtn.fontSize = 12
        pathBtn.fontWeight = '500'
        pathBtn.fontFamily = 'Segoe UI, system-ui, sans-serif'
        pathBtn.shadowColor = 'rgba(0,0,0,0.05)'
        pathBtn.shadowOffsetX = 0
        pathBtn.shadowOffsetY = 1
        pathBtn.shadowBlur = 2
        breadcrumbPanel.addControl(pathBtn)
        
        // Enhanced hover effect
        pathBtn.onPointerEnterObservable.add(() => {
          pathBtn.background = 'rgba(255,255,255,1)'
          pathBtn.color = '#475569'
          pathBtn.shadowOffsetY = 2
          pathBtn.shadowBlur = 4
        })
        pathBtn.onPointerOutObservable.add(() => {
          pathBtn.background = 'rgba(248,250,252,0.9)'
          pathBtn.color = '#64748b'
          pathBtn.shadowOffsetY = 1
          pathBtn.shadowBlur = 2
        })
        
        pathBtn.onPointerClickObservable.add(() => {
          // Navigate to this level
          currentPath = currentPath.slice(0, index + 1)
          let data = hierarchicalData.categories
          currentPath.forEach(p => {
            if (data[p.key] && data[p.key].subcategories) {
              data = data[p.key].subcategories
            }
          })
          currentData = data
          updateContent()
        })
      })
    }

    // Function to populate items
    const populateItems = (items) => {
      // Clear all existing controls first
      const childrenToRemove = [...stackPanel.children]
      childrenToRemove.forEach((child) => {
        stackPanel.removeControl(child)
        child.dispose()
      })

      if (!items || !Array.isArray(items)) {
        return
      }

      items.forEach((item, index) => {
        // Create Material Design card for each item
        const itemCard = new Rectangle('itemCard')
        itemCard.widthInPixels = 256
        itemCard.heightInPixels = 88
        itemCard.cornerRadius = 12
        itemCard.color = 'transparent'
        itemCard.thickness = 0
        itemCard.background = 'rgba(255,255,255,0.9)'
        itemCard.shadowColor = 'rgba(0,0,0,0.08)'
        itemCard.shadowOffsetX = 0
        itemCard.shadowOffsetY = 2
        itemCard.shadowBlur = 8
        stackPanel.addControl(itemCard)
        
        const itemContainer = new StackPanel('itemContainer')
        itemContainer.isVertical = false
        itemContainer.heightInPixels = 72
        itemContainer.spacing = 16
        itemContainer.paddingLeftInPixels = 16
        itemContainer.paddingRightInPixels = 16
        itemContainer.paddingTopInPixels = 8
        itemContainer.paddingBottomInPixels = 8
        itemCard.addControl(itemContainer)
        
        // Add hover effect to card
        itemCard.onPointerEnterObservable.add(() => {
          itemCard.background = 'rgba(255,255,255,1)'
          itemCard.shadowOffsetY = 4
          itemCard.shadowBlur = 12
        })
        itemCard.onPointerOutObservable.add(() => {
          itemCard.background = 'rgba(255,255,255,0.9)'
          itemCard.shadowOffsetY = 2
          itemCard.shadowBlur = 8
        })

        // Create image with fallback to placeholder icon
        let itemImage
        if (item.imageUrl && item.imageUrl.trim() !== '') {
          itemImage = new Image('itemImage', item.imageUrl)
          
          // Add error handling for failed image loads
          itemImage.onImageLoadedObservable.addOnce(() => {
            // Image loaded successfully
          })
          
          itemImage.onImageLoadErrorObservable.addOnce(() => {
            // Replace with placeholder icon on error
            itemImage.source = 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            `)
          })
        } else {
          // Use placeholder icon when no imageUrl
          itemImage = new Image('itemImage', 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          `))
        }
        
        itemImage.widthInPixels = 56
        itemImage.heightInPixels = 56
        itemImage.cornerRadius = 8
        itemContainer.addControl(itemImage)

        // Create text container for better layout
        const textContainer = new StackPanel('textContainer')
        textContainer.isVertical = true
        textContainer.spacing = 4
        itemContainer.addControl(textContainer)

        const itemText = new TextBlock('itemText', item.name)
        itemText.color = '#1e293b'
        itemText.fontSize = 14
        itemText.fontWeight = '600'
        itemText.fontFamily = 'Segoe UI, system-ui, sans-serif'
        itemText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
        itemText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
        itemText.heightInPixels = 20
        textContainer.addControl(itemText)
        
        // Add item description/category
        const itemDesc = new TextBlock('itemDesc', `${item.categoryLv3 || 'Item'}`)
        itemDesc.color = '#64748b'
        itemDesc.fontSize = 11
        itemDesc.fontWeight = '400'
        itemDesc.fontFamily = 'Segoe UI, system-ui, sans-serif'
        itemDesc.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
        itemDesc.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
        itemDesc.heightInPixels = 16
        textContainer.addControl(itemDesc)
      })
    }

    // Function to show categories/subcategories
    const showCategories = (data) => {
      // Clear all existing controls first
      const childrenToRemove = [...stackPanel.children]
      childrenToRemove.forEach((child) => {
        stackPanel.removeControl(child)
        child.dispose()
      })

      if (!data || typeof data !== 'object') {
        return
      }

      Object.keys(data).forEach((key) => {
        const category = data[key]
        // Create Material Design category card
        const categoryCard = new Rectangle('categoryCard')
        categoryCard.widthInPixels = 256
        categoryCard.heightInPixels = 56
        categoryCard.cornerRadius = 12
        categoryCard.color = 'transparent'
        categoryCard.thickness = 0
        categoryCard.background = 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)'
        categoryCard.shadowColor = 'rgba(0,0,0,0.06)'
        categoryCard.shadowOffsetX = 0
        categoryCard.shadowOffsetY = 1
        categoryCard.shadowBlur = 3
        stackPanel.addControl(categoryCard)
        
        const categoryBtn = Button.CreateSimpleButton(`categoryBtn_${key}`, `📁 ${category.name}`)
        categoryBtn.widthInPixels = 256
        categoryBtn.heightInPixels = 56
        categoryBtn.color = '#4338ca'
        categoryBtn.background = 'transparent'
        categoryBtn.cornerRadius = 12
        categoryBtn.fontSize = 14
        categoryBtn.fontWeight = '500'
        categoryBtn.fontFamily = 'Segoe UI, system-ui, sans-serif'
        categoryBtn.paddingLeftInPixels = 16
        categoryBtn.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
        categoryCard.addControl(categoryBtn)
        
        // Add hover and click effects
        categoryBtn.onPointerEnterObservable.add(() => {
          categoryCard.background = 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)'
          categoryCard.shadowOffsetY = 3
          categoryCard.shadowBlur = 8
        })
        categoryBtn.onPointerOutObservable.add(() => {
          categoryCard.background = 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)'
          categoryCard.shadowOffsetY = 1
          categoryCard.shadowBlur = 3
        })
        categoryBtn.onPointerDownObservable.add(() => {
          categoryCard.background = 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)'
        })
        categoryBtn.onPointerUpObservable.add(() => {
          categoryCard.background = 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)'
        })

        categoryBtn.onPointerClickObservable.add(() => {
          if (category.items && category.items.length > 0) {
            // This is the final level with items
            populateItems(category.items)
          } else if (category.subcategories && Object.keys(category.subcategories).length > 0) {
            // Navigate to subcategories
            currentPath.push({ key: key, name: category.name })
            currentData = category.subcategories
            updateContent()
          }
        })
      })
    }

    // Function to update content based on current navigation state
    const updateContent = () => {
      updateBreadcrumb()
      if (currentData && typeof currentData === 'object') {
        showCategories(currentData)
      }
    }

    // Initialize with top-level categories
    updateContent()

    // Create toggle button
    const toggleBtn = Button.CreateSimpleButton('toggleBtn', '☰')
    toggleBtn.widthInPixels = 40
    toggleBtn.heightInPixels = 40
    toggleBtn.color = 'white'
    toggleBtn.background = '#666666'
    toggleBtn.cornerRadius = 5
    toggleBtn.fontSize = 20
    toggleBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
    toggleBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    toggleBtn.leftInPixels = 20
    toggleBtn.topInPixels = 20
    adt.addControl(toggleBtn)

    let isPanelVisible = true
    toggleBtn.onPointerClickObservable.add(() => {
      isPanelVisible = !isPanelVisible
      panel.isVisible = isPanelVisible
      toggleBtn.textBlock.text = isPanelVisible ? '☰' : '▶'
    })
  }

  export default function BabylonScene() {
    const canvasRef = useRef(null)

    useEffect(() => {
      const canvas = canvasRef.current
      const engine = new Engine(canvas, true)
      const scene = new Scene(engine)

      const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 10, new Vector3(0, 1, 0), scene)
      camera.attachControl(canvas, true)
      new HemisphericLight('light', new Vector3(0, 1, 0), scene)

      const dirLight = new DirectionalLight(
        'dirLight',
        new Vector3(-1, -2, -1),
        scene,
      )
      dirLight.position = new Vector3(5, 10, 5)

      const shadowGen = new ShadowGenerator(1024, dirLight)

      const ground = MeshBuilder.CreateGround(
        'ground',
        { width: 20, height: 20 },
        scene,
      )
      ground.receiveShadows = true

      const box = MeshBuilder.CreateBox('box', { size: 2 }, scene)
      box.position.y = 1
      shadowGen.addShadowCaster(box)

      const skybox = MeshBuilder.CreateBox('skybox', { size: 1000 }, scene)
      const skyMat = new StandardMaterial('skyMat', scene)
      skyMat.backFaceCulling = false
      skyMat.emissiveColor = new Color3(0.7, 0.8, 1)
      skybox.material = skyMat

      const adt = AdvancedDynamicTexture.CreateFullscreenUI('ui', true, scene)

      fetch('/manifest/item/items-manifest.json')
        .then((res) => res.json())
        .then((data) => {
          console.log('Loaded data:', data)
          
          // Build hierarchical structure
          const hierarchicalData = {
            categories: {}
          }
          
          data.items.forEach((item) => {
            const lv1 = item.categoryLv1
            const lv2 = item.categoryLv2
            const lv3 = item.categoryLv3
            
            // Create level 1 category if not exists
            if (!hierarchicalData.categories[lv1]) {
              hierarchicalData.categories[lv1] = {
                name: data.categories[lv1]?.name || lv1,
                subcategories: {}
              }
            }
            
            // Create level 2 subcategory if not exists
            if (!hierarchicalData.categories[lv1].subcategories[lv2]) {
              hierarchicalData.categories[lv1].subcategories[lv2] = {
                name: data.categories[lv2]?.name || lv2,
                subcategories: {}
              }
            }
            
            // Create level 3 subcategory if not exists
            if (!hierarchicalData.categories[lv1].subcategories[lv2].subcategories[lv3]) {
              hierarchicalData.categories[lv1].subcategories[lv2].subcategories[lv3] = {
                name: data.categories[lv3]?.name || lv3,
                items: []
              }
            }
            
            // Add item to the final level
            hierarchicalData.categories[lv1].subcategories[lv2].subcategories[lv3].items.push(item)
          })
          
          console.log('Hierarchical data:', hierarchicalData)
          createPanel(adt, hierarchicalData)
        })
        .catch((error) => {
          console.error('Error loading items manifest:', error)
        })

      engine.runRenderLoop(() => {
        scene.render()
      })

      return () => {
        scene.dispose()
        engine.dispose()
      }
    }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}