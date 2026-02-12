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
    <div className="bg-gray-800 p-4 flex-shrink-0">
      {state.currentScramble && (
        <div className="mb-4 space-y-3 max-w-2xl mx-auto">
          <div className="p-3 bg-gray-700 rounded">
            <p className="text-gray-400 text-sm mb-1">當前打亂：</p>
            <p className="text-white font-mono text-sm">{state.currentScramble}</p>
          </div>
          {state.memo && (
            <div className="p-3 bg-gray-700 rounded">
              <p className="text-gray-400 text-sm mb-1">記憶編碼：</p>
              <div className="space-y-1">
                <p className="text-white font-mono text-sm">
                  <span className="text-green-400">邊塊：</span> {state.memo.edges || '(已還原)'}
                </p>
                <p className="text-white font-mono text-sm">
                  <span className="text-blue-400">角塊：</span> {state.memo.corners || '(已還原)'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-4 justify-center">
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
