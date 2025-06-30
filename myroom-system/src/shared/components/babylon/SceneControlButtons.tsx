import React from 'react';

interface SceneControlButtonsProps {
  onReset: () => void;
  onToggleFullscreen: () => void;
  onToggleUIOverlay: () => void;
  isFullscreen: boolean;
}

const SceneControlButtons: React.FC<SceneControlButtonsProps> = ({
  onReset,
  onToggleFullscreen,
  onToggleUIOverlay,
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
        onClick={onToggleUIOverlay}
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
        title="Toggle UI Controls"
      >
        ⚙
      </button>
    </div>
  );
};

export default SceneControlButtons; 