import { useState } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { FlashcardPractice } from './FlashcardPractice'

export function FloatingButtons() {
  const { state, dispatch } = useCubeContext()
  const [showFlashcardPractice, setShowFlashcardPractice] = useState(false)

  return (
    <>
      {/* 記憶練習 - 全屏模式 */}
      {showFlashcardPractice && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-[9999] flex flex-col">
          {/* Header */}
          <header className="backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-2xl flex-shrink-0">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">📚</span>
                </div>
                <h2 className="text-white text-2xl font-bold tracking-tight">記憶練習</h2>
              </div>
              <button
                onClick={() => setShowFlashcardPractice(false)}
                className="w-10 h-10 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl flex items-center justify-center transition-all"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <FlashcardPractice />
            </div>
          </main>
        </div>
      )}

      {/* 浮動按鈕 - 左上角：標籤切換 */}
      <button
        onClick={() => dispatch({ type: 'CYCLE_LABEL_MODE' })}
        className="absolute top-4 left-4 w-12 h-12 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-10"
        title={
          state.labelMode === 'all' ? '顯示全部標籤' :
          state.labelMode === 'corners' ? '只顯示角塊' :
          state.labelMode === 'edges' ? '只顯示邊塊' : '隱藏標籤'
        }
      >
        <span className="text-lg">
          {state.labelMode === 'all' ? '🏷️' :
           state.labelMode === 'corners' ? '🔷' :
           state.labelMode === 'edges' ? '◼️' : '👁️'}
        </span>
      </button>

      {/* 浮動按鈕 - 右上角：練習 */}
      <button
        onClick={() => setShowFlashcardPractice(true)}
        className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-10"
        title="記憶練習"
      >
        <span className="text-lg">📚</span>
      </button>

      {/* 浮動按鈕 - 左下角：佈局調整 */}
      <button
        onClick={() => dispatch({ type: 'CYCLE_LAYOUT_MODE' })}
        className="absolute bottom-4 left-4 w-12 h-12 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-10"
        title={
          state.layoutMode === 'cube-focused' ? '方塊優先 (2:1)' :
          state.layoutMode === 'balanced' ? '平衡模式 (1:1)' : '控制優先 (1:2)'
        }
      >
        <span className="text-lg">
          {state.layoutMode === 'cube-focused' ? '📐' :
           state.layoutMode === 'balanced' ? '⚖️' : '📊'}
        </span>
      </button>
    </>
  )
}
