export type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R'
export type Color = 'white' | 'yellow' | 'green' | 'blue' | 'orange' | 'red'

export type CornerPosition =
  | 'UBL' | 'UBR' | 'UFR' | 'UFL'
  | 'DBL' | 'DBR' | 'DFR' | 'DFL'

export type EdgePosition =
  | 'UB' | 'UR' | 'UF' | 'UL'
  | 'BL' | 'BR' | 'FR' | 'FL'
  | 'DB' | 'DR' | 'DF' | 'DL'

export type Position = CornerPosition | EdgePosition

export function isValidCornerPosition(pos: string): pos is CornerPosition {
  const corners: CornerPosition[] = ['UBL', 'UBR', 'UFR', 'UFL', 'DBL', 'DBR', 'DFR', 'DFL']
  return corners.includes(pos as CornerPosition)
}

export function isValidEdgePosition(pos: string): pos is EdgePosition {
  const edges: EdgePosition[] = ['UB', 'UR', 'UF', 'UL', 'BL', 'BR', 'FR', 'FL', 'DB', 'DR', 'DF', 'DL']
  return edges.includes(pos as EdgePosition)
}
