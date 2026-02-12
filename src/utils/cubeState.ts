import type { Face } from '../types/cube'
import { cube3x3x3 } from 'cubing/puzzles'
import { Alg } from 'cubing/alg'

export type CubeState = Face[]

export function createSolvedState(): CubeState {
  const faces: Face[] = []
  for (const face of ['U', 'R', 'F', 'D', 'L', 'B'] as Face[]) {
    for (let i = 0; i < 9; i++) faces.push(face)
  }
  return faces
}

// Cache the kpuzzle instance
let kpuzzleCache: any = null

async function getKPuzzle() {
  if (!kpuzzleCache) {
    kpuzzleCache = await cube3x3x3.kpuzzle()
  }
  return kpuzzleCache
}

// 同步包裝 - 第一次呼叫時會返回 solved，之後使用 cached kpuzzle
export function applyScramble(scramble: string): CubeState {
  if (!kpuzzleCache) {
    // First call - initialize in background and return solved
    getKPuzzle().then(() => {
      console.log('✅ KPuzzle initialized, try generating scramble again')
    })
    console.log('⚠️ KPuzzle not ready yet, showing solved state')
    return createSolvedState()
  }

  try {
    const alg = Alg.fromString(scramble)
    const transformation = kpuzzleCache.algToTransformation(alg)
    const result = kpuzzleStateToFacelets(transformation, kpuzzleCache)
    return result
  } catch (e) {
    console.error('❌ Failed to apply scramble:', e)
    return createSolvedState()
  }
}

// 初始化函數 - 在 app 啟動時呼叫
export async function initializeCubeEngine() {
  await getKPuzzle()
}

// 將 KPuzzle 狀態轉換為 54-facelet 陣列
function kpuzzleStateToFacelets(transformation: any, _kpuzzle: any): CubeState {
  const result = createSolvedState()

  // transformation 物件包含 transformationData
  const stateData = transformation.transformationData

  // Centers (固定不動，但為了完整性還是處理)
  const centerIndices = [4, 13, 22, 31, 40, 49]
  const centerFaces: Face[] = ['U', 'R', 'F', 'D', 'L', 'B']

  if (stateData.CENTERS) {
    const centers = stateData.CENTERS.permutation
    for (let i = 0; i < 6; i++) {
      result[centerIndices[i]] = centerFaces[centers[i]]
    }
  }

  // Edges - 12 個邊塊
  // cubing.js 順序: UF(0), UR(1), UB(2), UL(3), DF(4), DR(5), DB(6), DL(7), FR(8), FL(9), BR(10), BL(11)
  // D 面布局 (從下往上看): 前(F)=28, 右(R)=32, 後(B)=34, 左(L)=30
  const edgeFacelets: [number, number][] = [
    [7, 19],   // UF
    [5, 10],   // UR
    [1, 46],   // UB
    [3, 37],   // UL
    [28, 25],  // DF - 修正：D面前中=28
    [32, 16],  // DR
    [34, 52],  // DB - 修正：D面後中=34
    [30, 43],  // DL
    [23, 12],  // FR
    [21, 41],  // FL
    [48, 14],  // BR
    [50, 39],  // BL
  ]

  const edgeFaces: [Face, Face][] = [
    ['U', 'F'], // UF
    ['U', 'R'], // UR
    ['U', 'B'], // UB
    ['U', 'L'], // UL
    ['D', 'F'], // DF
    ['D', 'R'], // DR
    ['D', 'B'], // DB
    ['D', 'L'], // DL
    ['F', 'R'], // FR
    ['F', 'L'], // FL
    ['B', 'R'], // BR
    ['B', 'L'], // BL
  ]

  if (stateData.EDGES) {
    const edges = stateData.EDGES.permutation
    const edgeOrient = stateData.EDGES.orientationDelta

    for (let i = 0; i < 12; i++) {
      const targetEdge = edges[i]
      const flipped = edgeOrient[i] === 1

      const targetFaces = edgeFaces[targetEdge]
      if (!targetFaces) {
        console.error(`No faces for edge ${targetEdge}`)
        continue
      }

      const [face1, face2] = targetFaces
      const [idx1, idx2] = edgeFacelets[i]

      if (flipped) {
        result[idx1] = face2
        result[idx2] = face1
      } else {
        result[idx1] = face1
        result[idx2] = face2
      }
    }
  }

  // Corners - 8 個角塊
  // cubing.js 順序: UFR(0), UBR(1), UBL(2), UFL(3), DFR(4), DFL(5), DBL(6), DBR(7)
  // facelet順序必須匹配KPuzzle的定義
  const cornerFacelets: [number, number, number][] = [
    [8, 9, 20],    // UFR - 修正：U, R, F
    [2, 45, 11],   // UBR
    [0, 36, 47],   // UBL - 修正：U, L, B
    [6, 18, 38],   // UFL
    [29, 26, 15],  // DFR
    [27, 44, 24],  // DFL - 修正：D, L, F
    [33, 53, 42],  // DBL
    [35, 17, 51],  // DBR - 修正：D, R, B
  ]

  const cornerFaces: [Face, Face, Face][] = [
    ['U', 'R', 'F'], // UFR
    ['U', 'B', 'R'], // UBR
    ['U', 'L', 'B'], // UBL
    ['U', 'F', 'L'], // UFL
    ['D', 'F', 'R'], // DFR
    ['D', 'L', 'F'], // DFL
    ['D', 'B', 'L'], // DBL
    ['D', 'R', 'B'], // DBR
  ]

  if (stateData.CORNERS) {
    const corners = stateData.CORNERS.permutation
    const cornerOrient = stateData.CORNERS.orientationDelta

    for (let i = 0; i < 8; i++) {
      const targetCorner = corners[i]
      const twist = cornerOrient[i]

      let [face1, face2, face3] = cornerFaces[targetCorner]

      // Apply twist (0=correct, 1=CW, 2=CCW)
      if (twist === 1) {
        [face1, face2, face3] = [face3, face1, face2]
      } else if (twist === 2) {
        [face1, face2, face3] = [face2, face3, face1]
      }

      const [idx1, idx2, idx3] = cornerFacelets[i]
      result[idx1] = face1
      result[idx2] = face2
      result[idx3] = face3
    }
  }

  return result
}

export function getStickerIndex(
  x: number, y: number, z: number,
  faceDir: '+x' | '-x' | '+y' | '-y' | '+z' | '-z'
): number | null {
  switch (faceDir) {
    case '+y': return y === 2 ? (z * 3 + x) : null
    case '-y': return y === 0 ? 27 + ((2 - z) * 3 + x) : null
    case '+z': return z === 2 ? 18 + ((2 - y) * 3 + x) : null
    case '-z': return z === 0 ? 45 + ((2 - y) * 3 + (2 - x)) : null
    case '+x': return x === 2 ? 9 + ((2 - y) * 3 + (2 - z)) : null
    case '-x': return x === 0 ? 36 + ((2 - y) * 3 + z) : null
  }
}

// 黃上紅前（白下紅前）
const FACE_COLOR_HEX: Record<Face, string> = {
  'U': '#FFED00', 'D': '#FFFFFF', 'F': '#FF3030',
  'B': '#FF8C00', 'R': '#00FF00', 'L': '#0051BA',
}

const INTERNAL_HEX = '#1a1a1a'

export function getCubieColorsFromState(
  state: CubeState,
  x: number, y: number, z: number
): string[] {
  const dirs: ('+x' | '-x' | '+y' | '-y' | '+z' | '-z')[] = ['+x', '-x', '+y', '-y', '+z', '-z']
  return dirs.map(dir => {
    const idx = getStickerIndex(x, y, z, dir)
    return idx === null ? INTERNAL_HEX : FACE_COLOR_HEX[state[idx]]
  })
}
