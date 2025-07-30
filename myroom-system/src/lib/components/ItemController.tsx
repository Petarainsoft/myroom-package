import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useItems } from '../hooks/useItems';
import { ItemConfig } from '../types';
import { debugLog } from '../utils';

export interface ItemControllerProps {
  /** Initial items to load */
  initialItems?: ItemConfig[];
  
  /** Callback when item is added */
  onItemAdded?: (item: ItemConfig) => void;
  
  /** Callback when item is removed */
  onItemRemoved?: (itemId: string) => void;
  
  /** Callback when item is selected */
  onItemSelected?: (itemId: string | null) => void;
  
  /** Callback when item is moved */
  onItemMoved?: (itemId: string, position: { x: number; y: number; z: number }) => void;
  
  /** Callback when items list changes */
  onItemsChanged?: (items: ItemConfig[]) => void;
  
  /** Callback for errors */
  onError?: (error: Error) => void;
  
  /** Whether to auto-load initial items on mount */
  autoLoad?: boolean;
  
  /** CSS class name for styling */
  className?: string;
  
  /** Custom styles */
  style?: React.CSSProperties;
}

export interface ItemControllerRef {
  /** Add item to scene */
  addItem: (itemConfig: Omit<ItemConfig, 'id'>) => Promise<ItemConfig>;
  
  /** Remove item from scene */
  removeItem: (itemId: string) => Promise<void>;
  
  /** Update item configuration */
  updateItem: (itemId: string, updates: Partial<ItemConfig>) => Promise<ItemConfig>;
  
  /** Move item to new position */
  moveItem: (itemId: string, position: { x: number; y: number; z: number }) => Promise<void>;
  
  /** Rotate item */
  rotateItem: (itemId: string, rotation: { x: number; y: number; z: number }) => Promise<void>;
  
  /** Scale item */
  scaleItem: (itemId: string, scale: { x: number; y: number; z: number }) => Promise<void>;
  
  /** Select item */
  selectItem: (itemId: string | null) => void;
  
  /** Get item by ID */
  getItem: (itemId: string) => ItemConfig | null;
  
  /** Get items by category */
  getItemsByCategory: (category: string) => ItemConfig[];
  
  /** Clear all items */
  clearItems: () => Promise<void>;
  
  /** Get available items from catalog */
  getAvailableItems: () => Promise<ItemConfig[]>;
  
  /** Get all current items */
  getItems: () => ItemConfig[];
  
  /** Get selected item ID */
  getSelectedItem: () => string | null;
  
  /** Get available items list */
  getAvailableItemsList: () => ItemConfig[];
  
  /** Check if items are loading */
  isLoading: () => boolean;
  
  /** Get current error */
  getError: () => Error | null;
}

/**
 * ItemController Component
 * 
 * A React component that provides item management functionality.
 * This component wraps the useItems hook and provides a clean interface
 * for managing 3D items in the MyRoom system.
 */
export const ItemController = forwardRef<ItemControllerRef, ItemControllerProps>((
  {
    initialItems,
    onItemAdded,
    onItemRemoved,
    onItemSelected,
    onItemMoved,
    onItemsChanged,
    onError,
    autoLoad = true,
    className,
    style
  },
  ref
) => {
  const items = useItems();
  
  // Set up callbacks
  useEffect(() => {
    items.setCallbacks({
      onItemAdded,
      onItemRemoved,
      onItemSelected,
      onItemMoved,
      onError
    });
  }, [items, onItemAdded, onItemRemoved, onItemSelected, onItemMoved, onError]);
  
  // Auto-load initial items if enabled
  useEffect(() => {
    if (autoLoad && initialItems && initialItems.length > 0) {
      debugLog('Auto-loading initial items', { count: initialItems.length });
      
      const loadItems = async () => {
        try {
          for (const item of initialItems) {
            const { id, ...itemConfig } = item;
            await items.addItem(itemConfig);
          }
        } catch (error) {
          debugLog('Auto-load failed', { error });
          onError?.(error as Error);
        }
      };
      
      loadItems();
    }
  }, [autoLoad, initialItems, items, onError]);
  
  // Notify parent of items changes
  useEffect(() => {
    onItemsChanged?.(items.items);
  }, [items.items, onItemsChanged]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    addItem: items.addItem,
    removeItem: items.removeItem,
    updateItem: items.updateItem,
    moveItem: items.moveItem,
    rotateItem: items.rotateItem,
    scaleItem: items.scaleItem,
    selectItem: items.selectItem,
    getItem: items.getItem,
    getItemsByCategory: items.getItemsByCategory,
    clearItems: items.clearItems,
    getAvailableItems: items.getAvailableItems,
    getItems: () => items.items,
    getSelectedItem: () => items.selectedItem,
    getAvailableItemsList: () => items.availableItems,
    isLoading: () => items.isLoading,
    getError: () => items.error
  }), [items]);
  
  // This component doesn't render anything visible by itself
  // It's a logical component that manages items state
  return (
    <div 
      className={className}
      style={{
        display: 'none', // Hidden by default as it's a logical component
        ...style
      }}
      data-component="item-controller"
      data-loading={items.isLoading}
      data-error={!!items.error}
      data-items-count={items.items.length}
      data-selected-item={items.selectedItem}
      data-available-items={items.availableItems.length}
    >
      {/* Debug information in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div>Item Controller Status:</div>
          <div>Loading: {items.isLoading ? 'Yes' : 'No'}</div>
          <div>Error: {items.error?.message || 'None'}</div>
          <div>Items Count: {items.items.length}</div>
          <div>Selected Item: {items.selectedItem || 'None'}</div>
          <div>Available Items: {items.availableItems.length}</div>
          <div>Items by Category:</div>
          {items.items.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) && 
            Object.entries(
              items.items.reduce((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([category, count]) => (
              <div key={category} style={{ marginLeft: '10px' }}>
                {category}: {count}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
});

ItemController.displayName = 'ItemController';

export default ItemController;