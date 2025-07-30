import React, { useState, useEffect } from 'react';
import { manifestService } from '../../shared/services/ManifestService';

// Types for the overlay UI
export interface OverlayUIProps {
  // Visibility control
  isVisible?: boolean;
  onToggle?: () => void;
  
  // Position and styling
  position?: {
    top?: string;
    right?: string;
    left?: string;
    bottom?: string;
  };
  className?: string;
  style?: React.CSSProperties;
  
  // Room controls
  rooms?: Array<{
    id: string;
    name: string;
    resourceId?: string;
  }>;
  selectedRoomId?: string;
  onRoomChange?: (roomId: string) => void;
  
  // Item controls
  items?: Array<{
    id: string;
    name: string;
    path: string;
    category: string;
    resourceId?: string;
  }>;
  loadedItems?: Array<{
    id: string;
    name: string;
    path: string;
    position: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
  }>;
  onItemAdd?: (item: any) => void;
  onItemRemove?: (itemId: string) => void;
  onClearAllItems?: () => void;
  
  // UI configuration
  showRoomControls?: boolean;
  showItemControls?: boolean;
  compactMode?: boolean;
  
  // Custom content
  children?: React.ReactNode;
}

interface LoadedItem {
  id: string;
  name: string;
  path: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}

/**
 * OverlayUI - Reusable overlay interface component
 * 
 * Provides a floating overlay interface for room and item controls,
 * extracted from InteractiveRoom for reusability across different contexts.
 */
export const OverlayUI: React.FC<OverlayUIProps> = ({
  isVisible = true,
  onToggle,
  position = { top: '70px', right: '20px' },
  className = '',
  style = {},
  rooms = [],
  selectedRoomId = '',
  onRoomChange,
  items = [],
  loadedItems = [],
  onItemAdd,
  onItemRemove,
  onClearAllItems,
  showRoomControls = true,
  showItemControls = true,
  compactMode = false,
  children
}) => {
  // Local state for item management
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItemPerCategory, setSelectedItemPerCategory] = useState<Record<string, any>>({});
  
  // Get unique categories from items
  const categories = [...new Set(items.map(item => item.category))];
  
  // Filter items by selected category
  const filteredItems = selectedCategory 
    ? items.filter(item => item.category === selectedCategory)
    : [];
  
  // Handle adding item
  const handleAddItem = () => {
    if (!selectedCategory || !selectedItemPerCategory[selectedCategory]) return;
    
    const item = selectedItemPerCategory[selectedCategory];
    const newItem = {
      id: `${item.id}_${Date.now()}`,
      name: item.name,
      path: item.path,
      position: { x: 0, y: 0, z: 0 },
      resourceId: item.resourceId
    };
    
    onItemAdd?.(newItem);
  };
  
  // Handle removing item
  const handleRemoveItem = (itemId: string) => {
    onItemRemove?.(itemId);
  };
  
  // Handle clearing all items
  const handleClearAllItems = () => {
    onClearAllItems?.();
  };
  
  // Default overlay styles
  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #d9d9d9',
    borderRadius: '8px',
    padding: compactMode ? '15px' : '20px',
    minWidth: compactMode ? '250px' : '300px',
    maxWidth: compactMode ? '350px' : '400px',
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(10px)',
    ...position,
    ...style
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`overlay-ui-integrated ${className}`} style={overlayStyle}>
      {/* Room Controls Section */}
      {showRoomControls && rooms.length > 0 && (
        <div className="control-section" style={{ marginBottom: compactMode ? '15px' : '20px' }}>
          <div className="section-header" style={{ marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: compactMode ? '16px' : '18px' }}>🏠 Room</h3>
          </div>
          <div className="room-selector">
            <select
              value={selectedRoomId}
              onChange={(e) => onRoomChange?.(e.target.value)}
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
      )}
      
      {/* Items Controls Section */}
      {showItemControls && items.length > 0 && (
        <div className="control-section">
          <div className="section-header" style={{ marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: compactMode ? '16px' : '18px' }}>🪑 Categories</h3>
          </div>
          
          {/* Category/Items Panel */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Category Panel */}
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
            
            {/* Items Panel */}
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
                
                {/* Item list */}
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
                
                {/* Add item button */}
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
            
            {/* Clear all button */}
            {loadedItems.length > 0 && (
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
            )}
          </div>
        </div>
      )}
      
      {/* Custom content */}
      {children}
    </div>
  );
};

export default OverlayUI;