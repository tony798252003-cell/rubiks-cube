import './index.css'
import CubeScene from './components/CubeScene'
import ControlPanel from './components/ControlPanel'
import { SettingsMenu } from './components/SettingsMenu'
import { useEffect } from 'react'
import { initializeCubeEngine } from './utils/cubeState'

function App() {
  useEffect(() => {
    initializeCubeEngine()
  }, [])

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header with glassmorphism effect */}
      <header className="backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-2xl">
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

      <main className="flex-1 flex overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
          {/* Cube visualization - takes 60% width on large screens */}
          <div className="flex-1 lg:w-3/5 rounded-2xl overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
            <CubeScene />
          </div>

          {/* Control panel - takes 40% width on large screens */}
          <div className="lg:w-2/5 flex flex-col">
            <ControlPanel />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
