import { default as React } from 'react';
import { ItemConfig } from '../types';
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
    onItemMoved?: (itemId: string, position: {
        x: number;
        y: number;
        z: number;
    }) => void;
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
    moveItem: (itemId: string, position: {
        x: number;
        y: number;
        z: number;
    }) => Promise<void>;
    /** Rotate item */
    rotateItem: (itemId: string, rotation: {
        x: number;
        y: number;
        z: number;
    }) => Promise<void>;
    /** Scale item */
    scaleItem: (itemId: string, scale: {
        x: number;
        y: number;
        z: number;
    }) => Promise<void>;
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
export declare const ItemController: React.ForwardRefExoticComponent<ItemControllerProps & React.RefAttributes<ItemControllerRef>>;
export default ItemController;
