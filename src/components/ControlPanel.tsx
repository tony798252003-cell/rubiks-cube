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

    <div className="flex flex-col gap-2 h-full p-2 lg:p-0">
      {/* Action buttons - compact */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg lg:rounded-xl p-2 lg:p-4 shadow-xl flex-shrink-0">
        <div className="flex flex-col gap-1.5 lg:gap-2">
          <button
            onClick={handleGenerateScramble}
            className="w-full py-2 lg:py-3 px-3 lg:px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-md lg:rounded-lg transition-all duration-200 shadow-lg hover:shadow-emerald-500/50 flex items-center justify-center gap-1.5 text-xs lg:text-sm"
          >
            <span className="text-base lg:text-lg">🎲</span>
            生成打亂
          </button>

          <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
            <button
              onClick={() => dispatch({ type: 'CYCLE_LABEL_MODE' })}
              className="py-1.5 lg:py-2 px-2 lg:px-3 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-md lg:rounded-lg transition-all duration-200 text-xs"
            >
              {state.labelMode === 'all' ? '🏷️ 全部' :
               state.labelMode === 'corners' ? '🔷 角塊' :
               state.labelMode === 'edges' ? '◼️ 邊塊' : '👁️ 隱藏'}
            </button>
            <button
              onClick={() => setShowFlashcardPractice(true)}
              className="py-1.5 lg:py-2 px-2 lg:px-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium rounded-md lg:rounded-lg transition-all duration-200 shadow-lg hover:shadow-orange-500/50 text-xs"
            >
              📚 練習
            </button>
          </div>
        </div>
      </div>

      {/* Scramble and memo cards - compact */}
      {state.currentScramble && (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          {/* Scramble card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg lg:rounded-xl p-2 lg:p-3 shadow-xl flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm lg:text-lg">🔀</span>
              <h3 className="text-white font-semibold text-xs lg:text-sm">當前打亂</h3>
            </div>
            <div className="bg-black/30 rounded-md p-1.5 lg:p-2 border border-white/5">
              <p className="text-blue-300 font-mono text-xs leading-snug">{state.currentScramble}</p>
            </div>
          </div>

          {/* Memo card */}
          {state.memo && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg lg:rounded-xl p-2 lg:p-3 shadow-xl flex-1 min-h-0 flex flex-col">
              <div className="flex justify-between items-center mb-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm lg:text-lg">🧠</span>
                  <h3 className="text-white font-semibold text-xs lg:text-sm">記憶編碼</h3>
                </div>
                <button
                  onClick={() => setShowMemoryWords(!showMemoryWords)}
                  className="text-xs px-2 py-1 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-md transition-all duration-200"
                >
                  {showMemoryWords ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <div className="space-y-1.5 flex-1 min-h-0 overflow-auto">
                <div className="bg-black/30 rounded-md p-1.5 lg:p-2 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-emerald-400 text-xs font-medium">◼️ 邊塊</span>
                  </div>
                  <p className="text-emerald-300 font-mono text-xs leading-snug break-all">
                    {state.memo.edges ? formatMemoWithWords(state.memo.edges, state.memoryWords, showMemoryWords) : '(已還原)'}
                  </p>
                </div>

                <div className="bg-black/30 rounded-md p-1.5 lg:p-2 border border-blue-500/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-blue-400 text-xs font-medium">🔷 角塊</span>
                  </div>
                  <p className="text-blue-300 font-mono text-xs leading-snug break-all">
                    {state.memo.corners ? formatMemoWithWords(state.memo.corners, state.memoryWords, showMemoryWords) : '(已還原)'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state - compact */}
      {!state.currentScramble && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg lg:rounded-xl p-4 lg:p-8 shadow-xl flex flex-col items-center justify-center text-center flex-1">
          <div className="text-3xl lg:text-5xl mb-2">🎯</div>
          <h3 className="text-white text-sm lg:text-lg font-semibold mb-1">準備開始訓練</h3>
          <p className="text-gray-400 text-xs lg:text-sm">點擊「生成打亂」開始練習</p>
        </div>
      )}
    </div>
    </>
  )
}
