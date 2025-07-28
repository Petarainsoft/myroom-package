import React, { useState, useEffect } from 'react';
import { ChevronDown, RefreshCw, Save, Trash2, Edit, Plus, FilePlus } from 'lucide-react';
import { manifestService } from '../services/ManifestService';
import { PresetConfig } from '../types/PresetConfig';

interface ManifestItem {
  id: string;
  name: string;
  description?: string;
  config: PresetConfig;
  createdAt: string;
  updatedAt: string;
}

interface ManifestDropdownProps {
  onManifestSelect: (manifestId: string) => void;
  onManifestSave: (name: string, config: PresetConfig) => Promise<void>;
  onManifestDelete?: (manifestId: string) => Promise<void>;
  currentConfig?: PresetConfig;
  className?: string;
}

export function ManifestDropdown({ 
  onManifestSelect, 
  onManifestSave, 
  onManifestDelete,
  currentConfig,
  className = '' 
}: ManifestDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [manifests, setManifests] = useState<ManifestItem[]>([]);
  const [selectedManifest, setSelectedManifest] = useState<ManifestItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveManifestName, setSaveManifestName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load manifests from backend
  const loadManifests = async () => {
    setIsLoading(true);
    setError('');
    try {
      const manifestList = await manifestService.listPresets();
      setManifests(manifestList);
      
      // Set default selected manifest if none selected
      if (!selectedManifest && manifestList.length > 0) {
        setSelectedManifest(manifestList[0]);
      }
    } catch (err) {
      setError('Failed to load manifests');
      console.error('Error loading manifests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load manifests on component mount
  useEffect(() => {
    loadManifests();
  }, []);

  // Handle manifest selection
  const handleManifestSelect = (manifest: ManifestItem) => {
    setSelectedManifest(manifest);
    setIsOpen(false);
    onManifestSelect(manifest.id);
  };

  // Handle save manifest
  const handleSaveManifest = async () => {
    if (!saveManifestName.trim() || !currentConfig) {
      setError('Please enter a manifest name');
      return;
    }

    setIsSaving(true);
    setError('');
    
    try {
      await onManifestSave(saveManifestName.trim(), currentConfig);
      setSaveManifestName('');
      setShowSaveModal(false);
      // Reload manifests to show the new one
      await loadManifests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save manifest');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete manifest
  const handleDeleteManifest = async (manifestId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this manifest?')) {
      return;
    }

    try {
      if (onManifestDelete) {
        await onManifestDelete(manifestId);
      } else {
        await manifestService.deletePreset(manifestId);
      }
      await loadManifests();
      
      // Clear selection if deleted manifest was selected
      if (selectedManifest?.id === manifestId) {
        setSelectedManifest(null);
      }
    } catch (err) {
      setError('Failed to delete manifest');
      console.error('Error deleting manifest:', err);
    }
  };

  return (
    <div className={`manifest-dropdown ${className}`}>
      {/* Dropdown Header */}
      <div className="dropdown-header">
        <label className="dropdown-label">
          Scene Manifest
        </label>
        <div className="dropdown-actions">
          <button
            onClick={() => setShowSaveModal(true)}
            className="action-btn save-btn"
            title="Save Current Scene"
            disabled={!currentConfig}
          >
            <Save size={16} />
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="action-btn save-as-new-btn"
            title="Save as New Manifest"
            disabled={!currentConfig}
          >
            <FilePlus size={16} />
          </button>
          <button
            onClick={loadManifests}
            className="action-btn refresh-btn"
            title="Refresh Manifests"
            disabled={isLoading}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Dropdown Container */}
      <div className="dropdown-container">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
          disabled={isLoading}
        >
          <span className="dropdown-text">
            {isLoading ? 'Loading...' : 
             selectedManifest ? selectedManifest.name : 
             'Select a manifest'}
          </span>
          <ChevronDown 
            size={16} 
            className={`dropdown-icon ${isOpen ? 'rotated' : ''}`} 
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="dropdown-menu">
            {manifests.length === 0 ? (
              <div className="dropdown-item disabled">
                {isLoading ? 'Loading...' : 'No manifests available'}
              </div>
            ) : (
              manifests.map((manifest) => (
                <div
                  key={manifest.id}
                  className={`dropdown-item ${
                    selectedManifest?.id === manifest.id ? 'selected' : ''
                  }`}
                  onClick={() => handleManifestSelect(manifest)}
                >
                  <div className="item-content">
                    <div className="item-name">{manifest.name}</div>
                    {manifest.description && (
                      <div className="item-description">{manifest.description}</div>
                    )}
                    <div className="item-date">
                      Updated: {new Date(manifest.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteManifest(manifest.id, e)}
                    className="delete-btn"
                    title="Delete Manifest"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Save Manifest Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Save Scene Manifest</h3>
            <input
              type="text"
              value={saveManifestName}
              onChange={(e) => setSaveManifestName(e.target.value)}
              placeholder="Enter manifest name..."
              className="manifest-name-input"
              autoFocus
            />
            <div className="modal-actions">
              <button
                onClick={() => setShowSaveModal(false)}
                className="cancel-btn"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManifest}
                className="save-btn"
                disabled={isSaving || !saveManifestName.trim()}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .manifest-dropdown {
          width: 100%;
          max-width: 300px;
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .dropdown-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .dropdown-actions {
          display: flex;
          gap: 4px;
        }

        .action-btn {
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          border-radius: 4px;
          background: #f3f4f6;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover:not(:disabled) {
          background: #e5e7eb;
          color: #374151;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-as-new-btn {
          background: #10b981 !important;
          color: white !important;
        }

        .save-as-new-btn:hover:not(:disabled) {
          background: #059669 !important;
          color: white !important;
        }

        .dropdown-container {
          position: relative;
        }

        .dropdown-trigger {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .dropdown-trigger:hover:not(:disabled) {
          border-color: #d1d5db;
        }

        .dropdown-trigger.open {
          border-color: #3b82f6;
        }

        .dropdown-trigger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dropdown-text {
          font-size: 14px;
          color: #374151;
          text-align: left;
        }

        .dropdown-icon {
          transition: transform 0.2s;
        }

        .dropdown-icon.rotated {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
        }

        .dropdown-item {
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background-color 0.2s;
        }

        .dropdown-item:hover:not(.disabled) {
          background: #f9fafb;
        }

        .dropdown-item.selected {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
        }

        .dropdown-item.disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }

        .item-content {
          flex: 1;
        }

        .item-name {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .item-description {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        .item-date {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
        }

        .delete-btn {
          padding: 4px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #ef4444;
          cursor: pointer;
          opacity: 0.7;
          transition: all 0.2s;
        }

        .delete-btn:hover {
          opacity: 1;
          background: #fef2f2;
        }

        .error-message {
          margin-top: 8px;
          padding: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          color: #dc2626;
          font-size: 12px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          min-width: 400px;
          max-width: 500px;
        }

        .modal-content h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .manifest-name-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
          box-sizing: border-box;
        }

        .manifest-name-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-btn {
          padding: 10px 20px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #374151;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #f9fafb;
        }

        .save-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: #22c55e;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .save-btn:hover:not(:disabled) {
          background: #16a34a;
        }

        .save-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}