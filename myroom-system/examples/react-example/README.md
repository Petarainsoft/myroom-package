# MyRoom System - React Integration Example

This example demonstrates how to integrate MyRoom System into a React application with full backend connectivity.

## Features

- ✅ Complete React integration
- ✅ Backend API connectivity
- ✅ Real-time 3D room visualization
- ✅ Avatar customization
- ✅ Room switching
- ✅ Item management
- ✅ Custom controls panel
- ✅ Error handling
- ✅ Screenshot functionality
- ✅ Configuration export/import
- ✅ Responsive design
- ✅ TypeScript support

## Prerequisites

- Node.js 18+
- React 18+
- MyRoom Backend API running

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your backend configuration:
   ```bash
   REACT_APP_BACKEND_URL=http://localhost:3579
   REACT_APP_MYROOM_API_KEY=your-api-key
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3579`

## Project Structure

```
react-example/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   └── index.js         # Entry point
├── public/
│   └── index.html       # HTML template
├── package.json         # Dependencies and scripts
├── .env.example         # Environment variables template
└── README.md           # This file
```

## Key Components

### App.jsx

The main application component that demonstrates:

- **Backend Configuration**: Connecting to your MyRoom API
- **Component Setup**: Configuring rooms, avatars, and 3D scene
- **Event Handling**: Managing scene events and user interactions
- **Custom Controls**: Building custom UI controls
- **Error Management**: Handling and displaying errors
- **State Management**: Managing application state

### Key Features Demonstrated

1. **Backend Integration**
   ```jsx
   const backendConfig = {
     apiEndpoint: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3579',
     apiKey: process.env.REACT_APP_MYROOM_API_KEY
   };
   ```

2. **Room Configuration**
   ```jsx
   const roomConfig = {
     defaultRoom: 'living-room',
     enableRoomSwitching: true,
     availableRooms: ['living-room', 'bedroom', 'kitchen', 'bathroom']
   };
   ```

3. **Avatar Configuration**
   ```jsx
   const avatarConfig = {
     defaultGender: 'male',
     enableCustomization: true,
     enableMovement: true
   };
   ```

4. **Event Handling**
   ```jsx
   const handleSceneReady = (scene) => {
     console.log('3D Scene ready:', scene);
     setIsSceneReady(true);
   };
   ```

5. **Custom Controls**
   ```jsx
   const handleTakeScreenshot = () => {
     if (myroomRef.current) {
       const screenshot = myroomRef.current.takeScreenshot();
       // Handle screenshot
     }
   };
   ```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|----------|
| `REACT_APP_BACKEND_URL` | Backend API URL | Yes | `http://localhost:3579` |
| `REACT_APP_MYROOM_API_KEY` | API key for authentication | Yes | - |

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Backend API Requirements

Your backend should provide these endpoints:

- `GET /api/rooms` - Get available rooms
- `GET /api/avatars` - Get avatar data
- `GET /api/items` - Get available items
- `GET /api/presets` - Get default presets

See the [API Documentation](../../docs/REACT_INTEGRATION.md) for detailed requirements.

## Customization

### Styling

Modify `App.css` to customize the appearance:

```css
/* Custom theme colors */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: #f5f5f5;
}
```

### Adding Custom Controls

```jsx
const handleCustomAction = () => {
  if (myroomRef.current) {
    // Access MyRoom methods
    myroomRef.current.changeRoom('custom-room');
    myroomRef.current.updateAvatar({ gender: 'female' });
  }
};
```

### Error Handling

```jsx
const handleError = (error) => {
  console.error('MyRoom Error:', error);
  // Custom error handling
  setError(error.message);
  // Show user-friendly message
};
```

## Performance Tips

1. **Optimize Bundle Size**
   ```jsx
   // Use dynamic imports for large components
   const MyRoom = lazy(() => import('myroom-system'));
   ```

2. **Memory Management**
   ```jsx
   useEffect(() => {
     return () => {
       // Cleanup on unmount
       if (myroomRef.current) {
         myroomRef.current.dispose();
       }
     };
   }, []);
   ```

3. **Texture Optimization**
   ```jsx
   const sceneConfig = {
     enableTextureCompression: true,
     maxTextureSize: 1024
   };
   ```

## Troubleshooting

### Common Issues

1. **"Cannot connect to backend"**
   - Check if backend is running
   - Verify `REACT_APP_BACKEND_URL` is correct
   - Check CORS settings on backend

2. **"3D scene not loading"**
   - Check browser WebGL support
   - Verify API key is valid
   - Check browser console for errors

3. **"Performance issues"**
   - Reduce texture quality
   - Disable post-processing
   - Enable LOD (Level of Detail)

### Debug Mode

Enable debug mode for development:

```jsx
<MyRoom
  enableDebug={process.env.NODE_ENV === 'development'}
  // ... other props
/>
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

To contribute to this example:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see the [LICENSE](../../LICENSE) file for details.

## Support

For support and questions:

- 📧 Email: support@myroom.com
- 💬 Discord: [MyRoom Community](https://discord.gg/myroom)
- 📖 Documentation: [docs.myroom.com](https://docs.myroom.com)
- 🐛 Issues: [GitHub Issues](https://github.com/myroom/myroom-system/issues)