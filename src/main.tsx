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
