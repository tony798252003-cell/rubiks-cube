import type { CornerPosition, EdgePosition } from './cube'

export type CornerEncoding = Record<CornerPosition, string>
export type EdgeEncoding = Record<EdgePosition, string>

export interface CubeEncoding {
  corners: CornerEncoding
  edges: EdgeEncoding
}

export const DEFAULT_SPEFFZ_ENCODING: CubeEncoding = {
  corners: {
    'UBL': 'A', 'UBR': 'B', 'UFR': 'C', 'UFL': 'D',
    'DBL': 'E', 'DBR': 'F', 'DFR': 'G', 'DFL': 'H',
  },
  edges: {
    'UB': 'A', 'UR': 'B', 'UF': 'C', 'UL': 'D',
    'BL': 'E', 'BR': 'F', 'FR': 'G', 'FL': 'H',
    'DB': 'I', 'DR': 'J', 'DF': 'K', 'DL': 'L',
  },
}
