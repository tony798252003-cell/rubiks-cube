# Scramble History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 記錄近 10 場打亂公式，讓使用者可以用 ← → 按鈕切換歷史，或直接點選任一筆復原。

**Architecture:** 在 CubeState 加入 `scrambleHistory: string[]` 與 `historyIndex: number`，新增 `NAVIGATE_HISTORY` action；ControlPanel 在打亂公式下方顯示導航列。歷史記錄隨現有 storage 自動持久化。

**Tech Stack:** React + TypeScript + Vitest（測試）

---

### Task 1: 在 CubeState 加入歷史欄位並更新 SET_SCRAMBLE

**Files:**
- Modify: `src/context/CubeContext.tsx`
- Test: `src/context/CubeContext.test.tsx`

**Step 1: 寫失敗測試**

在 `src/context/CubeContext.test.tsx` 末尾（在最後 `}` 前）新增：

```ts
it('SET_SCRAMBLE 會把公式加入歷史記錄', () => {
  const { result } = renderHook(() => useCubeContext(), {
    wrapper: CubeProvider,
  })
  act(() => {
    result.current.dispatch({ type: 'SET_SCRAMBLE', payload: 'R U R\' U\'' })
  })
  expect(result.current.state.scrambleHistory).toEqual(['R U R\' U\''])
  expect(result.current.state.historyIndex).toBe(-1)
})

it('SET_SCRAMBLE 最多保留 10 筆', () => {
  const { result } = renderHook(() => useCubeContext(), {
    wrapper: CubeProvider,
  })
  act(() => {
    for (let i = 0; i < 12; i++) {
      result.current.dispatch({ type: 'SET_SCRAMBLE', payload: `scramble-${i}` })
    }
  })
  expect(result.current.state.scrambleHistory).toHaveLength(10)
  expect(result.current.state.scrambleHistory[0]).toBe('scramble-2')
  expect(result.current.state.scrambleHistory[9]).toBe('scramble-11')
})
```

**Step 2: 跑測試確認失敗**

```bash
npx vitest run src/context/CubeContext.test.tsx
```

預期：FAIL（`scrambleHistory` 不存在）

**Step 3: 實作**

在 `src/context/CubeContext.tsx`：

1. `CubeState` 介面新增兩個欄位：
```ts
scrambleHistory: string[]
historyIndex: number
```

2. `defaultState` 新增：
```ts
scrambleHistory: [],
historyIndex: -1,
```

3. 修改 `SET_SCRAMBLE` case：
```ts
case 'SET_SCRAMBLE': {
  const stickers = applyScramble(action.payload)
  const memo = analyzeBlindsolve(stickers, state.encoding)
  // 若目前不在最新，截斷後面的歷史
  const base = state.historyIndex === -1
    ? state.scrambleHistory
    : state.scrambleHistory.slice(0, state.historyIndex + 1)
  const updated = [...base, action.payload].slice(-10)
  return {
    ...state,
    currentScramble: action.payload,
    cubeStickers: stickers,
    memo,
    scrambleHistory: updated,
    historyIndex: -1,
  }
}
```

**Step 4: 跑測試確認通過**

```bash
npx vitest run src/context/CubeContext.test.tsx
```

預期：全部 PASS

**Step 5: Commit**

```bash
git add src/context/CubeContext.tsx src/context/CubeContext.test.tsx
git commit -m "feat: CubeState 新增 scrambleHistory 與 historyIndex 欄位"
```

---

### Task 2: 新增 NAVIGATE_HISTORY action

**Files:**
- Modify: `src/context/CubeContext.tsx`
- Test: `src/context/CubeContext.test.tsx`

**Step 1: 寫失敗測試**

在 `src/context/CubeContext.test.tsx` 末尾（在最後 `}` 前）新增：

```ts
it('NAVIGATE_HISTORY back 可以切換到上一個打亂', () => {
  const { result } = renderHook(() => useCubeContext(), {
    wrapper: CubeProvider,
  })
  act(() => {
    result.current.dispatch({ type: 'SET_SCRAMBLE', payload: 'R U' })
    result.current.dispatch({ type: 'SET_SCRAMBLE', payload: 'L D' })
  })
  act(() => {
    result.current.dispatch({ type: 'NAVIGATE_HISTORY', payload: 'back' })
  })
  expect(result.current.state.currentScramble).toBe('R U')
  expect(result.current.state.historyIndex).toBe(0)
})

it('NAVIGATE_HISTORY forward 可以切換到下一個打亂', () => {
  const { result } = renderHook(() => useCubeContext(), {
    wrapper: CubeProvider,
  })
  act(() => {
    result.current.dispatch({ type: 'SET_SCRAMBLE', payload: 'R U' })
    result.current.dispatch({ type: 'SET_SCRAMBLE', payload: 'L D' })
    result.current.dispatch({ type: 'NAVIGATE_HISTORY', payload: 'back' })
  })
  act(() => {
    result.current.dispatch({ type: 'NAVIGATE_HISTORY', payload: 'forward' })
  })
  expect(result.current.state.currentScramble).toBe('L D')
  expect(result.current.state.historyIndex).toBe(-1)
})

it('NAVIGATE_HISTORY 在邊界時不移動', () => {
  const { result } = renderHook(() => useCubeContext(), {
    wrapper: CubeProvider,
  })
  act(() => {
    result.current.dispatch({ type: 'SET_SCRAMBLE', payload: 'R U' })
    result.current.dispatch({ type: 'NAVIGATE_HISTORY', payload: 'back' })
  })
  // 已在最舊，再往前不動
  act(() => {
    result.current.dispatch({ type: 'NAVIGATE_HISTORY', payload: 'back' })
  })
  expect(result.current.state.historyIndex).toBe(0)
  expect(result.current.state.currentScramble).toBe('R U')
})
```

**Step 2: 跑測試確認失敗**

```bash
npx vitest run src/context/CubeContext.test.tsx
```

預期：FAIL（`NAVIGATE_HISTORY` 不存在）

**Step 3: 實作**

1. `CubeAction` union type 新增：
```ts
| { type: 'NAVIGATE_HISTORY'; payload: 'back' | 'forward' }
```

2. `cubeReducer` switch 新增 case（放在 `SET_SCRAMBLE` 之後）：
```ts
case 'NAVIGATE_HISTORY': {
  const { scrambleHistory, historyIndex } = state
  if (scrambleHistory.length === 0) return state

  // 計算目前的真實 index（-1 代表最後一筆）
  const currentIdx = historyIndex === -1 ? scrambleHistory.length - 1 : historyIndex

  let newIdx: number
  if (action.payload === 'back') {
    newIdx = Math.max(0, currentIdx - 1)
  } else {
    newIdx = currentIdx + 1
  }

  // 若 forward 到最後一筆，重設為 -1
  const resolvedIdx = newIdx >= scrambleHistory.length - 1 ? -1 : newIdx
  const targetScramble = scrambleHistory[resolvedIdx === -1 ? scrambleHistory.length - 1 : resolvedIdx]

  const stickers = applyScramble(targetScramble)
  const memo = analyzeBlindsolve(stickers, state.encoding)
  return {
    ...state,
    currentScramble: targetScramble,
    cubeStickers: stickers,
    memo,
    historyIndex: resolvedIdx,
  }
}
```

**Step 4: 跑測試確認通過**

```bash
npx vitest run src/context/CubeContext.test.tsx
```

預期：全部 PASS

**Step 5: Commit**

```bash
git add src/context/CubeContext.tsx src/context/CubeContext.test.tsx
git commit -m "feat: 新增 NAVIGATE_HISTORY action 支援打亂歷史導航"
```

---

### Task 3: ControlPanel 加入歷史導航 UI

**Files:**
- Modify: `src/components/ControlPanel.tsx`

**Step 1: 在打亂公式 card 下方（`</div>` 後，memo card 之前）新增導航列**

找到 ControlPanel.tsx 中打亂 card 的結尾（`</div>` 後，`{/* Memo card */}` 之前），插入：

```tsx
{/* 歷史導航列 */}
{state.scrambleHistory.length > 1 && (() => {
  const totalCount = state.scrambleHistory.length
  const currentIdx = state.historyIndex === -1 ? totalCount - 1 : state.historyIndex
  const isOldest = currentIdx === 0
  const isNewest = state.historyIndex === -1

  return (
    <div className="flex items-center justify-between gap-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
      <button
        onClick={() => dispatch({ type: 'NAVIGATE_HISTORY', payload: 'back' })}
        disabled={isOldest}
        className="text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm px-2 py-0.5"
        title="上一個打亂"
      >
        ← 上一個
      </button>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-gray-400 text-xs">
          第 {currentIdx + 1}/{totalCount} 筆
        </span>
        {!isNewest && (
          <span className="text-yellow-400/70 text-xs">歷史記錄</span>
        )}
      </div>
      <button
        onClick={() => dispatch({ type: 'NAVIGATE_HISTORY', payload: 'forward' })}
        disabled={isNewest}
        className="text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm px-2 py-0.5"
        title="下一個打亂"
      >
        下一個 →
      </button>
    </div>
  )
})()}
```

**Step 2: 手動驗證**

```bash
npm run dev
```

打開瀏覽器，點幾次「生成打亂」，確認：
- 導航列出現（有 2 筆以上時）
- ← / → 按鈕可切換打亂公式
- 「第 N/M 筆」顯示正確
- 在歷史記錄時顯示「歷史記錄」標籤
- 最舊時 ← disabled，最新時 → disabled

**Step 3: 跑全部測試確認沒有破壞**

```bash
npx vitest run
```

預期：全部 PASS

**Step 4: Commit**

```bash
git add src/components/ControlPanel.tsx
git commit -m "feat: ControlPanel 新增打亂歷史導航列"
```

---

### Task 4: 確保 LOAD_STATE 能處理舊資料（向後相容）

**Files:**
- Modify: `src/context/CubeContext.tsx`

**Step 1: 說明**

`LOAD_STATE` 會從 storage 載入舊的存檔資料。舊資料沒有 `scrambleHistory` 和 `historyIndex`，必須給預設值，否則 app 會壞掉。

**Step 2: 修改 LOAD_STATE case**

```ts
case 'LOAD_STATE': {
  return {
    ...action.payload,
    scrambleHistory: action.payload.scrambleHistory ?? [],
    historyIndex: action.payload.historyIndex ?? -1,
  }
}
```

**Step 3: 跑測試**

```bash
npx vitest run
```

預期：全部 PASS

**Step 4: Commit**

```bash
git add src/context/CubeContext.tsx
git commit -m "fix: LOAD_STATE 對 scrambleHistory/historyIndex 提供向後相容預設值"
```
