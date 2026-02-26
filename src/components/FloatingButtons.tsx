import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useCubeContext } from '../hooks/useCubeContext'
import { FlashcardPractice } from './FlashcardPractice'
import { PronunciationPractice } from './PronunciationPractice'

export function FloatingButtons() {
  const { state, dispatch } = useCubeContext()
  const [showFlashcardPractice, setShowFlashcardPractice] = useState(false)
  const [showPronunciation, setShowPronunciation] = useState(false)

  return (
    <>
      {/* 記憶練習 - 覆蓋主內容區域，使用 Portal 渲染到 body */}
      {showFlashcardPractice && createPortal(
        <div className="fixed inset-0 top-[73px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-[9999] flex flex-col">
          {/* 返回按鈕 */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setShowFlashcardPractice(false)}
              className="w-12 h-12 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              title="返回主畫面"
            >
              <span className="text-2xl">←</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <FlashcardPractice />
            </div>
          </div>
        </div>,
        document.body
      )}

      {showPronunciation && (
        <PronunciationPractice onClose={() => setShowPronunciation(false)} />
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
      {/* 浮動按鈕 - 右下角：朗讀練習 */}
      <button
        onClick={() => setShowPronunciation(true)}
        className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-10 cursor-pointer"
        title="朗讀練習"
        aria-label="朗讀練習"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9.172 16.172a4 4 0 010-5.656M6.343 17.657a8 8 0 010-11.314" />
        </svg>
      </button>
    </>
  )
}
