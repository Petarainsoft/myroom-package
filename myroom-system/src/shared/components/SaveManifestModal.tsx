import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface SaveManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export function SaveManifestModal({ isOpen, onClose, onSave }: SaveManifestModalProps) {
  const [manifestName, setManifestName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!manifestName.trim()) {
      setError('Please enter a manifest name');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await onSave(manifestName.trim());
      setManifestName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save manifest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setManifestName('');
      setError('');
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSave();
    } else if (e.key === 'Escape' && !isLoading) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937'
            }}
          >
            Save Manifest
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: '#6b7280',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}
          >
            Manifest Name
          </label>
          <input
            type="text"
            value={manifestName}
            onChange={(e) => {
              setManifestName(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyPress}
            placeholder="Enter manifest name..."
            disabled={isLoading}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              backgroundColor: isLoading ? '#f9fafb' : 'white',
              cursor: isLoading ? 'not-allowed' : 'text',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              if (!error) {
                e.target.style.borderColor = '#3b82f6';
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.target.style.borderColor = '#e5e7eb';
              }
            }}
          />
          {error && (
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: '#ef4444'
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: isLoading ? 0.5 : 1,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !manifestName.trim()}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: isLoading || !manifestName.trim() ? '#9ca3af' : '#22c55e',
              color: 'white',
              cursor: isLoading || !manifestName.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && manifestName.trim()) {
                e.currentTarget.style.backgroundColor = '#16a34a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && manifestName.trim()) {
                e.currentTarget.style.backgroundColor = '#22c55e';
              }
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add CSS animation for spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);