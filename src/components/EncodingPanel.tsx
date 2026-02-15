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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-[10000] flex flex-col">
      {/* 固定標題欄 */}
      <div className="flex items-center px-6 py-4 border-b border-white/10 bg-slate-800/50 backdrop-blur-xl flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors mr-4"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-bold">編碼設定</h1>
      </div>

      {/* 可滾動內容區 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => dispatch({ type: 'RESET_ENCODING' })}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              套用 Speffz 預設編碼
            </button>
          </div>

          {/* 按面分組顯示 */}
          {FACES_ORDER.map((face) => (
          <div key={face} className="mb-6 p-6 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-white text-xl mb-4 font-bold">{FACE_NAMES[face]}</h3>

            {/* 角塊貼紙 */}
            <div className="mb-4">
              <p className="text-gray-300 text-base mb-3 font-medium">角塊</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {getStickersOnFace('corners', face).map(([key, label]) => {
                  const piece = key.split('-')[0]
                  return (
                    <div key={key} className="flex flex-col">
                      <label className="text-gray-400 text-sm mb-1.5">{piece}</label>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => handleChange('corners', key, e.target.value)}
                        className="px-3 py-2 bg-slate-700/50 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-center transition-colors"
                        maxLength={3}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 邊塊貼紙 */}
            <div>
              <p className="text-gray-300 text-base mb-3 font-medium">邊塊</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {getStickersOnFace('edges', face).map(([key, label]) => {
                  const piece = key.split('-')[0]
                  return (
                    <div key={key} className="flex flex-col">
                      <label className="text-gray-400 text-sm mb-1.5">{piece}</label>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) => handleChange('edges', key, e.target.value)}
                        className="px-3 py-2 bg-slate-700/50 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-center transition-colors"
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
      </div>

      {/* 固定底部按鈕欄 */}
      <div className="px-6 py-4 border-t border-white/10 flex justify-end flex-shrink-0 bg-slate-800/50 backdrop-blur-xl">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          完成
        </button>
      </div>
    </div>
  )
}
