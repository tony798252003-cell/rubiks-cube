import { createContext, useReducer, useEffect, useState, ReactNode } from 'react'
import type { CubeEncoding } from '../types/encoding'
import { DEFAULT_ZHUYIN_ENCODING, DEFAULT_SPEFFZ_ENCODING } from '../types/encoding'
import type { MemoryWordDict } from '../types/memoryWord'
import { DEFAULT_MEMORY_WORDS } from '../types/memoryWord'
import type { FlashcardDeck, Flashcard } from '../types/flashcard'
import { initializeFlashcards } from '../types/flashcard'
import type { FSRSCard } from '../types/fsrs'
import type { DailySession } from '../types/dailySession'
import { initializeFSRSCards } from '../types/fsrsMigration'
import { saveToStorage, loadFromStorage } from '../utils/storage'
import { applyScramble, createSolvedState, type CubeState as CubeStickers } from '../utils/cubeState'
import { analyzeBlindsolve } from '../utils/blindsolve'
import { syncFromGoogleSheets, isOnline } from '../utils/googleSheets'

export type LabelMode = 'all' | 'corners' | 'edges' | 'none'
export type LayoutMode = 'cube-focused' | 'balanced' | 'control-focused'

export interface CubeState {
  encoding: CubeEncoding
  labelMode: LabelMode
  layoutMode: LayoutMode
  currentScramble: string | null
  cubeStickers: CubeStickers
  memo: { edges: string; corners: string } | null
  memoryWords: MemoryWordDict
  flashcards: FlashcardDeck  // 保留用於向後兼容
  fsrsCards: FSRSCard[]      // 新的 FSRS 系統
  dailySession: DailySession // 每日學習會話
  googleSheetsUrl: string    // Google Sheets 同步 URL
}

export type CubeAction =
  | { type: 'UPDATE_STICKER'; payload: { type: 'corners' | 'edges'; key: string; label: string } }
  | { type: 'RESET_ENCODING' }
  | { type: 'CYCLE_LABEL_MODE' }
  | { type: 'CYCLE_LAYOUT_MODE' }
  | { type: 'SET_SCRAMBLE'; payload: string }
  | { type: 'UPDATE_MEMORY_WORD'; payload: { key: string; word: string } }
  | { type: 'RESET_MEMORY_WORDS' }
  | { type: 'UPDATE_FLASHCARD'; payload: Flashcard }
  | { type: 'INIT_FLASHCARDS' }
  | { type: 'UPDATE_FSRS_CARD'; payload: FSRSCard }
  | { type: 'UPDATE_DAILY_SESSION'; payload: DailySession }
  | { type: 'INIT_FSRS_CARDS' }
  | { type: 'LOAD_STATE'; payload: CubeState }
  | { type: 'SET_GOOGLE_SHEETS_URL'; payload: string }
  | { type: 'SYNC_MEMORY_WORDS'; payload: MemoryWordDict }

function createDefaultSession(): DailySession {
  const today = new Date().toISOString().split('T')[0]
  return {
    date: today,
    new_cards_today: 0,
    new_cards_limit: 10,
    reviews_completed: 0,
    learning_queue: [],
    introduced_cards: [],
    session_start: Date.now()
  }
}

const defaultState: CubeState = {
  encoding: DEFAULT_ZHUYIN_ENCODING,
  labelMode: 'all',
  layoutMode: 'balanced',
  currentScramble: null,
  cubeStickers: createSolvedState(),
  memo: null,
  memoryWords: DEFAULT_MEMORY_WORDS,
  flashcards: initializeFlashcards(DEFAULT_MEMORY_WORDS),
  fsrsCards: initializeFSRSCards(DEFAULT_MEMORY_WORDS),
  dailySession: createDefaultSession(),
  googleSheetsUrl: 'https://script.google.com/macros/s/AKfycby5xwJfK_jKXw32Xo44mpwwaX7VG0BzD5APsi5PQPZHbkGh5OlyRWJxTEV__YMB_-5R/exec',
}

function getInitialState(): CubeState {
  // loadFromStorage 是異步的，但 useReducer 的 init 必須是同步的
  // 所以這裡先返回默認狀態，然後在 CubeProvider 中異步加載
  return defaultState
}

function cubeReducer(state: CubeState, action: CubeAction): CubeState {
  switch (action.type) {
    case 'UPDATE_STICKER': {
      const { type, key, label } = action.payload
      return {
        ...state,
        encoding: {
          ...state.encoding,
          [type]: { ...state.encoding[type], [key]: label },
        },
      }
    }
    case 'RESET_ENCODING': {
      const isSpeffz = Object.values(state.encoding.corners).some(v => /^[A-X]$/.test(v))
      return {
        ...state,
        encoding: isSpeffz ? DEFAULT_SPEFFZ_ENCODING : DEFAULT_ZHUYIN_ENCODING
      }
    }
    case 'CYCLE_LABEL_MODE': {
      const modes: LabelMode[] = ['all', 'corners', 'edges', 'none']
      const idx = modes.indexOf(state.labelMode)
      return { ...state, labelMode: modes[(idx + 1) % modes.length] }
    }
    case 'CYCLE_LAYOUT_MODE': {
      const modes: LayoutMode[] = ['cube-focused', 'balanced', 'control-focused']
      const idx = modes.indexOf(state.layoutMode)
      return { ...state, layoutMode: modes[(idx + 1) % modes.length] }
    }
    case 'SET_SCRAMBLE': {
      const stickers = applyScramble(action.payload)
      const memo = analyzeBlindsolve(stickers, state.encoding)
      return {
        ...state,
        currentScramble: action.payload,
        cubeStickers: stickers,
        memo,
      }
    }
    case 'UPDATE_MEMORY_WORD': {
      const { key, word } = action.payload
      const updatedMemoryWords = {
        ...state.memoryWords,
        [key]: word,
      }

      // 當更新記憶字時，同時更新對應的記憶卡
      const updatedFlashcards = { ...state.flashcards }
      if (updatedFlashcards[key]) {
        updatedFlashcards[key] = {
          ...updatedFlashcards[key],
          word: word,
        }
      } else if (word && word !== '未定') {
        // 如果是新增記憶字，創建新的記憶卡
        const now = Date.now()
        const code1 = key[0]
        const code2 = key[1]
        updatedFlashcards[key] = {
          id: key,
          code1,
          code2,
          word,
          nextReviewDate: now,
          interval: 0,
          reviewCount: 0,
          lastReviewed: 0,
        }
      }

      return {
        ...state,
        memoryWords: updatedMemoryWords,
        flashcards: updatedFlashcards,
      }
    }
    case 'RESET_MEMORY_WORDS':
      return {
        ...state,
        memoryWords: DEFAULT_MEMORY_WORDS,
        flashcards: initializeFlashcards(DEFAULT_MEMORY_WORDS),
      }
    case 'UPDATE_FLASHCARD': {
      const updatedCard = action.payload
      return {
        ...state,
        flashcards: {
          ...state.flashcards,
          [updatedCard.id]: updatedCard,
        },
      }
    }
    case 'INIT_FLASHCARDS':
      return {
        ...state,
        flashcards: initializeFlashcards(state.memoryWords),
      }
    case 'UPDATE_FSRS_CARD': {
      const updatedCard = action.payload
      const updatedCards = state.fsrsCards.map(card =>
        card.id === updatedCard.id ? updatedCard : card
      )
      return {
        ...state,
        fsrsCards: updatedCards,
      }
    }
    case 'UPDATE_DAILY_SESSION':
      return {
        ...state,
        dailySession: action.payload,
      }
    case 'INIT_FSRS_CARDS':
      return {
        ...state,
        fsrsCards: initializeFSRSCards(state.memoryWords),
        dailySession: createDefaultSession(),
      }
    case 'LOAD_STATE': {
      return action.payload
    }
    case 'SET_GOOGLE_SHEETS_URL':
      return {
        ...state,
        googleSheetsUrl: action.payload,
      }
    case 'SYNC_MEMORY_WORDS': {
      const syncedWords = action.payload
      // 合併同步的記憶字（保留本地未在 Google Sheets 中的記憶字）
      const mergedWords = {
        ...state.memoryWords,
        ...syncedWords,
      }
      return {
        ...state,
        memoryWords: mergedWords,
        flashcards: initializeFlashcards(mergedWords),
        fsrsCards: initializeFSRSCards(mergedWords),
      }
    }
    default:
      return state
  }
}

interface CubeContextValue {
  state: CubeState
  dispatch: React.Dispatch<CubeAction>
}

export const CubeContext = createContext<CubeContextValue | undefined>(undefined)

export function CubeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cubeReducer, undefined, getInitialState)
  const [isLoaded, setIsLoaded] = useState(false)

  // 初次加載時從存儲讀取數據
  useEffect(() => {
    loadFromStorage().then(loaded => {
      if (loaded) {
        // 使用 LOAD_STATE action 來正確更新狀態
        dispatch({ type: 'LOAD_STATE', payload: loaded })
      }
      setIsLoaded(true)
    })
  }, [])

  // 自動同步 Google Sheets（開啟時）
  useEffect(() => {
    if (!isLoaded) return
    if (!state.googleSheetsUrl) return
    if (!isOnline()) return

    // 延遲 1 秒後同步，避免阻塞初始載入
    const timer = setTimeout(async () => {
      try {
        console.log('🔄 自動同步 Google Sheets...')
        const syncedWords = await syncFromGoogleSheets(state.googleSheetsUrl)
        dispatch({ type: 'SYNC_MEMORY_WORDS', payload: syncedWords })
        console.log('✅ Google Sheets 自動同步完成')
      } catch (error) {
        console.error('❌ Google Sheets 自動同步失敗:', error)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [isLoaded, state.googleSheetsUrl])

  // 保存狀態變更（使用 debounce 優化性能，並立即保存關鍵更新）
  useEffect(() => {
    if (!isLoaded) return

    // 立即保存到 storage
    saveToStorage(state)
  }, [state, isLoaded])

  // 在頁面卸載前保存數據
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isLoaded) {
        // 使用 sendBeacon 或 同步保存確保數據被保存
        saveToStorage(state)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && isLoaded) {
        // 當頁面隱藏時（切換到其他 tab 或最小化）立即保存
        saveToStorage(state)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [state, isLoaded])

  return (
    <CubeContext.Provider value={{ state, dispatch }}>
      {children}
    </CubeContext.Provider>
  )
}
