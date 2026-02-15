import './index.css'
import CubeScene from './components/CubeScene'
import ControlPanel from './components/ControlPanel'
import { SettingsMenu } from './components/SettingsMenu'
import { useEffect } from 'react'
import { initializeCubeEngine } from './utils/cubeState'
import { initializeStorage } from './utils/storage'

function App() {
  useEffect(() => {
    initializeCubeEngine()
    // 初始化存儲系統（IndexedDB 或 localStorage）
    initializeStorage().then(storageType => {
      console.log(`Storage initialized: ${storageType}`)
    })
  }, [])

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header with glassmorphism effect */}
      <header className="backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-2xl relative z-[10000]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">🧊</span>
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">魔術方塊盲解訓練</h1>
          </div>
          <SettingsMenu />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden flex-col">
        {/* Main content area - mobile first, 2/3 for cube, 1/3 for controls */}
        <div className="flex-1 flex flex-col lg:flex-row lg:gap-6 lg:p-6 max-w-7xl lg:mx-auto w-full overflow-hidden">
          {/* Cube visualization - 2/3 height on mobile, 60% width on desktop */}
          <div className="flex-[2] lg:flex-1 lg:w-3/5 rounded-none lg:rounded-2xl overflow-hidden backdrop-blur-xl bg-white/5 lg:border border-white/10 shadow-2xl min-h-0">
            <CubeScene />
          </div>

          {/* Control panel - 1/3 height on mobile, 40% width on desktop */}
          <div className="flex-1 lg:w-2/5 flex flex-col overflow-hidden">
            <ControlPanel />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
