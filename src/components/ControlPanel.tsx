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
    {/* 記憶練習 Modal */}
    {showFlashcardPractice && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowFlashcardPractice(false)}>
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">記憶練習</h2>
            <button onClick={() => setShowFlashcardPractice(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>
          <FlashcardPractice />
        </div>
      </div>
    )}

    <div className="bg-gray-800 p-4 flex-shrink-0">
      {state.currentScramble && (
        <div className="mb-4 space-y-3 max-w-2xl mx-auto">
          <div className="p-3 bg-gray-700 rounded">
            <p className="text-gray-400 text-sm mb-1">當前打亂：</p>
            <p className="text-white font-mono text-sm">{state.currentScramble}</p>
          </div>
          {state.memo && (
            <div className="p-3 bg-gray-700 rounded">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-400 text-sm">記憶編碼：</p>
                <button
                  onClick={() => setShowMemoryWords(!showMemoryWords)}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded transition"
                >
                  {showMemoryWords ? '隱藏記憶字' : '顯示記憶字'}
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-white font-mono text-sm">
                  <span className="text-green-400">邊塊：</span> {state.memo.edges ? formatMemoWithWords(state.memo.edges, state.memoryWords, showMemoryWords) : '(已還原)'}
                </p>
                <p className="text-white font-mono text-sm">
                  <span className="text-blue-400">角塊：</span> {state.memo.corners ? formatMemoWithWords(state.memo.corners, state.memoryWords, showMemoryWords) : '(已還原)'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-4 justify-center flex-wrap">
        <button
          onClick={() => dispatch({ type: 'CYCLE_LABEL_MODE' })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
        >
          {state.labelMode === 'all' ? '標註：全部' :
           state.labelMode === 'corners' ? '標註：角塊' :
           state.labelMode === 'edges' ? '標註：邊塊' : '標註：隱藏'}
        </button>
        <button
          onClick={handleGenerateScramble}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
        >
          生成打亂
        </button>
        <button
          onClick={() => setShowFlashcardPractice(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition"
        >
          記憶練習
        </button>
      </div>
    </div>
    </>
  )
}
