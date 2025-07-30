import React, { useState } from 'react';
import { OverlayUI } from '../lib/components/OverlayUI';

/**
 * Example demonstrating how to use the OverlayUI component
 * as a standalone package feature
 */
export const OverlayUIExample: React.FC = () => {
  // State for overlay visibility
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  
  // State for room management
  const [selectedRoomId, setSelectedRoomId] = useState('');
  
  // State for item management
  const [loadedItems, setLoadedItems] = useState<any[]>([]);
  
  // Sample data - in real usage, this would come from your data source
  const sampleRooms = [
    { id: 'room1', name: 'Living Room', resourceId: 'living-room-001' },
    { id: 'room2', name: 'Bedroom', resourceId: 'bedroom-001' },
    { id: 'room3', name: 'Kitchen', resourceId: 'kitchen-001' }
  ];
  
  const sampleItems = [
    { id: 'chair1', name: 'Modern Chair', path: '/models/chair.glb', category: 'furniture', resourceId: 'chair-001' },
    { id: 'table1', name: 'Coffee Table', path: '/models/table.glb', category: 'furniture', resourceId: 'table-001' },
    { id: 'lamp1', name: 'Floor Lamp', path: '/models/lamp.glb', category: 'lighting', resourceId: 'lamp-001' },
    { id: 'plant1', name: 'Potted Plant', path: '/models/plant.glb', category: 'decoration', resourceId: 'plant-001' },
    { id: 'sofa1', name: 'Leather Sofa', path: '/models/sofa.glb', category: 'furniture', resourceId: 'sofa-001' }
  ];
  
  // Event handlers
  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    console.log('Room changed to:', roomId);
    // Here you would typically load the new room in your 3D scene
  };
  
  const handleItemAdd = (item: any) => {
    setLoadedItems(prev => [...prev, item]);
    console.log('Item added:', item);
    // Here you would typically add the item to your 3D scene
  };
  
  const handleItemRemove = (itemId: string) => {
    setLoadedItems(prev => prev.filter(item => item.id !== itemId));
    console.log('Item removed:', itemId);
    // Here you would typically remove the item from your 3D scene
  };
  
  const handleClearAllItems = () => {
    setLoadedItems([]);
    console.log('All items cleared');
    // Here you would typically clear all items from your 3D scene
  };
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Main content area - this would be your 3D scene */}
      <div style={{
        width: '80%',
        height: '80%',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div>
          <h1>3D Scene Area</h1>
          <p>Your Babylon.js scene would render here</p>
          <p style={{ fontSize: '16px', marginTop: '20px' }}>Selected Room: {selectedRoomId || 'None'}</p>
          <p style={{ fontSize: '16px' }}>Loaded Items: {loadedItems.length}</p>
        </div>
      </div>
      
      {/* Toggle button */}
      <button
        onClick={() => setIsOverlayVisible(!isOverlayVisible)}
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
          zIndex: 1001,
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {isOverlayVisible ? '🏠 Hide Controls' : '🏠 Show Controls'}
      </button>
      
      {/* OverlayUI Component */}
      <OverlayUI
        isVisible={isOverlayVisible}
        onToggle={() => setIsOverlayVisible(!isOverlayVisible)}
        
        // Room configuration
        rooms={sampleRooms}
        selectedRoomId={selectedRoomId}
        onRoomChange={handleRoomChange}
        
        // Item configuration
        items={sampleItems}
        loadedItems={loadedItems}
        onItemAdd={handleItemAdd}
        onItemRemove={handleItemRemove}
        onClearAllItems={handleClearAllItems}
        
        // UI configuration
        showRoomControls={true}
        showItemControls={true}
        compactMode={false}
        
        // Custom styling
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Custom content can be added here */}
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#f0f8ff', 
          borderRadius: '6px',
          border: '1px solid #d4edda'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>💡 Custom Section</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#155724' }}>
            You can add custom content here using the children prop.
          </p>
        </div>
      </OverlayUI>
    </div>
  );
};

export default OverlayUIExample;