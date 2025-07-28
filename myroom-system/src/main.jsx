import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Removed StrictMode to prevent double rendering and excessive API calls in development
createRoot(document.getElementById('root')).render(
  <App />
)
