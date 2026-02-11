import CubeLabel from './CubeLabel'
import { useCubeContext } from '../hooks/useCubeContext'
import { getCubiePosition } from '../utils/cubeGeometry'
import type { CornerPosition, EdgePosition, Face } from '../types/cube'

// 每個角塊的 grid 座標
const cornerGridPos: Record<CornerPosition, [number, number, number]> = {
  'UBL': [0, 2, 0], 'UBR': [2, 2, 0], 'UFR': [2, 2, 2], 'UFL': [0, 2, 2],
  'DBL': [0, 0, 0], 'DBR': [2, 0, 0], 'DFR': [2, 0, 2], 'DFL': [0, 0, 2],
}

// 每個邊塊的 grid 座標
const edgeGridPos: Record<EdgePosition, [number, number, number]> = {
  'UB': [1, 2, 0], 'UR': [2, 2, 1], 'UF': [1, 2, 2], 'UL': [0, 2, 1],
  'BL': [0, 1, 0], 'BR': [2, 1, 0], 'FR': [2, 1, 2], 'FL': [0, 1, 2],
  'DB': [1, 0, 0], 'DR': [2, 0, 1], 'DF': [1, 0, 2], 'DL': [0, 0, 1],
}

// 面方向對應的偏移和旋轉
const LABEL_OFFSET = 0.48

const faceTransform: Record<Face, {
  offset: [number, number, number]
  rotation: [number, number, number]
}> = {
  'U': { offset: [0, LABEL_OFFSET, 0], rotation: [-Math.PI / 2, 0, 0] },
  'D': { offset: [0, -LABEL_OFFSET, 0], rotation: [Math.PI / 2, 0, 0] },
  'F': { offset: [0, 0, LABEL_OFFSET], rotation: [0, 0, 0] },
  'B': { offset: [0, 0, -LABEL_OFFSET], rotation: [0, Math.PI, 0] },
  'R': { offset: [LABEL_OFFSET, 0, 0], rotation: [0, Math.PI / 2, 0] },
  'L': { offset: [-LABEL_OFFSET, 0, 0], rotation: [0, -Math.PI / 2, 0] },
}

// 從 sticker key "UFR-F" 中解析出 piece 和 face
function parseStickerKey(key: string): { piece: string; face: Face } {
  const lastDash = key.lastIndexOf('-')
  return {
    piece: key.substring(0, lastDash),
    face: key.substring(lastDash + 1) as Face,
  }
}

export default function CubeLabels() {
  const { state } = useCubeContext()
  if (!state.showLabels) return null

  const labels: JSX.Element[] = []

  // 角塊貼紙
  for (const [stickerKey, label] of Object.entries(state.encoding.corners)) {
    const { piece, face } = parseStickerKey(stickerKey)
    const gridPos = cornerGridPos[piece as CornerPosition]
    if (!gridPos) continue
    const cubiePos = getCubiePosition(...gridPos)
    const transform = faceTransform[face]

    labels.push(
      <CubeLabel
        key={`c-${stickerKey}`}
        position={[
          cubiePos[0] + transform.offset[0],
          cubiePos[1] + transform.offset[1],
          cubiePos[2] + transform.offset[2],
        ]}
        rotation={transform.rotation}
        label={label}
      />
    )
  }

  // 邊塊貼紙
  for (const [stickerKey, label] of Object.entries(state.encoding.edges)) {
    const { piece, face } = parseStickerKey(stickerKey)
    const gridPos = edgeGridPos[piece as EdgePosition]
    if (!gridPos) continue
    const cubiePos = getCubiePosition(...gridPos)
    const transform = faceTransform[face]

    labels.push(
      <CubeLabel
        key={`e-${stickerKey}`}
        position={[
          cubiePos[0] + transform.offset[0],
          cubiePos[1] + transform.offset[1],
          cubiePos[2] + transform.offset[2],
        ]}
        rotation={transform.rotation}
        label={label}
      />
    )
  }

  return <group>{labels}</group>
}
