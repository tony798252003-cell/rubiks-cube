import { createPortal } from 'react-dom'
import { useCubeContext } from '../hooks/useCubeContext'
import { usePronunciationPractice } from '../hooks/usePronunciationPractice'

interface Props {
  onClose: () => void
}

export function PronunciationPractice({ onClose }: Props) {
  const { state: cubeState } = useCubeContext()
  const { state, start, pause, setQuestionDelay, setAnswerDelay } = usePronunciationPractice(cubeState.memoryWords)

  const memoryWord = state.currentPair
    ? (cubeState.memoryWords[state.currentPair.key] || '未定')
    : null

  return createPortal(
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-[99999] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-white/10 bg-slate-800/50 backdrop-blur-xl flex-shrink-0">
        <button
          onClick={() => { pause(); onClose() }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors mr-4 cursor-pointer"
          aria-label="返回"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-bold">朗讀練習</h1>
      </div>

      {/* 主內容 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* 注音配對 */}
        <div className="text-white font-bold tracking-widest text-[4.5rem]">
          {state.currentPair
            ? `${state.currentPair.symbol1} ${state.currentPair.symbol2}`
            : '—'}
        </div>

        {/* 記憶詞 / ??? */}
        <div
          className={`font-bold text-[3rem] transition-opacity duration-200 ${
            state.showAnswer ? 'opacity-100 text-white' : 'opacity-100 text-slate-400'
          }`}
        >
          {state.currentPair
            ? (state.showAnswer ? memoryWord : '???')
            : <span className="text-slate-500 text-[2rem]">按下開始</span>
          }
        </div>

        {/* 進度條 */}
        <div className="w-full max-w-sm">
          <div className="flex justify-between text-slate-400 text-sm mb-2">
            <span>進度</span>
            <span>{state.progress} / 484</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${(state.progress / 484) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 底部控制 */}
      <div className="px-6 py-6 border-t border-white/10 bg-slate-800/30 flex-shrink-0">
        <div className="max-w-sm mx-auto flex flex-col gap-4">
          {/* 間隔設定 */}
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="question-delay" className="text-slate-300 text-sm w-24">問題間隔</label>
            <div className="flex items-center gap-2">
              <input
                id="question-delay"
                type="number"
                min={1}
                max={30}
                value={state.questionDelay}
                onChange={e => setQuestionDelay(Number(e.target.value))}
                className="w-16 bg-white/10 border border-white/20 text-white text-center rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-indigo-400"
              />
              <span className="text-slate-400 text-sm">秒</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="answer-delay" className="text-slate-300 text-sm w-24">答案停留</label>
            <div className="flex items-center gap-2">
              <input
                id="answer-delay"
                type="number"
                min={1}
                max={30}
                value={state.answerDelay}
                onChange={e => setAnswerDelay(Number(e.target.value))}
                className="w-16 bg-white/10 border border-white/20 text-white text-center rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-indigo-400"
              />
              <span className="text-slate-400 text-sm">秒</span>
            </div>
          </div>

          {/* 開始/暫停按鈕 */}
          <button
            aria-label={state.isPlaying ? '暫停' : '開始'}
            onClick={state.isPlaying ? pause : start}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-colors duration-150 cursor-pointer mt-2"
          >
            {state.isPlaying ? '⏸ 暫停' : '▶ 開始'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
