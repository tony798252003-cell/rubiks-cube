import { useState } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { generateScramble } from '../utils/scramble'
import { FlashcardPractice } from './FlashcardPractice'
import { formatMemoWithWords } from '../types/memoryWord'

export default function ControlPanel() {
  const { state, dispatch } = useCubeContext()
  const [showMemoryWords, setShowMemoryWords] = useState(true)
  const [showFlashcardPractice, setShowFlashcardPractice] = useState(false)

  const handleGenerateScramble = () => {
    const scramble = generateScramble()
    dispatch({ type: 'SET_SCRAMBLE', payload: scramble })
  }

  return (
    <>
    {/* 記憶練習 Modal with enhanced design */}
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

    <div className="flex flex-col gap-3 lg:gap-4 h-full overflow-auto p-3 lg:p-0">
      {/* Action buttons - compact on mobile */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-xl">
        <div className="flex flex-col gap-2 lg:gap-3">
          <button
            onClick={handleGenerateScramble}
            className="w-full py-3 lg:py-4 px-4 lg:px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg lg:rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/50 flex items-center justify-center gap-2 text-sm lg:text-base"
          >
            <span className="text-lg lg:text-xl">🎲</span>
            生成打亂
          </button>

          <div className="grid grid-cols-2 gap-2 lg:gap-3">
            <button
              onClick={() => dispatch({ type: 'CYCLE_LABEL_MODE' })}
              className="py-2 lg:py-3 px-2 lg:px-4 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm"
            >
              {state.labelMode === 'all' ? '🏷️ 全部' :
               state.labelMode === 'corners' ? '🔷 角塊' :
               state.labelMode === 'edges' ? '◼️ 邊塊' : '👁️ 隱藏'}
            </button>
            <button
              onClick={() => setShowFlashcardPractice(true)}
              className="py-2 lg:py-3 px-2 lg:px-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium rounded-lg lg:rounded-xl transition-all duration-200 shadow-lg hover:shadow-orange-500/50 text-xs lg:text-sm"
            >
              📚 練習
            </button>
          </div>
        </div>
      </div>

      {/* Scramble and memo cards - more compact on mobile */}
      {state.currentScramble && (
        <div className="flex flex-col gap-3 lg:gap-4">
          {/* Scramble card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2 lg:mb-3">
              <span className="text-lg lg:text-2xl">🔀</span>
              <h3 className="text-white font-semibold text-sm lg:text-lg">當前打亂</h3>
            </div>
            <div className="bg-black/30 rounded-lg lg:rounded-xl p-2 lg:p-4 border border-white/5">
              <p className="text-blue-300 font-mono text-xs lg:text-sm leading-relaxed">{state.currentScramble}</p>
            </div>
          </div>

          {/* Memo card */}
          {state.memo && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-xl">
              <div className="flex justify-between items-center mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg lg:text-2xl">🧠</span>
                  <h3 className="text-white font-semibold text-sm lg:text-lg">記憶編碼</h3>
                </div>
                <button
                  onClick={() => setShowMemoryWords(!showMemoryWords)}
                  className="text-xs px-2 lg:px-3 py-1 lg:py-1.5 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-md lg:rounded-lg transition-all duration-200"
                >
                  {showMemoryWords ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <div className="space-y-2 lg:space-y-3">
                <div className="bg-black/30 rounded-lg lg:rounded-xl p-2 lg:p-4 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1 lg:mb-2">
                    <span className="text-emerald-400 text-xs lg:text-sm font-medium">◼️ 邊塊</span>
                  </div>
                  <p className="text-emerald-300 font-mono text-xs lg:text-sm leading-relaxed break-all">
                    {state.memo.edges ? formatMemoWithWords(state.memo.edges, state.memoryWords, showMemoryWords) : '(已還原)'}
                  </p>
                </div>

                <div className="bg-black/30 rounded-lg lg:rounded-xl p-2 lg:p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1 lg:mb-2">
                    <span className="text-blue-400 text-xs lg:text-sm font-medium">🔷 角塊</span>
                  </div>
                  <p className="text-blue-300 font-mono text-xs lg:text-sm leading-relaxed break-all">
                    {state.memo.corners ? formatMemoWithWords(state.memo.corners, state.memoryWords, showMemoryWords) : '(已還原)'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state - compact on mobile */}
      {!state.currentScramble && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-6 lg:p-12 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="text-4xl lg:text-6xl mb-2 lg:mb-4">🎯</div>
          <h3 className="text-white text-base lg:text-xl font-semibold mb-1 lg:mb-2">準備開始訓練</h3>
          <p className="text-gray-400 text-sm lg:text-base">點擊「生成打亂」開始練習</p>
        </div>
      )}
    </div>
    </>
  )
}
