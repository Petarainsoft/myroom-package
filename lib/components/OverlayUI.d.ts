import { default as React } from 'react';
export interface OverlayUIProps {
    isVisible?: boolean;
    onToggle?: () => void;
    position?: {
        top?: string;
        right?: string;
        left?: string;
        bottom?: string;
    };
    className?: string;
    style?: React.CSSProperties;
    rooms?: Array<{
        id: string;
        name: string;
        resourceId?: string;
    }>;
    selectedRoomId?: string;
    onRoomChange?: (roomId: string) => void;
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
        position: {
            x: number;
            y: number;
            z: number;
        };
        rotation?: {
            x: number;
            y: number;
            z: number;
        };
        scale?: {
            x: number;
            y: number;
            z: number;
        };
    }>;
    onItemAdd?: (item: any) => void;
    onItemRemove?: (itemId: string) => void;
    onClearAllItems?: () => void;
    showRoomControls?: boolean;
    showItemControls?: boolean;
    compactMode?: boolean;
    children?: React.ReactNode;
}
/**
 * OverlayUI - Reusable overlay interface component
 *
 * Provides a floating overlay interface for room and item controls,
 * extracted from InteractiveRoom for reusability across different contexts.
 */
export declare const OverlayUI: React.FC<OverlayUIProps>;
export default OverlayUI;
