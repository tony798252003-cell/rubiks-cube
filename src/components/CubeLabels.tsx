import CubeLabel from './CubeLabel'
import { useCubeContext } from '../hooks/useCubeContext'
import { getCubiePosition } from '../utils/cubeGeometry'
import type { CornerPosition, EdgePosition } from '../types/cube'

const cornerPositions: Record<CornerPosition, [number, number, number]> = {
  'UBL': [0, 2, 0], 'UBR': [2, 2, 0], 'UFR': [2, 2, 2], 'UFL': [0, 2, 2],
  'DBL': [0, 0, 0], 'DBR': [2, 0, 0], 'DFR': [2, 0, 2], 'DFL': [0, 0, 2],
}

const edgePositions: Record<EdgePosition, [number, number, number]> = {
  'UB': [1, 2, 0], 'UR': [2, 2, 1], 'UF': [1, 2, 2], 'UL': [0, 2, 1],
  'BL': [0, 1, 0], 'BR': [2, 1, 0], 'FR': [2, 1, 2], 'FL': [0, 1, 2],
  'DB': [1, 0, 0], 'DR': [2, 0, 1], 'DF': [1, 0, 2], 'DL': [0, 0, 1],
}

export default function CubeLabels() {
  const { state } = useCubeContext()
  if (!state.showLabels) return null

  return (
    <group>
      {Object.entries(state.encoding.corners).map(([pos, label]) => {
        const gridPos = cornerPositions[pos as CornerPosition]
        return (
          <CubeLabel key={`c-${pos}`} position={getCubiePosition(...gridPos)} label={label} />
        )
      })}
      {Object.entries(state.encoding.edges).map(([pos, label]) => {
        const gridPos = edgePositions[pos as EdgePosition]
        return (
          <CubeLabel key={`e-${pos}`} position={getCubiePosition(...gridPos)} label={label} />
        )
      })}
    </group>
  )
}
