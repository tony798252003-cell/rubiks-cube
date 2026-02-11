import { createContext, useReducer, ReactNode } from 'react'
import type { CubeEncoding } from '../types/encoding'
import type { CornerPosition, EdgePosition } from '../types/cube'
import { DEFAULT_SPEFFZ_ENCODING } from '../types/encoding'

export interface CubeState {
  encoding: CubeEncoding
  showLabels: boolean
  currentScramble: string | null
}

export type CubeAction =
  | { type: 'UPDATE_CORNER_ENCODING'; payload: { position: CornerPosition; label: string } }
  | { type: 'UPDATE_EDGE_ENCODING'; payload: { position: EdgePosition; label: string } }
  | { type: 'RESET_ENCODING' }
  | { type: 'TOGGLE_LABELS' }
  | { type: 'SET_SCRAMBLE'; payload: string }

const initialState: CubeState = {
  encoding: DEFAULT_SPEFFZ_ENCODING,
  showLabels: true,
  currentScramble: null,
}

function cubeReducer(state: CubeState, action: CubeAction): CubeState {
  switch (action.type) {
    case 'UPDATE_CORNER_ENCODING':
      return {
        ...state,
        encoding: {
          ...state.encoding,
          corners: { ...state.encoding.corners, [action.payload.position]: action.payload.label },
        },
      }
    case 'UPDATE_EDGE_ENCODING':
      return {
        ...state,
        encoding: {
          ...state.encoding,
          edges: { ...state.encoding.edges, [action.payload.position]: action.payload.label },
        },
      }
    case 'RESET_ENCODING':
      return { ...state, encoding: DEFAULT_SPEFFZ_ENCODING }
    case 'TOGGLE_LABELS':
      return { ...state, showLabels: !state.showLabels }
    case 'SET_SCRAMBLE':
      return { ...state, currentScramble: action.payload }
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
  const [state, dispatch] = useReducer(cubeReducer, initialState)
  return (
    <CubeContext.Provider value={{ state, dispatch }}>
      {children}
    </CubeContext.Provider>
  )
}
