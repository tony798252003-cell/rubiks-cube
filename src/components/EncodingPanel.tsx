import { useCubeContext } from '../hooks/useCubeContext'
import type { CornerPosition, EdgePosition } from '../types/cube'

interface EncodingPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function EncodingPanel({ isOpen, onClose }: EncodingPanelProps) {
  const { state, dispatch } = useCubeContext()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">編碼設定</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="mb-6">
          <button
            onClick={() => dispatch({ type: 'RESET_ENCODING' })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            套用 Speffz 預設編碼
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-white text-lg mb-3">角塊編碼</h3>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(state.encoding.corners).map(([pos, label]) => (
              <div key={pos} className="flex flex-col">
                <label className="text-gray-400 text-sm mb-1">{pos}</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => dispatch({
                    type: 'UPDATE_CORNER_ENCODING',
                    payload: { position: pos as CornerPosition, label: e.target.value },
                  })}
                  className="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  maxLength={3}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-white text-lg mb-3">邊塊編碼</h3>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(state.encoding.edges).map(([pos, label]) => (
              <div key={pos} className="flex flex-col">
                <label className="text-gray-400 text-sm mb-1">{pos}</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => dispatch({
                    type: 'UPDATE_EDGE_ENCODING',
                    payload: { position: pos as EdgePosition, label: e.target.value },
                  })}
                  className="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  maxLength={3}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded">
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
