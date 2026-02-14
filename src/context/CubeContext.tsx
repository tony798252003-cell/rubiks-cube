import { createContext, useReducer, useEffect, useState, ReactNode } from 'react'
import type { CubeEncoding } from '../types/encoding'
import { DEFAULT_ZHUYIN_ENCODING } from '../types/encoding'
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

export type LabelMode = 'all' | 'corners' | 'edges' | 'none'

export interface CubeState {
  encoding: CubeEncoding
  labelMode: LabelMode
  currentScramble: string | null
  cubeStickers: CubeStickers
  memo: { edges: string; corners: string } | null
  memoryWords: MemoryWordDict
  flashcards: FlashcardDeck  // 保留用於向後兼容
  fsrsCards: FSRSCard[]      // 新的 FSRS 系統
  dailySession: DailySession // 每日學習會話
}

export type CubeAction =
  | { type: 'UPDATE_STICKER'; payload: { type: 'corners' | 'edges'; key: string; label: string } }
  | { type: 'RESET_ENCODING' }
  | { type: 'CYCLE_LABEL_MODE' }
  | { type: 'SET_SCRAMBLE'; payload: string }
  | { type: 'UPDATE_MEMORY_WORD'; payload: { key: string; word: string } }
  | { type: 'RESET_MEMORY_WORDS' }
  | { type: 'UPDATE_FLASHCARD'; payload: Flashcard }
  | { type: 'INIT_FLASHCARDS' }
  | { type: 'UPDATE_FSRS_CARD'; payload: FSRSCard }
  | { type: 'UPDATE_DAILY_SESSION'; payload: DailySession }
  | { type: 'INIT_FSRS_CARDS' }

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
  currentScramble: null,
  cubeStickers: createSolvedState(),
  memo: null,
  memoryWords: DEFAULT_MEMORY_WORDS,
  flashcards: initializeFlashcards(DEFAULT_MEMORY_WORDS),
  fsrsCards: initializeFSRSCards(DEFAULT_MEMORY_WORDS),
  dailySession: createDefaultSession(),
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
    case 'RESET_ENCODING':
      return { ...state, encoding: DEFAULT_ZHUYIN_ENCODING }
    case 'CYCLE_LABEL_MODE': {
      const modes: LabelMode[] = ['all', 'corners', 'edges', 'none']
      const idx = modes.indexOf(state.labelMode)
      return { ...state, labelMode: modes[(idx + 1) % modes.length] }
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
        // 用加載的數據替換默認狀態（通過直接設置）
        Object.assign(state, loaded)
      }
      setIsLoaded(true)
    })
  }, [])

  // 保存狀態變更
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(state)
    }
  }, [state, isLoaded])

  return (
    <CubeContext.Provider value={{ state, dispatch }}>
      {children}
    </CubeContext.Provider>
  )
}
