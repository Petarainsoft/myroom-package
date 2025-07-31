import React, { useState, useRef } from 'react';
import { MyRoom } from 'myroom-system';
import './App.css';

/**
 * Ví dụ sử dụng MyRoom System với React
 * 
 * Component này demo cách tích hợp MyRoom vào ứng dụng React,
 * bao gồm cấu hình backend API, xử lý events, và custom controls.
 */
function App() {
  // State management
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('living-room');
  const [currentGender, setCurrentGender] = useState('male');
  const [showControls, setShowControls] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ref để truy cập MyRoom methods
  const myroomRef = useRef(null);

  // Backend configuration
  const backendConfig = {
    apiEndpoint: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3579',
    apiKey: process.env.REACT_APP_MYROOM_API_KEY || 'pk_test_1234567890abcdef1234567890abcdef'
  };

  // Room configuration
  const roomConfig = {
    defaultRoom: currentRoom,
    enableRoomSwitching: true,
    autoLoad: true,
    availableRooms: ['living-room', 'bedroom', 'kitchen', 'bathroom']
  };

  // Avatar configuration
  const avatarConfig = {
    defaultGender: currentGender,
    enableCustomization: true,
    enableMovement: true,
    enableAnimations: true
  };

  // Scene configuration
  const sceneConfig = {
    enablePostProcessing: true,
    enableSkybox: true,
    enableShadows: true,
    enableLighting: true,
    cameraSettings: {
      fov: 45,
      minDistance: 2,
      maxDistance: 20
    }
  };

  // Event handlers
  const handleSceneReady = (scene) => {
    console.log('3D Scene đã sẵn sàng:', scene);
    setIsSceneReady(true);
    setIsLoading(false);
    setError(null);
  };

  const handleAvatarChange = (avatarConfig) => {
    console.log('Avatar đã thay đổi:', avatarConfig);
    setCurrentGender(avatarConfig.defaultGender || avatarConfig.gender);
  };

  const handleRoomChange = (roomId) => {
    console.log('Phòng đã thay đổi:', roomId);
    setCurrentRoom(roomId);
  };

  const handleItemAdd = (item) => {
    console.log('Đã thêm item:', item);
  };

  const handleItemRemove = (itemId) => {
    console.log('Đã xóa item:', itemId);
  };

  const handleError = (error) => {
    console.error('MyRoom Error:', error);
    setError(error.message);
    setIsLoading(false);
  };

  // Custom control handlers
  const handleChangeRoom = (roomId) => {
    if (myroomRef.current) {
      myroomRef.current.changeRoom(roomId);
    }
  };

  const handleChangeGender = (gender) => {
    if (myroomRef.current) {
      myroomRef.current.updateAvatar({ defaultGender: gender });
    }
  };

  const handleTakeScreenshot = () => {
    if (myroomRef.current) {
      const screenshot = myroomRef.current.takeScreenshot();
      if (screenshot) {
        // Tạo link download
        const link = document.createElement('a');
        link.download = `myroom-screenshot-${Date.now()}.png`;
        link.href = screenshot;
        link.click();
      }
    }
  };

  const handleExportConfig = () => {
    if (myroomRef.current) {
      const config = myroomRef.current.exportConfig();
      console.log('Exported config:', config);
      
      // Save to localStorage
      localStorage.setItem('myroom-config', JSON.stringify(config));
      alert('Đã lưu cấu hình!');
    }
  };

  const handleImportConfig = () => {
    const savedConfig = localStorage.getItem('myroom-config');
    if (savedConfig && myroomRef.current) {
      try {
        const config = JSON.parse(savedConfig);
        myroomRef.current.importConfig(config);
        alert('Đã tải cấu hình!');
      } catch (error) {
        alert('Lỗi khi tải cấu hình!');
      }
    } else {
      alert('Không tìm thấy cấu hình đã lưu!');
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>MyRoom System - React Example</h1>
        <div className="status">
          {isLoading && <span className="loading">Đang tải...</span>}
          {error && <span className="error">Lỗi: {error}</span>}
          {isSceneReady && <span className="ready">Sẵn sàng</span>}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* MyRoom Component */}
        <div className="myroom-wrapper">
          <MyRoom
            ref={myroomRef}
            
            // Backend configuration
            apiEndpoint={backendConfig.apiEndpoint}
            customDomain={backendConfig.apiEndpoint}
            
            // Component configuration
            roomConfig={roomConfig}
            avatarConfig={avatarConfig}
            sceneConfig={sceneConfig}
            
            // UI configuration
            showControls={showControls}
            compactMode={compactMode}
            ultraCompactMode={false}
            enableDebug={process.env.NODE_ENV === 'development'}
            
            // Event callbacks
            onSceneReady={handleSceneReady}
            onAvatarChange={handleAvatarChange}
            onRoomChange={handleRoomChange}
            onItemAdd={handleItemAdd}
            onItemRemove={handleItemRemove}
            onError={handleError}
            
            // Styling
            className="myroom-container"
            style={{
              width: '100%',
              height: '100%',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Đang tải MyRoom System...</p>
            </div>
          )}
          
          {/* Error Overlay */}
          {error && (
            <div className="error-overlay">
              <div className="error-content">
                <h3>Có lỗi xảy ra</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                  Tải lại trang
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Custom Controls Panel */}
        <aside className="controls-panel">
          <h3>Điều khiển</h3>
          
          {/* Room Controls */}
          <div className="control-group">
            <h4>Phòng</h4>
            <div className="button-group">
              <button 
                onClick={() => handleChangeRoom('living-room')}
                className={currentRoom === 'living-room' ? 'active' : ''}
              >
                Phòng khách
              </button>
              <button 
                onClick={() => handleChangeRoom('bedroom')}
                className={currentRoom === 'bedroom' ? 'active' : ''}
              >
                Phòng ngủ
              </button>
              <button 
                onClick={() => handleChangeRoom('kitchen')}
                className={currentRoom === 'kitchen' ? 'active' : ''}
              >
                Nhà bếp
              </button>
              <button 
                onClick={() => handleChangeRoom('bathroom')}
                className={currentRoom === 'bathroom' ? 'active' : ''}
              >
                Phòng tắm
              </button>
            </div>
          </div>

          {/* Avatar Controls */}
          <div className="control-group">
            <h4>Avatar</h4>
            <div className="button-group">
              <button 
                onClick={() => handleChangeGender('male')}
                className={currentGender === 'male' ? 'active' : ''}
              >
                Nam
              </button>
              <button 
                onClick={() => handleChangeGender('female')}
                className={currentGender === 'female' ? 'active' : ''}
              >
                Nữ
              </button>
            </div>
          </div>

          {/* UI Controls */}
          <div className="control-group">
            <h4>Giao diện</h4>
            <label>
              <input 
                type="checkbox" 
                checked={showControls}
                onChange={(e) => setShowControls(e.target.checked)}
              />
              Hiển thị controls
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
              />
              Chế độ compact
            </label>
          </div>

          {/* Action Controls */}
          <div className="control-group">
            <h4>Hành động</h4>
            <div className="button-group vertical">
              <button 
                onClick={handleTakeScreenshot}
                disabled={!isSceneReady}
              >
                Chụp ảnh màn hình
              </button>
              <button 
                onClick={handleExportConfig}
                disabled={!isSceneReady}
              >
                Xuất cấu hình
              </button>
              <button 
                onClick={handleImportConfig}
                disabled={!isSceneReady}
              >
                Nhập cấu hình
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="control-group">
            <h4>Thông tin</h4>
            <div className="info">
              <p><strong>Phòng hiện tại:</strong> {currentRoom}</p>
              <p><strong>Giới tính:</strong> {currentGender}</p>
              <p><strong>Trạng thái:</strong> {isSceneReady ? 'Sẵn sàng' : 'Đang tải'}</p>
              <p><strong>Backend:</strong> {backendConfig.apiEndpoint}</p>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>MyRoom System v1.0.0 - React Integration Example</p>
        <p>Kết nối với backend: {backendConfig.apiEndpoint}</p>
      </footer>
    </div>
  );
}

export default App;