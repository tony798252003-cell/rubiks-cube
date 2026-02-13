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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowMemoryEditor(false)}>
          <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">記憶字編輯器</h2>
              <button onClick={() => setShowMemoryEditor(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <MemoryWordEditor />
          </div>
        </div>
      )}

      {/* 齒輪選單 */}
      <div className="relative">
        <button
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
          title="設定"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {showSettingsMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowEncodingPanel(true)
                    setShowSettingsMenu(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  編碼設定
                </button>
                <button
                  onClick={() => {
                    setShowMemoryEditor(true)
                    setShowSettingsMenu(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
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
