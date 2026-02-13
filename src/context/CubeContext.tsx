import { createContext, useReducer, useEffect, ReactNode } from 'react'
import type { CubeEncoding } from '../types/encoding'
import { DEFAULT_ZHUYIN_ENCODING } from '../types/encoding'
import type { MemoryWordDict } from '../types/memoryWord'
import { DEFAULT_MEMORY_WORDS } from '../types/memoryWord'
import type { FlashcardDeck, Flashcard } from '../types/flashcard'
import { initializeFlashcards } from '../types/flashcard'
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
  flashcards: FlashcardDeck
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

const defaultState: CubeState = {
  encoding: DEFAULT_ZHUYIN_ENCODING,
  labelMode: 'all',
  currentScramble: null,
  cubeStickers: createSolvedState(),
  memo: null,
  memoryWords: DEFAULT_MEMORY_WORDS,
  flashcards: initializeFlashcards(DEFAULT_MEMORY_WORDS),
}

function getInitialState(): CubeState {
  return loadFromStorage() ?? defaultState
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
  useEffect(() => { saveToStorage(state) }, [state])
  return (
    <CubeContext.Provider value={{ state, dispatch }}>
      {children}
    </CubeContext.Provider>
  )
}
