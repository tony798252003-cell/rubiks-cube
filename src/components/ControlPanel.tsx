import { useState } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { generateScramble } from '../utils/scramble'
import EncodingPanel from './EncodingPanel'

export default function ControlPanel() {
  const { state, dispatch } = useCubeContext()
  const [showEncodingPanel, setShowEncodingPanel] = useState(false)

  const handleGenerateScramble = () => {
    const scramble = generateScramble()
    dispatch({ type: 'SET_SCRAMBLE', payload: scramble })
  }

  return (
    <>
    <EncodingPanel isOpen={showEncodingPanel} onClose={() => setShowEncodingPanel(false)} />
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4">
      {state.currentScramble && (
        <div className="mb-4 p-3 bg-gray-700 rounded max-w-2xl mx-auto">
          <p className="text-gray-400 text-sm mb-1">當前打亂：</p>
          <p className="text-white font-mono text-sm">{state.currentScramble}</p>
        </div>
      )}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_LABELS' })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
        >
          {state.showLabels ? '隱藏標註' : '顯示標註'}
        </button>
        <button
          onClick={handleGenerateScramble}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
        >
          生成打亂
        </button>
        <button
          onClick={() => setShowEncodingPanel(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition"
        >
          編碼設定
        </button>
      </div>
    </div>
    </>
  )
}
