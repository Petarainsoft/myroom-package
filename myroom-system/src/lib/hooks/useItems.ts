import { useState, useCallback, useRef, useEffect } from 'react';
import { UseItemsReturn, ItemConfig } from '../types';
import { createError, debugLog, generateId, isValidUrl } from '../utils';
import { ITEM_CATEGORIES, SUPPORTED_FORMATS } from '../constants';

/**
 * Hook for items management functionality
 * Provides methods to add, remove, and manage 3D items in the scene
 */
export function useItems(): UseItemsReturn {
  // State management
  const [items, setItems] = useState<ItemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<ItemConfig[]>([]);
  
  // Refs for stable references
  const itemsRef = useRef<Map<string, any>>(new Map());
  const callbacksRef = useRef<{
    onItemAdded?: (item: ItemConfig) => void;
    onItemRemoved?: (itemId: string) => void;
    onItemSelected?: (itemId: string | null) => void;
    onItemMoved?: (itemId: string, position: { x: number; y: number; z: number }) => void;
    onError?: (error: Error) => void;
  }>({});
  
  // Add item to scene
  const addItem = useCallback(async (itemConfig: Omit<ItemConfig, 'id'>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate unique ID for the item
      const id = generateId();
      const item: ItemConfig = {
        ...itemConfig,
        id
      };
      
      debugLog('Adding item', { item });
      
      // Validate item configuration
      if (item.url && !isValidUrl(item.url)) {
        throw new Error('Invalid item URL');
      }
      
      if (item.format && !SUPPORTED_FORMATS.models.includes(item.format)) {
        throw new Error(`Unsupported item format: ${item.format}`);
      }
      
      // Check if item with same name already exists
      const existingItem = items.find(existingItem => existingItem.name === item.name);
      if (existingItem) {
        throw new Error(`Item with name '${item.name}' already exists`);
      }
      
      // Here you would implement the actual item loading logic
      // This would interact with the Babylon.js scene to load and place the item
      
      setItems(prev => [...prev, item]);
      
      debugLog('Item added successfully', { item });
      callbacksRef.current.onItemAdded?.(item);
      
      return item;
    } catch (err) {
      const error = createError('ITEM_LOAD_FAILED', `Failed to add item: ${itemConfig.name}`, err);
      setError(error);
      debugLog('Item add failed', { itemConfig, error });
      callbacksRef.current.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [items]);
  
  // Remove item from scene
  const removeItem = useCallback(async (itemId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Removing item', { itemId });
      
      const itemToRemove = items.find(item => item.id === itemId);
      if (!itemToRemove) {
        throw new Error(`Item with ID ${itemId} not found`);
      }
      
      // Here you would implement the actual item removal logic
      // This would dispose the item from the Babylon.js scene
      
      setItems(prev => prev.filter(item => item.id !== itemId));
      
      // Clear selection if removed item was selected
      if (selectedItem === itemId) {
        setSelectedItem(null);
        callbacksRef.current.onItemSelected?.(null);
      }
      
      // Remove from refs
      itemsRef.current.delete(itemId);
      
      debugLog('Item removed successfully', { itemId });
      callbacksRef.current.onItemRemoved?.(itemId);
    } catch (err) {
      const error = createError('ITEM_LOAD_FAILED', `Failed to remove item: ${itemId}`, err);
      setError(error);
      debugLog('Item removal failed', { itemId, error });
      callbacksRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [items, selectedItem]);
  
  // Update item configuration
  const updateItem = useCallback(async (itemId: string, updates: Partial<ItemConfig>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Updating item', { itemId, updates });
      
      const itemIndex = items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        throw new Error(`Item with ID ${itemId} not found`);
      }
      
      const updatedItem = { ...items[itemIndex], ...updates };
      
      // Here you would implement the actual item update logic
      // This would modify the item properties in the Babylon.js scene
      
      setItems(prev => {
        const newItems = [...prev];
        newItems[itemIndex] = updatedItem;
        return newItems;
      });
      
      debugLog('Item updated successfully', { itemId, updatedItem });
      
      return updatedItem;
    } catch (err) {
      const error = createError('ITEM_UPDATE_FAILED', `Failed to update item: ${itemId}`, err);
      setError(error);
      debugLog('Item update failed', { itemId, updates, error });
      callbacksRef.current.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [items]);
  
  // Move item to new position
  const moveItem = useCallback(async (itemId: string, position: { x: number; y: number; z: number }) => {
    try {
      setError(null);
      
      debugLog('Moving item', { itemId, position });
      
      const item = items.find(item => item.id === itemId);
      if (!item) {
        throw new Error(`Item with ID ${itemId} not found`);
      }
      
      // Here you would implement the actual item movement logic
      // This would update the item position in the Babylon.js scene
      
      await updateItem(itemId, { position });
      
      debugLog('Item moved successfully', { itemId, position });
      callbacksRef.current.onItemMoved?.(itemId, position);
    } catch (err) {
      const error = createError('ITEM_UPDATE_FAILED', `Failed to move item: ${itemId}`, err);
      setError(error);
      debugLog('Item move failed', { itemId, position, error });
      callbacksRef.current.onError?.(error);
    }
  }, [items, updateItem]);
  
  // Rotate item
  const rotateItem = useCallback(async (itemId: string, rotation: { x: number; y: number; z: number }) => {
    try {
      setError(null);
      
      debugLog('Rotating item', { itemId, rotation });
      
      const item = items.find(item => item.id === itemId);
      if (!item) {
        throw new Error(`Item with ID ${itemId} not found`);
      }
      
      // Here you would implement the actual item rotation logic
      // This would update the item rotation in the Babylon.js scene
      
      await updateItem(itemId, { rotation });
      
      debugLog('Item rotated successfully', { itemId, rotation });
    } catch (err) {
      const error = createError('ITEM_UPDATE_FAILED', `Failed to rotate item: ${itemId}`, err);
      setError(error);
      debugLog('Item rotation failed', { itemId, rotation, error });
      callbacksRef.current.onError?.(error);
    }
  }, [items, updateItem]);
  
  // Scale item
  const scaleItem = useCallback(async (itemId: string, scale: { x: number; y: number; z: number }) => {
    try {
      setError(null);
      
      debugLog('Scaling item', { itemId, scale });
      
      const item = items.find(item => item.id === itemId);
      if (!item) {
        throw new Error(`Item with ID ${itemId} not found`);
      }
      
      // Here you would implement the actual item scaling logic
      // This would update the item scale in the Babylon.js scene
      
      await updateItem(itemId, { scale });
      
      debugLog('Item scaled successfully', { itemId, scale });
    } catch (err) {
      const error = createError('ITEM_UPDATE_FAILED', `Failed to scale item: ${itemId}`, err);
      setError(error);
      debugLog('Item scaling failed', { itemId, scale, error });
      callbacksRef.current.onError?.(error);
    }
  }, [items, updateItem]);
  
  // Select item
  const selectItem = useCallback((itemId: string | null) => {
    try {
      debugLog('Selecting item', { itemId });
      
      if (itemId && !items.find(item => item.id === itemId)) {
        throw new Error(`Item with ID ${itemId} not found`);
      }
      
      setSelectedItem(itemId);
      
      debugLog('Item selected successfully', { itemId });
      callbacksRef.current.onItemSelected?.(itemId);
    } catch (err) {
      const error = createError('ITEM_UPDATE_FAILED', `Failed to select item: ${itemId}`, err);
      setError(error);
      debugLog('Item selection failed', { itemId, error });
      callbacksRef.current.onError?.(error);
    }
  }, [items]);
  
  // Get item by ID
  const getItem = useCallback((itemId: string): ItemConfig | null => {
    return items.find(item => item.id === itemId) || null;
  }, [items]);
  
  // Get items by category
  const getItemsByCategory = useCallback((category: string): ItemConfig[] => {
    return items.filter(item => item.category === category);
  }, [items]);
  
  // Clear all items
  const clearItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      debugLog('Clearing all items');
      
      // Here you would implement the actual items clearing logic
      // This would dispose all items from the Babylon.js scene
      
      setItems([]);
      setSelectedItem(null);
      itemsRef.current.clear();
      
      debugLog('All items cleared successfully');
      callbacksRef.current.onItemSelected?.(null);
    } catch (err) {
      const error = createError('ITEM_UPDATE_FAILED', 'Failed to clear items', err);
      setError(error);
      debugLog('Items clearing failed', { error });
      callbacksRef.current.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Get available items from catalog
  const getAvailableItems = useCallback(async () => {
    try {
      setError(null);
      
      debugLog('Fetching available items');
      
      // Here you would implement the actual available items fetching logic
      // This might involve API calls or reading from a manifest
      
      const categoryKeys = Object.keys(ITEM_CATEGORIES);
      
      const availableItemsData: ItemConfig[] = [
        {
          id: 'chair-1',
          name: 'Modern Chair',
          category: categoryKeys[0] || 'furniture',
          url: '/assets/models/chair.glb',
          format: 'glb',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        {
          id: 'table-1',
          name: 'Coffee Table',
          category: categoryKeys[0] || 'furniture',
          url: '/assets/models/table.glb',
          format: 'glb',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        {
          id: 'lamp-1',
          name: 'Floor Lamp',
          category: categoryKeys[1] || 'lighting',
          url: '/assets/models/lamp.glb',
          format: 'glb',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        }
      ];
      
      setAvailableItems(availableItemsData);
      
      debugLog('Available items fetched', { count: availableItemsData.length });
      return availableItemsData;
    } catch (err) {
      const error = createError('ITEM_LOAD_FAILED', 'Failed to fetch available items', err);
      setError(error);
      debugLog('Available items fetch failed', { error });
      callbacksRef.current.onError?.(error);
      return [];
    }
  }, []);
  
  // Set callbacks
  const setCallbacks = useCallback((callbacks: {
    onItemAdded?: (item: ItemConfig) => void;
    onItemRemoved?: (itemId: string) => void;
    onItemSelected?: (itemId: string | null) => void;
    onItemMoved?: (itemId: string, position: { x: number; y: number; z: number }) => void;
    onError?: (error: Error) => void;
  }) => {
    callbacksRef.current = callbacks;
  }, []);
  
  // Initialize available items on mount
  useEffect(() => {
    getAvailableItems();
  }, [getAvailableItems]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debugLog('Cleaning up items resources');
      itemsRef.current.clear();
    };
  }, []);
  
  return {
    // State
    items,
    isLoading,
    error,
    selectedItem,
    availableItems,
    
    // Methods
    addItem,
    removeItem,
    updateItem,
    moveItem,
    rotateItem,
    scaleItem,
    selectItem,
    getItem,
    getItemsByCategory,
    clearItems,
    getAvailableItems,
    setCallbacks
  };
}