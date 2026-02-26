# 注音朗讀練習工具 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在現有 App 中新增全螢幕 Modal，隨機朗讀 484 個注音配對及其記憶詞，支援可調間隔時間。

**Architecture:** 新增 `usePronunciationPractice` hook 封裝播放狀態與 Web Speech API 邏輯，新增 `PronunciationPractice` 全螢幕 Modal 元件（參考現有 EncodingPanel 做法），在 `FloatingButtons` 新增入口按鈕。

**Tech Stack:** React + TypeScript, Web Speech API (SpeechSynthesis), Tailwind CSS, Vitest

---

### Task 1: 建立 `usePronunciationPractice` hook（邏輯層）

**Files:**
- Create: `src/hooks/usePronunciationPractice.ts`
- Test: `src/hooks/usePronunciationPractice.test.ts`

背景知識：
- 記憶詞字典型別定義在 `src/types/memoryWord.ts`，`MemoryWordDict = Record<string, string>`
- 22 個注音符號：`['ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ','ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ','ㄗ','ㄘ','ㄙ','1']`
- 484 個配對 key 格式：`'ㄅㄆ'`（兩個符號直接拼接）

**Step 1: 寫 failing test**

在 `src/hooks/usePronunciationPractice.test.ts` 建立：

```typescript
import { describe, it, expect } from 'vitest'
import { buildShuffledPairs, ZHUYIN_SYMBOLS } from './usePronunciationPractice'

describe('buildShuffledPairs', () => {
  it('should return 484 pairs', () => {
    const pairs = buildShuffledPairs()
    expect(pairs).toHaveLength(484)
  })

  it('should contain all 22x22 combinations', () => {
    const pairs = buildShuffledPairs()
    const keys = pairs.map(p => p.key)
    for (const a of ZHUYIN_SYMBOLS) {
      for (const b of ZHUYIN_SYMBOLS) {
        expect(keys).toContain(`${a}${b}`)
      }
    }
  })

  it('should be shuffled (not in alphabetical order)', () => {
    // 跑 10 次，至少 1 次順序不同
    const ordered = ZHUYIN_SYMBOLS.flatMap(a => ZHUYIN_SYMBOLS.map(b => `${a}${b}`))
    let foundDifferent = false
    for (let i = 0; i < 10; i++) {
      const shuffled = buildShuffledPairs().map(p => p.key)
      if (JSON.stringify(shuffled) !== JSON.stringify(ordered)) {
        foundDifferent = true
        break
      }
    }
    expect(foundDifferent).toBe(true)
  })
})
```

**Step 2: 執行 test 確認 FAIL**

```bash
cd /Users/tonywang/Documents/Cube
npx vitest run src/hooks/usePronunciationPractice.test.ts
```

Expected: FAIL — "Cannot find module"

**Step 3: 實作 `usePronunciationPractice.ts`**

```typescript
import { useState, useRef, useCallback, useEffect } from 'react'
import type { MemoryWordDict } from '../types/memoryWord'

export const ZHUYIN_SYMBOLS = [
  'ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ',
  'ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ',
  'ㄕ','ㄖ','ㄗ','ㄘ','ㄙ','1'
]

export interface PronunciationPair {
  key: string   // e.g. 'ㄍㄌ'
  symbol1: string
  symbol2: string
}

export function buildShuffledPairs(): PronunciationPair[] {
  const pairs: PronunciationPair[] = []
  for (const a of ZHUYIN_SYMBOLS) {
    for (const b of ZHUYIN_SYMBOLS) {
      pairs.push({ key: `${a}${b}`, symbol1: a, symbol2: b })
    }
  }
  // Fisher-Yates shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}

export interface PronunciationState {
  isPlaying: boolean
  currentPair: PronunciationPair | null
  showAnswer: boolean
  progress: number   // 0-484, 當前輪已播數量
  questionDelay: number  // 秒
  answerDelay: number    // 秒
}

export function usePronunciationPractice(memoryWords: MemoryWordDict) {
  const [state, setState] = useState<PronunciationState>({
    isPlaying: false,
    currentPair: null,
    showAnswer: false,
    progress: 0,
    questionDelay: 3,
    answerDelay: 2,
  })

  const queueRef = useRef<PronunciationPair[]>([])
  const indexRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPlayingRef = useRef(false)

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'zh-TW'
      utter.rate = 0.9
      utter.onend = () => resolve()
      utter.onerror = () => resolve()
      window.speechSynthesis.speak(utter)
    })
  }, [])

  const playNext = useCallback(async () => {
    if (!isPlayingRef.current) return

    // 取下一個配對，若跑完則重新打亂
    if (indexRef.current >= queueRef.current.length) {
      queueRef.current = buildShuffledPairs()
      indexRef.current = 0
    }

    const pair = queueRef.current[indexRef.current]
    indexRef.current++

    const memoryWord = memoryWords[pair.key] || '未定'

    setState(prev => ({
      ...prev,
      currentPair: pair,
      showAnswer: false,
      progress: indexRef.current,
    }))

    // 唸注音（兩個符號分開唸，中間停頓感）
    const displaySymbol1 = pair.symbol1 === '1' ? '一' : pair.symbol1
    const displaySymbol2 = pair.symbol2 === '1' ? '一' : pair.symbol2
    await speak(`${displaySymbol1}，${displaySymbol2}`)

    if (!isPlayingRef.current) return

    // 等待問題間隔
    await new Promise<void>(resolve => {
      timeoutRef.current = setTimeout(resolve, state.questionDelay * 1000)
    })

    if (!isPlayingRef.current) return

    setState(prev => ({ ...prev, showAnswer: true }))
    await speak(memoryWord)

    if (!isPlayingRef.current) return

    // 等待答案停留
    await new Promise<void>(resolve => {
      timeoutRef.current = setTimeout(resolve, state.answerDelay * 1000)
    })

    if (isPlayingRef.current) {
      playNext()
    }
  }, [memoryWords, speak, state.questionDelay, state.answerDelay])

  const start = useCallback(() => {
    if (queueRef.current.length === 0) {
      queueRef.current = buildShuffledPairs()
      indexRef.current = 0
    }
    isPlayingRef.current = true
    setState(prev => ({ ...prev, isPlaying: true }))
    playNext()
  }, [playNext])

  const pause = useCallback(() => {
    isPlayingRef.current = false
    window.speechSynthesis.cancel()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setState(prev => ({ ...prev, isPlaying: false }))
  }, [])

  const setQuestionDelay = useCallback((v: number) => {
    setState(prev => ({ ...prev, questionDelay: v }))
  }, [])

  const setAnswerDelay = useCallback((v: number) => {
    setState(prev => ({ ...prev, answerDelay: v }))
  }, [])

  // 關閉時清理
  useEffect(() => {
    return () => {
      isPlayingRef.current = false
      window.speechSynthesis.cancel()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { state, start, pause, setQuestionDelay, setAnswerDelay }
}
```

**Step 4: 執行 test 確認 PASS**

```bash
npx vitest run src/hooks/usePronunciationPractice.test.ts
```

Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add src/hooks/usePronunciationPractice.ts src/hooks/usePronunciationPractice.test.ts
git commit -m "feat: add usePronunciationPractice hook with shuffle logic"
```

---

### Task 2: 建立 `PronunciationPractice` Modal 元件

**Files:**
- Create: `src/components/PronunciationPractice.tsx`

背景知識：
- 現有全螢幕 Modal 做法：用 `createPortal` 渲染到 `document.body`（參考 `EncodingPanel.tsx:26`）
- `useCubeContext()` 在 `src/hooks/useCubeContext.ts`，提供 `state.memoryWords`
- Tailwind CSS + glassmorphism 深色風格

**Step 1: 建立元件**

```typescript
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
        <div className="text-white font-bold tracking-widest" style={{ fontSize: '4.5rem' }}>
          {state.currentPair
            ? `${state.currentPair.symbol1} ${state.currentPair.symbol2}`
            : '—'}
        </div>

        {/* 記憶詞 / ??? */}
        <div
          className={`font-bold transition-opacity duration-200 ${state.showAnswer ? 'opacity-100 text-white' : 'opacity-60 text-slate-400'}`}
          style={{ fontSize: '3rem' }}
        >
          {state.currentPair
            ? (state.showAnswer ? memoryWord : '???')
            : '按下開始'}
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
            <label className="text-slate-300 text-sm w-24">問題間隔</label>
            <div className="flex items-center gap-2">
              <input
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
            <label className="text-slate-300 text-sm w-24">答案停留</label>
            <div className="flex items-center gap-2">
              <input
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
```

**Step 2: 手動測試（目前沒有對 UI 元件寫 unit test，視覺確認即可）**

跳到 Task 3 先整合，再一起測試。

**Step 3: Commit**

```bash
git add src/components/PronunciationPractice.tsx
git commit -m "feat: add PronunciationPractice modal component"
```

---

### Task 3: 在 `FloatingButtons` 整合入口按鈕

**Files:**
- Modify: `src/components/FloatingButtons.tsx`

背景知識：
- 現有按鈕位置：左上（標籤切換）、右上（記憶練習 📚）、左下（佈局調整）
- 新增「朗讀練習」按鈕放在**右下角**，避免與現有按鈕衝突
- 使用 SVG 喇叭 icon（Heroicons `SpeakerWaveIcon`），不用 emoji

**Step 1: 修改 `FloatingButtons.tsx`**

在檔案頂部 import 區新增：
```typescript
import { PronunciationPractice } from './PronunciationPractice'
```

在 `useState` 區新增：
```typescript
const [showPronunciation, setShowPronunciation] = useState(false)
```

在 `FlashcardPractice` Portal 下方新增 PronunciationPractice：
```typescript
{showPronunciation && (
  <PronunciationPractice onClose={() => setShowPronunciation(false)} />
)}
```

在最後一個浮動按鈕（左下角佈局調整）後面新增右下角按鈕：
```typescript
{/* 浮動按鈕 - 右下角：朗讀練習 */}
<button
  onClick={() => setShowPronunciation(true)}
  className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-10 cursor-pointer"
  title="朗讀練習"
  aria-label="朗讀練習"
>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9.172 16.172a4 4 0 010-5.656M6.343 17.657a8 8 0 010-11.314" />
  </svg>
</button>
```

**Step 2: 啟動開發伺服器手動測試**

```bash
npm run dev
```

確認項目：
- [ ] 右下角有喇叭按鈕
- [ ] 點擊後開啟全螢幕 Modal
- [ ] 點「開始」後語音朗讀注音
- [ ] 停頓後顯示記憶詞並朗讀
- [ ] 進度條更新
- [ ] 間隔秒數可修改並即時生效
- [ ] 暫停按鈕正常運作
- [ ] 返回按鈕停止播放並關閉 Modal

**Step 3: Commit**

```bash
git add src/components/FloatingButtons.tsx
git commit -m "feat: add pronunciation practice button to FloatingButtons"
```

---

### Task 4: 修正 hook 中 delay 使用舊 state 的問題

**背景知識：**

Task 1 的 hook 實作中，`playNext` 的 `useCallback` dependency 包含 `state.questionDelay` 和 `state.answerDelay`。但由於 `playNext` 是遞迴的（它呼叫自己），這樣會造成每次 delay 更新時，舊的 playNext 仍在執行，讀到的是舊值。

解決方案：用 `useRef` 儲存 delay 值，讓 `playNext` 不需要依賴 state。

**Files:**
- Modify: `src/hooks/usePronunciationPractice.ts`

**Step 1: 在 hook 中新增 ref，替換 state 中的 delay 讀取**

在 `queueRef`, `indexRef`, `timeoutRef` 後面新增：
```typescript
const questionDelayRef = useRef(3)
const answerDelayRef = useRef(2)
```

修改 `setQuestionDelay`：
```typescript
const setQuestionDelay = useCallback((v: number) => {
  questionDelayRef.current = v
  setState(prev => ({ ...prev, questionDelay: v }))
}, [])
```

修改 `setAnswerDelay`：
```typescript
const setAnswerDelay = useCallback((v: number) => {
  answerDelayRef.current = v
  setState(prev => ({ ...prev, answerDelay: v }))
}, [])
```

修改 `playNext` 中的 delay 讀取（兩處）：
```typescript
// 原本：state.questionDelay * 1000
// 改為：
timeoutRef.current = setTimeout(resolve, questionDelayRef.current * 1000)

// 原本：state.answerDelay * 1000
// 改為：
timeoutRef.current = setTimeout(resolve, answerDelayRef.current * 1000)
```

從 `playNext` 的 `useCallback` dependencies 移除 `state.questionDelay` 和 `state.answerDelay`。

**Step 2: 執行既有 tests 確認仍然 PASS**

```bash
npx vitest run src/hooks/usePronunciationPractice.test.ts
```

Expected: 3 tests PASS

**Step 3: Commit**

```bash
git add src/hooks/usePronunciationPractice.ts
git commit -m "fix: use refs for delay values to avoid stale closure in playNext"
```

---

### Task 5: 執行全部測試確認無 regression

**Step 1: 執行所有測試**

```bash
npm run test -- --run
```

Expected: 所有既有測試 PASS，新增的 3 個 pronunciation 測試 PASS

**Step 2: 若有失敗，修正後再 commit**

**Step 3: 最終 commit（若有修正）**

```bash
git add -p
git commit -m "fix: resolve test regressions from pronunciation practice feature"
```
