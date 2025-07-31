import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

/**
 * MyRoom Component với dynamic import để tránh SSR issues
 * Component này sẽ chỉ render ở client-side
 */
const MyRoom = dynamic(
  () => import('myroom-system').then(mod => mod.MyRoom),
  { 
    ssr: false,
    loading: () => (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Đang tải MyRoom System...</p>
      </div>
    )
  }
);

/**
 * Next.js Example Page cho MyRoom System
 * 
 * Trang này demo cách tích hợp MyRoom vào Next.js app,
 * bao gồm SSR compatibility, environment variables, và dynamic imports.
 */
export default function Home() {
  // State management
  const [isClient, setIsClient] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('living-room');
  const [currentGender, setCurrentGender] = useState('male');
  const [showControls, setShowControls] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  // Ref để truy cập MyRoom methods
  const myroomRef = useRef(null);

  // Check if component is mounted (client-side)
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
  }, []);

  // Backend configuration từ environment variables
  const backendConfig = {
    apiEndpoint: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3579',
    apiKey: process.env.NEXT_PUBLIC_MYROOM_API_KEY || 'pk_test_1234567890abcdef1234567890abcdef'
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
      
      // Save to localStorage (chỉ ở client-side)
      if (typeof window !== 'undefined') {
        localStorage.setItem('myroom-config', JSON.stringify(config));
        alert('Đã lưu cấu hình!');
      }
    }
  };

  const handleImportConfig = () => {
    if (typeof window !== 'undefined') {
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
    }
  };

  // Render loading state cho SSR
  if (!mounted || !isClient) {
    return (
      <>
        <Head>
          <title>MyRoom System - Next.js Example</title>
          <meta name="description" content="MyRoom System integration with Next.js" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <div className={styles.container}>
          <header className={styles.header}>
            <h1>MyRoom System - Next.js Example</h1>
            <div className={styles.status}>
              <span className={styles.loading}>Đang khởi tạo...</span>
            </div>
          </header>
          
          <main className={styles.main}>
            <div className={styles.myroomWrapper}>
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Đang tải MyRoom System...</p>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>MyRoom System - Next.js Example</title>
        <meta name="description" content="MyRoom System integration with Next.js" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preload critical resources */}
        <link rel="preconnect" href={backendConfig.apiEndpoint} />
        <link rel="dns-prefetch" href={backendConfig.apiEndpoint} />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <h1>MyRoom System - Next.js Example</h1>
          <div className={styles.status}>
            {isLoading && <span className={styles.loading}>Đang tải...</span>}
            {error && <span className={styles.error}>Lỗi: {error}</span>}
            {isSceneReady && <span className={styles.ready}>Sẵn sàng</span>}
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.main}>
          {/* MyRoom Component */}
          <div className={styles.myroomWrapper}>
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
              className={styles.myroomContainer}
            />
            
            {/* Error Overlay */}
            {error && (
              <div className={styles.errorOverlay}>
                <div className={styles.errorContent}>
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
          <aside className={styles.controlsPanel}>
            <h3>Điều khiển</h3>
            
            {/* Room Controls */}
            <div className={styles.controlGroup}>
              <h4>Phòng</h4>
              <div className={styles.buttonGroup}>
                <button 
                  onClick={() => handleChangeRoom('living-room')}
                  className={currentRoom === 'living-room' ? styles.active : ''}
                >
                  Phòng khách
                </button>
                <button 
                  onClick={() => handleChangeRoom('bedroom')}
                  className={currentRoom === 'bedroom' ? styles.active : ''}
                >
                  Phòng ngủ
                </button>
                <button 
                  onClick={() => handleChangeRoom('kitchen')}
                  className={currentRoom === 'kitchen' ? styles.active : ''}
                >
                  Nhà bếp
                </button>
                <button 
                  onClick={() => handleChangeRoom('bathroom')}
                  className={currentRoom === 'bathroom' ? styles.active : ''}
                >
                  Phòng tắm
                </button>
              </div>
            </div>

            {/* Avatar Controls */}
            <div className={styles.controlGroup}>
              <h4>Avatar</h4>
              <div className={styles.buttonGroup}>
                <button 
                  onClick={() => handleChangeGender('male')}
                  className={currentGender === 'male' ? styles.active : ''}
                >
                  Nam
                </button>
                <button 
                  onClick={() => handleChangeGender('female')}
                  className={currentGender === 'female' ? styles.active : ''}
                >
                  Nữ
                </button>
              </div>
            </div>

            {/* UI Controls */}
            <div className={styles.controlGroup}>
              <h4>Giao diện</h4>
              <label className={styles.label}>
                <input 
                  type="checkbox" 
                  checked={showControls}
                  onChange={(e) => setShowControls(e.target.checked)}
                />
                Hiển thị controls
              </label>
              <label className={styles.label}>
                <input 
                  type="checkbox" 
                  checked={compactMode}
                  onChange={(e) => setCompactMode(e.target.checked)}
                />
                Chế độ compact
              </label>
            </div>

            {/* Action Controls */}
            <div className={styles.controlGroup}>
              <h4>Hành động</h4>
              <div className={`${styles.buttonGroup} ${styles.vertical}`}>
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
            <div className={styles.controlGroup}>
              <h4>Thông tin</h4>
              <div className={styles.info}>
                <p><strong>Phòng hiện tại:</strong> {currentRoom}</p>
                <p><strong>Giới tính:</strong> {currentGender}</p>
                <p><strong>Trạng thái:</strong> {isSceneReady ? 'Sẵn sàng' : 'Đang tải'}</p>
                <p><strong>Backend:</strong> {backendConfig.apiEndpoint}</p>
                <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              </div>
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>MyRoom System v1.0.0 - Next.js Integration Example</p>
          <p>Kết nối với backend: {backendConfig.apiEndpoint}</p>
          <p>SSR Compatible • Client-side Rendering</p>
        </footer>
      </div>
    </>
  );
}

/**
 * getStaticProps cho static generation (optional)
 * Có thể dùng để pre-fetch data nếu cần
 */
export async function getStaticProps() {
  return {
    props: {
      // Có thể thêm initial data ở đây
    },
    // Revalidate every hour
    revalidate: 3600,
  };
}