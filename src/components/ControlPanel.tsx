import { useCubeContext } from '../hooks/useCubeContext'

export default function ControlPanel() {
  const { state, dispatch } = useCubeContext()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 flex gap-4 justify-center">
      <button
        onClick={() => dispatch({ type: 'TOGGLE_LABELS' })}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
      >
        {state.showLabels ? '隱藏標註' : '顯示標註'}
      </button>
      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition">
        生成打亂
      </button>
      <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition">
        編碼設定
      </button>
    </div>
  )
}
