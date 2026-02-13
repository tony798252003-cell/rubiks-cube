import { createContext, useReducer, useEffect, ReactNode } from 'react'
import type { CubeEncoding } from '../types/encoding'
import { DEFAULT_ZHUYIN_ENCODING } from '../types/encoding'
import type { MemoryWordDict } from '../types/memoryWord'
import { DEFAULT_MEMORY_WORDS } from '../types/memoryWord'
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
}

export type CubeAction =
  | { type: 'UPDATE_STICKER'; payload: { type: 'corners' | 'edges'; key: string; label: string } }
  | { type: 'RESET_ENCODING' }
  | { type: 'CYCLE_LABEL_MODE' }
  | { type: 'SET_SCRAMBLE'; payload: string }
  | { type: 'UPDATE_MEMORY_WORD'; payload: { key: string; word: string } }
  | { type: 'RESET_MEMORY_WORDS' }

const defaultState: CubeState = {
  encoding: DEFAULT_ZHUYIN_ENCODING,
  labelMode: 'all',
  currentScramble: null,
  cubeStickers: createSolvedState(),
  memo: null,
  memoryWords: DEFAULT_MEMORY_WORDS,
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
      return {
        ...state,
        memoryWords: {
          ...state.memoryWords,
          [key]: word,
        },
      }
    }
    case 'RESET_MEMORY_WORDS':
      return { ...state, memoryWords: DEFAULT_MEMORY_WORDS }
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
