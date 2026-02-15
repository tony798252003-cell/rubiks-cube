import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { CubeProvider } from './context/CubeContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CubeProvider>
      <App />
    </CubeProvider>
  </React.StrictMode>,
)

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope)
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error)
      })
  })
}
