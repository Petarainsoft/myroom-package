import React, { useState, useCallback } from 'react';
import { AvatarConfig } from '../../shared/types/AvatarTypes';
import { RoomConfig, SceneConfig, ItemConfig, MyRoomExportConfig } from '../types';
import { exportConfigToJson, importConfigFromJson, debugLog } from '../utils';
import { GENDER_OPTIONS, ROOM_CATEGORIES, ITEM_CATEGORIES } from '../constants';

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
export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  roomConfig,
  avatarConfig,
  sceneConfig,
  items = [],
  onRoomConfigChange,
  onAvatarConfigChange,
  onSceneConfigChange,
  onExport,
  onImport,
  onError,
  collapsible = true,
  defaultCollapsed = false,
  title = 'Configuration Panel',
  className,
  style
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeTab, setActiveTab] = useState<'room' | 'avatar' | 'scene' | 'export'>('room');
  
  // Handle room configuration changes
  const handleRoomConfigChange = useCallback((field: string, value: any) => {
    try {
      const updates = { [field]: value };
      debugLog('Room config change', { field, value, updates });
      onRoomConfigChange?.(updates);
    } catch (error) {
      debugLog('Room config change failed', { field, value, error });
      onError?.(error as Error);
    }
  }, [onRoomConfigChange, onError]);
  
  // Handle avatar configuration changes
  const handleAvatarConfigChange = useCallback((field: string, value: any) => {
    try {
      const updates = { [field]: value };
      debugLog('Avatar config change', { field, value, updates });
      onAvatarConfigChange?.(updates);
    } catch (error) {
      debugLog('Avatar config change failed', { field, value, error });
      onError?.(error as Error);
    }
  }, [onAvatarConfigChange, onError]);
  
  // Handle scene configuration changes
  const handleSceneConfigChange = useCallback((field: string, value: any) => {
    try {
      const updates = { [field]: value };
      debugLog('Scene config change', { field, value, updates });
      onSceneConfigChange?.(updates);
    } catch (error) {
      debugLog('Scene config change failed', { field, value, error });
      onError?.(error as Error);
    }
  }, [onSceneConfigChange, onError]);
  
  // Export configuration
  const handleExport = useCallback(() => {
    try {
      const config: MyRoomExportConfig = {
        room: roomConfig?.id || '',
        avatar: avatarConfig!,
        items: items,
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      debugLog('Exporting configuration', { config });
      
      // Create and download JSON file
      const jsonString = exportConfigToJson(config);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `myroom-config-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      onExport?.(config);
      debugLog('Configuration exported successfully');
    } catch (error) {
      debugLog('Export failed', { error });
      onError?.(error as Error);
    }
  }, [roomConfig, avatarConfig, items, onExport, onError]);
  
  // Import configuration
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      
      debugLog('Importing configuration', { fileName: file.name });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonString = e.target?.result as string;
          const config = importConfigFromJson(jsonString);
          
          debugLog('Configuration imported successfully', { config });
          onImport?.(config);
        } catch (error) {
          debugLog('Import parsing failed', { error });
          onError?.(error as Error);
        }
      };
      
      reader.onerror = () => {
        const error = new Error('Failed to read file');
        debugLog('Import file read failed', { error });
        onError?.(error);
      };
      
      reader.readAsText(file);
    } catch (error) {
      debugLog('Import failed', { error });
      onError?.(error as Error);
    }
  }, [onImport, onError]);
  
  const panelStyle: React.CSSProperties = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    ...style
  };
  
  const headerStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: collapsible ? 'pointer' : 'default'
  };
  
  const contentStyle: React.CSSProperties = {
    padding: '16px',
    display: isCollapsed ? 'none' : 'block'
  };
  
  const tabStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: '1px solid #ddd',
    marginBottom: '16px'
  };
  
  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    border: 'none',
    backgroundColor: isActive ? '#007bff' : 'transparent',
    color: isActive ? '#fff' : '#333',
    cursor: 'pointer',
    borderRadius: '4px 4px 0 0'
  });
  
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '8px'
  };
  
  const selectStyle: React.CSSProperties = {
    ...inputStyle
  };
  
  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    marginRight: '8px'
  };
  
  return (
    <div className={className} style={panelStyle}>
      {/* Header */}
      <div 
        style={headerStyle}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <h3 style={{ margin: 0, fontSize: '16px' }}>{title}</h3>
        {collapsible && (
          <span style={{ fontSize: '14px' }}>
            {isCollapsed ? '▼' : '▲'}
          </span>
        )}
      </div>
      
      {/* Content */}
      <div style={contentStyle}>
        {/* Tabs */}
        <div style={tabStyle}>
          <button
            style={tabButtonStyle(activeTab === 'room')}
            onClick={() => setActiveTab('room')}
          >
            Room
          </button>
          <button
            style={tabButtonStyle(activeTab === 'avatar')}
            onClick={() => setActiveTab('avatar')}
          >
            Avatar
          </button>
          <button
            style={tabButtonStyle(activeTab === 'scene')}
            onClick={() => setActiveTab('scene')}
          >
            Scene
          </button>
          <button
            style={tabButtonStyle(activeTab === 'export')}
            onClick={() => setActiveTab('export')}
          >
            Export/Import
          </button>
        </div>
        
        {/* Room Configuration */}
        {activeTab === 'room' && (
          <div>
            <h4>Room Settings</h4>
            
            <label>Room Category:</label>
            <select
              style={selectStyle}
              value={roomConfig?.category || ''}
              onChange={(e) => handleRoomConfigChange('category', e.target.value)}
            >
              <option value="">Select Category</option>
              {ROOM_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <label>Lighting Intensity:</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              style={inputStyle}
              value={roomConfig?.lighting?.intensity || 1}
              onChange={(e) => handleRoomConfigChange('lighting', {
                ...roomConfig?.lighting,
                intensity: parseFloat(e.target.value)
              })}
            />
            
            <label>Background Color:</label>
            <input
              type="color"
              style={inputStyle}
              value={roomConfig?.background || '#87CEEB'}
              onChange={(e) => handleRoomConfigChange('background', e.target.value)}
            />
          </div>
        )}
        
        {/* Avatar Configuration */}
        {activeTab === 'avatar' && (
          <div>
            <h4>Avatar Settings</h4>
            
            <label>Gender:</label>
            <select
              style={selectStyle}
              value={avatarConfig?.gender || ''}
              onChange={(e) => handleAvatarConfigChange('gender', e.target.value)}
            >
              <option value="">Select Gender</option>
              {GENDER_OPTIONS.map(gender => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
            
            <label>Avatar URL:</label>
            <input
              type="url"
              style={inputStyle}
              value={avatarConfig?.url || ''}
              onChange={(e) => handleAvatarConfigChange('url', e.target.value)}
              placeholder="https://example.com/avatar.glb"
            />
            
            <label>Outfit ID:</label>
            <input
              type="text"
              style={inputStyle}
              value={avatarConfig?.outfitId || ''}
              onChange={(e) => handleAvatarConfigChange('outfitId', e.target.value)}
              placeholder="casual-outfit-1"
            />
          </div>
        )}
        
        {/* Scene Configuration */}
        {activeTab === 'scene' && (
          <div>
            <h4>Scene Settings</h4>
            
            <label>Background:</label>
            <input
              type="color"
              style={inputStyle}
              value={sceneConfig?.background || '#87CEEB'}
              onChange={(e) => handleSceneConfigChange('background', e.target.value)}
            />
            
            <label>Enable Physics:</label>
            <input
              type="checkbox"
              checked={sceneConfig?.physics?.enabled || false}
              onChange={(e) => handleSceneConfigChange('physics', {
                ...sceneConfig?.physics,
                enabled: e.target.checked
              })}
            />
            
            <label>Enable Shadows:</label>
            <input
              type="checkbox"
              checked={sceneConfig?.shadows || false}
              onChange={(e) => handleSceneConfigChange('shadows', e.target.checked)}
            />
          </div>
        )}
        
        {/* Export/Import */}
        {activeTab === 'export' && (
          <div>
            <h4>Export/Import Configuration</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <button style={buttonStyle} onClick={handleExport}>
                Export Configuration
              </button>
              <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>
                Download current room, avatar, and items configuration as JSON file.
              </p>
            </div>
            
            <div>
              <label>Import Configuration:</label>
              <input
                type="file"
                accept=".json"
                style={inputStyle}
                onChange={handleImport}
              />
              <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>
                Upload a previously exported JSON configuration file.
              </p>
            </div>
            
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h5 style={{ margin: '0 0 8px 0' }}>Current Configuration Summary:</h5>
              <div style={{ fontSize: '12px' }}>
                <div>Room: {roomConfig?.id || 'Not set'}</div>
                <div>Avatar: {avatarConfig?.gender || 'Not set'}</div>
                <div>Items: {items.length} items</div>
                <div>Scene Background: {sceneConfig?.background || 'Default'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPanel;