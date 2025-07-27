import React from 'react';

interface SceneControlButtonsProps {
  onReset: () => void;
  onToggleFullscreen: () => void;
  onToggleAvatarOverlay: () => void;
  onToggleRoomOverlay: () => void;
  onSaveManifest: () => void;
  isFullscreen: boolean;
}

const SceneControlButtons: React.FC<SceneControlButtonsProps> = ({
  onReset,
  onToggleFullscreen: onToggleFullscreen,
  onToggleAvatarOverlay: onToggleAvatarOverlay,
  onToggleRoomOverlay: onToggleRoomOverlay,
  onSaveManifest,
  isFullscreen,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '0',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        gap: '10px',
      }}
    >
      <button
        onClick={onReset}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(2px)',
          transition: 'background-color 0.2s ease',
          outline: 'none',
        }}
        title="Reset Camera and Avatar"
      >
        🔄
      </button>
      <button
        onClick={onToggleFullscreen}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(2px)',
          transition: 'background-color 0.2s ease',
          outline: 'none',
        }}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? '⤓' : '⤢'}
      </button>
      <button
        onClick={onToggleAvatarOverlay}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(2px)',
          transition: 'background-color 0.2s ease',
          outline: 'none',
        }}
        title="Toggle Avatar"
      >
        👥
      </button>
      <button
        onClick={onToggleRoomOverlay}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(2px)',
          transition: 'background-color 0.2s ease',
          outline: 'none',
        }}
        title="Toggle Room"
      >
        🏠
      </button>
      <button
        onClick={onSaveManifest}
        style={{
          backgroundColor: 'rgba(34, 197, 94, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(2px)',
          transition: 'background-color 0.2s ease',
          outline: 'none',
        }}
        title="Save Manifest"
      >
        💾
      </button>
    </div>
  );
};

export default SceneControlButtons;