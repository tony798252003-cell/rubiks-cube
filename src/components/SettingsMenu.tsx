import { useState } from 'react'
import EncodingPanel from './EncodingPanel'
import { MemoryWordEditor } from './MemoryWordEditor'

export function SettingsMenu() {
  const [showEncodingPanel, setShowEncodingPanel] = useState(false)
  const [showMemoryEditor, setShowMemoryEditor] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  return (
    <>
      <EncodingPanel isOpen={showEncodingPanel} onClose={() => setShowEncodingPanel(false)} />

      {/* 記憶字編輯器 Modal */}
      {showMemoryEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setShowMemoryEditor(false)}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">記憶字編輯器</h2>
              <button onClick={() => setShowMemoryEditor(false)} className="text-gray-400 hover:text-white text-2xl transition-colors">&times;</button>
            </div>
            <MemoryWordEditor />
          </div>
        </div>
      )}

      {/* Settings menu with modern design */}
      <div className="relative">
        <button
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          className="p-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-white/10"
          title="設定"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {showSettingsMenu && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setShowSettingsMenu(false)} />
            <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-slate-800/95 border border-white/10 rounded-xl shadow-2xl z-[9999] overflow-hidden">
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowEncodingPanel(true)
                    setShowSettingsMenu(false)
                  }}
                  className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                >
                  <span className="text-lg">⚙️</span>
                  編碼設定
                </button>
                <button
                  onClick={() => {
                    setShowMemoryEditor(true)
                    setShowSettingsMenu(false)
                  }}
                  className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                >
                  <span className="text-lg">📝</span>
                  記憶字編輯
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
