import { useState } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { generateScramble } from '../utils/scramble'
import { formatMemoWithWords } from '../types/memoryWord'

export default function ControlPanel() {
  const { state, dispatch } = useCubeContext()
  const [showMemoryWords, setShowMemoryWords] = useState(true)

  const handleGenerateScramble = () => {
    const scramble = generateScramble()
    dispatch({ type: 'SET_SCRAMBLE', payload: scramble })
  }

  return (
    <div className="flex flex-col gap-2 h-full p-2 lg:p-3">

      {/* 生成打亂按鈕 */}
      <button
        onClick={handleGenerateScramble}
        className="w-full py-3 lg:py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl text-sm lg:text-base shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2"
      >
        <span className="text-xl">🎲</span>
        生成打亂
      </button>

      {/* Scramble and memo cards */}
      {state.currentScramble && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          {/* Scramble card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 lg:p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔀</span>
              <h3 className="text-white font-semibold text-sm lg:text-base">當前打亂</h3>
            </div>
            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <p className="text-blue-300 font-mono text-sm leading-relaxed">{state.currentScramble}</p>
            </div>
          </div>

          {/* Memo card */}
          {state.memo && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 lg:p-4 shadow-xl flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧠</span>
                  <h3 className="text-white font-semibold text-sm lg:text-base">記憶編碼</h3>
                </div>
                <button
                  onClick={() => setShowMemoryWords(!showMemoryWords)}
                  className="text-xs px-3 py-1 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                >
                  {showMemoryWords ? '👁️ 顯示' : '👁️‍🗨️ 隱藏'}
                </button>
              </div>

              <div className="space-y-2 flex-1 overflow-auto">
                <div className="bg-black/30 rounded-lg p-3 border border-emerald-500/20">
                  <div className="text-emerald-400 text-sm font-medium mb-1.5">◼️ 邊塊</div>
                  <p className="text-emerald-300 font-mono text-sm leading-relaxed break-all">
                    {state.memo.edges ? formatMemoWithWords(state.memo.edges, state.memoryWords, showMemoryWords) : '(已還原)'}
                  </p>
                </div>

                <div className="bg-black/30 rounded-lg p-3 border border-blue-500/20">
                  <div className="text-blue-400 text-sm font-medium mb-1.5">🔷 角塊</div>
                  <p className="text-blue-300 font-mono text-sm leading-relaxed break-all">
                    {state.memo.corners ? formatMemoWithWords(state.memo.corners, state.memoryWords, showMemoryWords) : '(已還原)'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!state.currentScramble && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8 lg:p-12 shadow-xl flex flex-col items-center justify-center text-center flex-1">
          <div className="text-5xl lg:text-6xl mb-4">🎯</div>
          <h3 className="text-white text-lg lg:text-xl font-semibold mb-2">準備開始訓練</h3>
          <p className="text-gray-400 text-sm lg:text-base">點擊上方按鈕生成打亂</p>
        </div>
      )}
    </div>
  )
}
