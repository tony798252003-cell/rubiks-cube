import { useState } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { FlashcardPractice } from './FlashcardPractice'

export function FloatingButtons() {
  const { state, dispatch } = useCubeContext()
  const [showFlashcardPractice, setShowFlashcardPractice] = useState(false)

  return (
    <>
      {/* 記憶練習 Modal */}
      {showFlashcardPractice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowFlashcardPractice(false)}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">記憶練習</h2>
              <button onClick={() => setShowFlashcardPractice(false)} className="text-gray-400 hover:text-white text-2xl transition-colors">&times;</button>
            </div>
            <FlashcardPractice />
          </div>
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
