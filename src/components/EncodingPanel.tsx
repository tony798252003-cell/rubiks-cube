import { useCubeContext } from '../hooks/useCubeContext'
import { FACES_ORDER, FACE_NAMES } from '../types/encoding'
import type { Face } from '../types/cube'

interface EncodingPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function EncodingPanel({ isOpen, onClose }: EncodingPanelProps) {
  const { state, dispatch } = useCubeContext()
  if (!isOpen) return null

  // 按面分組貼紙
  function getStickersOnFace(type: 'corners' | 'edges', face: Face) {
    return Object.entries(state.encoding[type])
      .filter(([key]) => key.endsWith(`-${face}`))
      .sort(([a], [b]) => a.localeCompare(b))
  }

  const handleChange = (type: 'corners' | 'edges', key: string, value: string) => {
    dispatch({ type: 'UPDATE_STICKER', payload: { type, key, label: value } })
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10003] p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 固定標題欄 */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-white text-xl font-bold">編碼設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 可滾動內容區 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-6">
            <button
              onClick={() => dispatch({ type: 'RESET_ENCODING' })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              套用 Speffz 預設編碼
            </button>
          </div>

          {/* 按面分組顯示 */}
          {FACES_ORDER.map((face) => (
          <div key={face} className="mb-6 p-4 bg-gray-750 rounded-lg border border-gray-700">
            <h3 className="text-white text-lg mb-3 font-semibold">{FACE_NAMES[face]}</h3>

            {/* 角塊貼紙 */}
            <div className="mb-3">
              <p className="text-gray-400 text-sm mb-2">角塊</p>
              <div className="grid grid-cols-4 gap-2">
                {getStickersOnFace('corners', face).map(([key, label]) => {
                  const piece = key.split('-')[0]
                  return (
                    <div key={key} className="flex flex-col">
                      <label className="text-gray-500 text-xs mb-1">{piece}</label>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => handleChange('corners', key, e.target.value)}
                        className="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-center"
                        maxLength={3}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 邊塊貼紙 */}
            <div>
              <p className="text-gray-400 text-sm mb-2">邊塊</p>
              <div className="grid grid-cols-4 gap-2">
                {getStickersOnFace('edges', face).map(([key, label]) => {
                  const piece = key.split('-')[0]
                  return (
                    <div key={key} className="flex flex-col">
                      <label className="text-gray-500 text-xs mb-1">{piece}</label>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => handleChange('edges', key, e.target.value)}
                        className="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-center"
                        maxLength={3}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          ))}
        </div>

        {/* 固定底部按鈕欄 */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
