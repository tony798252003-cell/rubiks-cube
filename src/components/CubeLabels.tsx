import CubeLabel from './CubeLabel'
import { useCubeContext } from '../hooks/useCubeContext'
import { getCubiePosition } from '../utils/cubeGeometry'
import type { CornerPosition, EdgePosition } from '../types/cube'

// 每個位置的 grid 座標 (x, y, z)
const cornerGridPos: Record<CornerPosition, [number, number, number]> = {
  'UBL': [0, 2, 0], 'UBR': [2, 2, 0], 'UFR': [2, 2, 2], 'UFL': [0, 2, 2],
  'DBL': [0, 0, 0], 'DBR': [2, 0, 0], 'DFR': [2, 0, 2], 'DFL': [0, 0, 2],
}

const edgeGridPos: Record<EdgePosition, [number, number, number]> = {
  'UB': [1, 2, 0], 'UR': [2, 2, 1], 'UF': [1, 2, 2], 'UL': [0, 2, 1],
  'BL': [0, 1, 0], 'BR': [2, 1, 0], 'FR': [2, 1, 2], 'FL': [0, 1, 2],
  'DB': [1, 0, 0], 'DR': [2, 0, 1], 'DF': [1, 0, 2], 'DL': [0, 0, 1],
}

// 位置名稱的第一個字母代表標籤貼在哪個面上
// U* → +y面, D* → -y面, F* → +z面, B* → -z面
// 中間層邊塊：FR, FL → F面(+z), BR, BL → B面(-z)
type FaceDirection = '+y' | '-y' | '+z' | '-z' | '+x' | '-x'

function getLabelFace(pos: string): FaceDirection {
  const first = pos[0]
  if (first === 'U') return '+y'
  if (first === 'D') return '-y'
  if (first === 'F') return '+z'
  if (first === 'B') return '-z'
  // 不應該到這裡
  return '+y'
}

// 根據面方向計算標籤的偏移位置和旋轉
const LABEL_OFFSET = 0.48 // 方塊半邊長

function getLabelTransform(
  cubiePos: [number, number, number],
  face: FaceDirection
): { position: [number, number, number]; rotation: [number, number, number] } {
  const [cx, cy, cz] = cubiePos

  switch (face) {
    case '+y': // U面 - 朝上
      return {
        position: [cx, cy + LABEL_OFFSET, cz],
        rotation: [-Math.PI / 2, 0, 0],
      }
    case '-y': // D面 - 朝下
      return {
        position: [cx, cy - LABEL_OFFSET, cz],
        rotation: [Math.PI / 2, 0, 0],
      }
    case '+z': // F面 - 朝前
      return {
        position: [cx, cy, cz + LABEL_OFFSET],
        rotation: [0, 0, 0],
      }
    case '-z': // B面 - 朝後
      return {
        position: [cx, cy, cz - LABEL_OFFSET],
        rotation: [0, Math.PI, 0],
      }
    case '+x': // R面 - 朝右
      return {
        position: [cx + LABEL_OFFSET, cy, cz],
        rotation: [0, Math.PI / 2, 0],
      }
    case '-x': // L面 - 朝左
      return {
        position: [cx - LABEL_OFFSET, cy, cz],
        rotation: [0, -Math.PI / 2, 0],
      }
  }
}

export default function CubeLabels() {
  const { state } = useCubeContext()
  if (!state.showLabels) return null

  const labels: JSX.Element[] = []

  // 角塊標籤
  for (const [pos, label] of Object.entries(state.encoding.corners)) {
    const gridPos = cornerGridPos[pos as CornerPosition]
    const cubiePos = getCubiePosition(...gridPos)
    const face = getLabelFace(pos)
    const { position, rotation } = getLabelTransform(cubiePos, face)
    labels.push(
      <CubeLabel key={`c-${pos}`} position={position} rotation={rotation} label={label} />
    )
  }

  // 邊塊標籤
  for (const [pos, label] of Object.entries(state.encoding.edges)) {
    const gridPos = edgeGridPos[pos as EdgePosition]
    const cubiePos = getCubiePosition(...gridPos)
    const face = getLabelFace(pos)
    const { position, rotation } = getLabelTransform(cubiePos, face)
    labels.push(
      <CubeLabel key={`e-${pos}`} position={position} rotation={rotation} label={label} />
    )
  }

  return <group>{labels}</group>
}
