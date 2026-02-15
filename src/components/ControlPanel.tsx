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
    <div className="flex flex-col gap-2 p-2 lg:p-3">

      {/* 生成打亂按鈕 */}
      <button
        onClick={handleGenerateScramble}
        className="w-full py-2 lg:py-3 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl text-sm lg:text-base shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 flex-shrink-0"
      >
        <span className="text-lg">🎲</span>
        生成打亂
      </button>

      {/* Scramble and memo cards */}
      {state.currentScramble && (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          {/* Scramble card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-2 lg:p-3 shadow-xl flex-shrink-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">🔀</span>
              <h3 className="text-white font-semibold text-xs lg:text-sm">當前打亂</h3>
            </div>
            <div className="bg-black/30 rounded-lg p-2 border border-white/5">
              <p className="text-blue-300 font-mono text-xs lg:text-sm leading-relaxed">{state.currentScramble}</p>
            </div>
          </div>

          {/* Memo card */}
          {state.memo && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-2 lg:p-3 shadow-xl flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🧠</span>
                  <h3 className="text-white font-semibold text-xs lg:text-sm">記憶編碼</h3>
                </div>
                <button
                  onClick={() => setShowMemoryWords(!showMemoryWords)}
                  className="text-xs px-2 py-0.5 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                >
                  {showMemoryWords ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <div className="space-y-1.5 flex-1 overflow-auto min-h-0">
                <div className="bg-black/30 rounded-lg p-2 border border-emerald-500/20">
                  <div className="text-emerald-400 text-xs font-medium mb-1">◼️ 邊塊</div>
                  <p className="text-emerald-300 font-mono text-xs leading-relaxed break-all">
                    {state.memo.edges ? formatMemoWithWords(state.memo.edges, state.memoryWords, showMemoryWords) : '(已還原)'}
                  </p>
                </div>

                <div className="bg-black/30 rounded-lg p-2 border border-blue-500/20">
                  <div className="text-blue-400 text-xs font-medium mb-1">🔷 角塊</div>
                  <p className="text-blue-300 font-mono text-xs leading-relaxed break-all">
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
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 lg:p-8 shadow-xl flex flex-col items-center justify-center text-center flex-1">
          <div className="text-4xl lg:text-5xl mb-3">🎯</div>
          <h3 className="text-white text-base lg:text-lg font-semibold mb-1.5">準備開始訓練</h3>
          <p className="text-gray-400 text-xs lg:text-sm">點擊上方按鈕生成打亂</p>
        </div>
      )}
    </div>
  )
}
