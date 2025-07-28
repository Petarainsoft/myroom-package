import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, RefreshCw, Save, Trash2, Edit, Plus, FilePlus, Loader2 } from 'lucide-react';
import { manifestService } from '../services/ManifestService';
import { PresetConfig } from '../types/PresetConfig';
import { toast } from 'sonner';

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
  onGetCurrentConfig?: () => PresetConfig | null;
  className?: string;
}

export function ManifestDropdown({ 
  onManifestSelect, 
  onManifestSave, 
  onManifestDelete,
  currentConfig,
  onGetCurrentConfig,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingManifestId, setDeletingManifestId] = useState<string | null>(null);

  // Load manifests from backend
  const loadManifests = async () => {
    setIsLoading(true);
    setError('');
    try {
      const manifestList = await manifestService.listPresets();
      setManifests(manifestList);
      
      // Set default selected manifest if none selected
      // Prioritize the latest manifest (first in the sorted list)
      if (!selectedManifest && manifestList.length > 0) {
        // Find the most recently updated manifest
        const latestManifest = manifestList.reduce((latest, current) => {
          const latestDate = new Date(latest.updatedAt || latest.createdAt || 0);
          const currentDate = new Date(current.updatedAt || current.createdAt || 0);
          return currentDate > latestDate ? current : latest;
        }, manifestList[0]);
        
        setSelectedManifest(latestManifest);
        console.log('📋 [ManifestDropdown] Auto-selected latest manifest:', latestManifest.name);
      }
    } catch (err) {
      setError('Failed to load manifests');
      console.error('Error loading manifests:', err);
      toast.error('Failed to load manifests');
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

  // Handle save button click - check if we have a selected manifest
  const handleSaveButtonClick = () => {
    if (selectedManifest) {
      // If we have a selected manifest, save directly to it
      handleSaveToExistingManifest();
    } else {
      // If no manifest selected, show save as new modal
      setShowSaveModal(true);
    }
  };

  // Handle saving to existing manifest
  const handleSaveToExistingManifest = async () => {
    if (!selectedManifest) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      // Get fresh config instead of using potentially stale currentConfig
      const freshConfig = onGetCurrentConfig ? onGetCurrentConfig() : currentConfig;
      
      console.log('🔍 [ManifestDropdown.handleSaveToExistingManifest] Fresh config:', freshConfig);
      console.log('🔍 [ManifestDropdown.handleSaveToExistingManifest] Fresh config room:', freshConfig?.room);
      console.log('🔍 [ManifestDropdown.handleSaveToExistingManifest] Fresh config avatar:', freshConfig?.avatar);
      console.log('🔍 [ManifestDropdown.handleSaveToExistingManifest] Fresh config items count:', freshConfig?.items?.length || 0);
      
      if (!freshConfig) {
        setError('No configuration available to save');
        return;
      }
      
      // Use updatePreset instead of createPreset for existing manifests
      await manifestService.updatePreset(selectedManifest.id, selectedManifest.name, freshConfig);
      // Reload manifests to show the updated one
      await loadManifests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update manifest');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save manifest (for save as new)
  const handleSaveManifest = async () => {
    if (!saveManifestName.trim()) {
      setError('Please enter a manifest name');
      return;
    }

    setIsSaving(true);
    setError('');
    
    try {
      // Get fresh config instead of using potentially stale currentConfig
      const freshConfig = onGetCurrentConfig ? onGetCurrentConfig() : currentConfig;
      
      console.log('🔍 [ManifestDropdown.handleSaveManifest] Fresh config for new manifest:', freshConfig);
      
      if (!freshConfig) {
        setError('No configuration available to save');
        return;
      }
      
      await onManifestSave(saveManifestName.trim(), freshConfig);
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
    
    const manifest = manifests.find(m => m.id === manifestId);
    if (!confirm(`Are you sure you want to delete "${manifest?.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    setDeletingManifestId(manifestId);
    setError('');

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
    } finally {
      setIsDeleting(false);
      setDeletingManifestId(null);
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
            className="action-btn save-as-new-btn"
            title="Save as New Manifest"
            disabled={!currentConfig && !onGetCurrentConfig}
          >
            <FilePlus size={16} />
          </button>
          <button
            onClick={handleSaveButtonClick}
            className="action-btn save-btn"
            title={selectedManifest ? `Update "${selectedManifest.name}"` : "Save as New"}
            disabled={!currentConfig && !onGetCurrentConfig}
          >
            <Save size={15} />
          </button>
          <button
            onClick={() => loadManifests()}
            className="action-btn refresh-btn"
            title="Refresh Manifests"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
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
                    key={`delete-${manifest.id}`}
                    onClick={(e) => handleDeleteManifest(manifest.id, e)}
                    className="delete-btn"
                    title="Delete Manifest"
                    disabled={isDeleting && deletingManifestId === manifest.id}
                  >
                    {isDeleting && deletingManifestId === manifest.id ? 
                      <Loader2 size={14} className="animate-spin" /> : 
                      <Trash2 size={14} />
                    }
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
      {showSaveModal && createPortal(
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
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
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
          flex-shrink: 0;
        }

        .save-btn {
          background: #22c55e !important;
          color: white !important;
        }

        .save-btn:hover:not(:disabled) {
          background: #16a34a !important;
          color: white !important;
        }

        .action-btn:hover:not(:disabled) {
          background: #e5e7eb;
          color: #374151;
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
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
          z-index: 9999;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          min-width: 400px;
          max-width: 500px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
          z-index: 10000;
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
          padding: 8px 16px;
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
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          background: #22c55e;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
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