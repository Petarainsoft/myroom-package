import { default as React } from 'react';
import { AvatarConfig } from '../../shared/types/AvatarTypes';
import { RoomConfig, SceneConfig, ItemConfig, MyRoomExportConfig } from '../types';
export interface ConfigurationPanelProps {
    /** Current room configuration */
    roomConfig?: RoomConfig;
    /** Current avatar configuration */
    avatarConfig?: AvatarConfig;
    /** Current scene configuration */
    sceneConfig?: SceneConfig;
    /** Current items list */
    items?: ItemConfig[];
    /** Callback when room configuration changes */
    onRoomConfigChange?: (config: Partial<RoomConfig>) => void;
    /** Callback when avatar configuration changes */
    onAvatarConfigChange?: (config: Partial<AvatarConfig>) => void;
    /** Callback when scene configuration changes */
    onSceneConfigChange?: (config: Partial<SceneConfig>) => void;
    /** Callback when configuration is exported */
    onExport?: (config: MyRoomExportConfig) => void;
    /** Callback when configuration is imported */
    onImport?: (config: MyRoomExportConfig) => void;
    /** Callback for errors */
    onError?: (error: Error) => void;
    /** Whether the panel is collapsible */
    collapsible?: boolean;
    /** Initial collapsed state */
    defaultCollapsed?: boolean;
    /** Panel title */
    title?: string;
    /** CSS class name for styling */
    className?: string;
    /** Custom styles */
    style?: React.CSSProperties;
}
/**
 * ConfigurationPanel Component
 *
 * A React component that provides a user interface for configuring
 * room, avatar, and scene settings in the MyRoom system.
 */
export declare const ConfigurationPanel: React.FC<ConfigurationPanelProps>;
export default ConfigurationPanel;
