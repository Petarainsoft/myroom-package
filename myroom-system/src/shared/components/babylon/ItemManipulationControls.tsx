import React from 'react';

interface ItemManipulationControlsProps {
  gizmoMode?: 'position' | 'rotation' | 'scale';
  onGizmoModeChange?: (mode: 'position' | 'rotation' | 'scale') => void;
}

export const ItemManipulationControls: React.FC<ItemManipulationControlsProps> = ({ gizmoMode, onGizmoModeChange }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 100,
    }}>
      <button
        onClick={() => onGizmoModeChange?.('position')}
        style={{
          backgroundColor: gizmoMode === 'position' ? 'rgba(33, 150, 243, 0.8)' : 'rgba(0, 0, 0, 0.15)',
          color: 'white',
          border: gizmoMode === 'position' ? '2px solid #2196F3' : 'none',
          borderRadius: '1px',
          padding: '5px',
          cursor: 'pointer',
          fontSize: '13px',
          width: '50px',
          height: '25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
          boxShadow: gizmoMode === 'position' ? '0 0 10px rgba(33, 150, 243, 0.5)' : 'none'
        }}
        title="Move Items (Position)"
        onMouseOver={e => {
          if (gizmoMode !== 'position') {
            (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(33, 150, 243, 0.3)';
          }
        }}
        onMouseOut={e => {
          if (gizmoMode !== 'position') {
            (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          }
        }}
      >
        Pos
      </button>
      <button
        onClick={() => onGizmoModeChange?.('rotation')}
        style={{
          backgroundColor: gizmoMode === 'rotation' ? 'rgba(255, 152, 0, 0.8)' : 'rgba(0, 0, 0, 0.15)',
          color: 'white',
          border: gizmoMode === 'rotation' ? '2px solid #FF9800' : 'none',
          borderRadius: '1px',
          padding: '5px',
          cursor: 'pointer',
          fontSize: '13px',
          width: '50px',
          height: '25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
          boxShadow: gizmoMode === 'rotation' ? '0 0 10px rgba(255, 152, 0, 0.5)' : 'none'
        }}
        title="Rotate Items"
        onMouseOver={e => {
          if (gizmoMode !== 'rotation') {
            (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255, 152, 0, 0.3)';
          }
        }}
        onMouseOut={e => {
          if (gizmoMode !== 'rotation') {
            (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          }
        }}
      >
        Rot
      </button>
      <button
        onClick={() => onGizmoModeChange?.('scale')}
        style={{
          backgroundColor: gizmoMode === 'scale' ? 'rgba(156, 39, 176, 0.8)' : 'rgba(0, 0, 0, 0.15)',
          color: 'white',
          border: gizmoMode === 'scale' ? '2px solid #9C27B0' : 'none',
          borderRadius: '1px',
          padding: '5px',
          cursor: 'pointer',
          fontSize: '13px',
          width: '50px',
          height: '25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
          boxShadow: gizmoMode === 'scale' ? '0 0 10px rgba(156, 39, 176, 0.5)' : 'none'
        }}
        title="Scale Items"
        onMouseOver={e => {
          if (gizmoMode !== 'scale') {
            (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(156, 39, 176, 0.3)';
          }
        }}
        onMouseOut={e => {
          if (gizmoMode !== 'scale') {
            (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          }
        }}
      >
        Scale
      </button>
    </div>
  );
}; 