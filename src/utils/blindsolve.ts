import type { CubeState } from './cubeState'
import { getStickerIndex } from './cubeState'
import type { CubeEncoding } from '../types/encoding'
import type { Face } from '../types/cube'

// Buffer 和 target（使用 JPerm 方法）
const EDGE_BUFFER = 'UR'
// const EDGE_BUFFER_PRIMARY = 'UR-U'  // 主貼紙
const EDGE_TARGET = 'UL'

const CORNER_BUFFER = 'UBL'
// const CORNER_BUFFER_PRIMARY = 'UBL-U'
const CORNER_TARGET = 'DFR'

// 邊塊定義
const EDGES: Array<[string, [number, number, number], [Face, Face]]> = [
  ['UB', [1, 2, 0], ['U', 'B']],
  ['UR', [2, 2, 1], ['U', 'R']],
  ['UF', [1, 2, 2], ['U', 'F']],
  ['UL', [0, 2, 1], ['U', 'L']],
  ['BL', [0, 1, 0], ['B', 'L']],
  ['BR', [2, 1, 0], ['B', 'R']],
  ['FR', [2, 1, 2], ['F', 'R']],
  ['FL', [0, 1, 2], ['F', 'L']],
  ['DB', [1, 0, 0], ['D', 'B']],
  ['DR', [2, 0, 1], ['D', 'R']],
  ['DF', [1, 0, 2], ['D', 'F']],
  ['DL', [0, 0, 1], ['D', 'L']],
]

// 循環中斷時尋找下一個邊塊的順序（注音編碼順序：ㄍㄎㄏㄓㄔㄕㄖㄅㄆㄇㄈ）
const EDGE_CYCLE_ORDER = ['UB', 'UL', 'UF', 'BL', 'FL', 'FR', 'BR', 'DF', 'DL', 'DB', 'DR']

// 角塊定義
const CORNERS: Array<[string, [number, number, number], [Face, Face, Face]]> = [
  ['UBL', [0, 2, 0], ['U', 'B', 'L']],
  ['UBR', [2, 2, 0], ['U', 'R', 'B']],
  ['UFR', [2, 2, 2], ['U', 'F', 'R']],
  ['UFL', [0, 2, 2], ['U', 'L', 'F']],
  ['DBL', [0, 0, 0], ['D', 'L', 'B']],
  ['DBR', [2, 0, 0], ['D', 'B', 'R']],
  ['DFR', [2, 0, 2], ['D', 'R', 'F']],
  ['DFL', [0, 0, 2], ['D', 'F', 'L']],
]

// 循環中斷時尋找下一個角塊的順序（注音編碼順序：ㄍㄎㄏㄅㄆㄇㄈ）
const CORNER_CYCLE_ORDER = ['UBR', 'UFR', 'UFL', 'DFL', 'DFR', 'DBL', 'DBR']

const FACE_DIR: Record<Face, '+x' | '-x' | '+y' | '-y' | '+z' | '-z'> = {
  'U': '+y', 'D': '-y', 'F': '+z', 'B': '-z', 'R': '+x', 'L': '-x'
}

// 建立 sticker → index 的映射
function buildStickerIndexMap(): Record<string, number> {
  const map: Record<string, number> = {}

  for (const [piece, [x, y, z], faces] of EDGES) {
    for (const face of faces) {
      const idx = getStickerIndex(x, y, z, FACE_DIR[face])
      if (idx !== null) {
        map[`${piece}-${face}`] = idx
      }
    }
  }

  for (const [piece, [x, y, z], faces] of CORNERS) {
    for (const face of faces) {
      const idx = getStickerIndex(x, y, z, FACE_DIR[face])
      if (idx !== null) {
        map[`${piece}-${face}`] = idx
      }
    }
  }

  return map
}

// 讀取某個邊塊位置的兩個顏色
function getEdgeColors(state: CubeState, piece: string, indexMap: Record<string, number>): [Face, Face] | null {
  const edgeInfo = EDGES.find(([p]) => p === piece)
  if (!edgeInfo) return null

  const [, , faces] = edgeInfo
  const idx1 = indexMap[`${piece}-${faces[0]}`]
  const idx2 = indexMap[`${piece}-${faces[1]}`]

  if (idx1 === undefined || idx2 === undefined) return null

  return [state[idx1], state[idx2]]
}

// 根據顏色組合找出在 solved state 這是哪個邊塊，並返回「特定顏色」在那個邊塊的貼紙
function findEdgeStickerByColors(color1: Face, color2: Face, targetColor: Face): string | null {
  for (const [piece, , faces] of EDGES) {
    const [face1, face2] = faces

    // 檢查這個邊塊是否包含這兩個顏色（任意順序）
    const hasColors = (
      (face1 === color1 && face2 === color2) ||
      (face1 === color2 && face2 === color1)
    )

    if (hasColors) {
      // 返回「targetColor 那面」的貼紙
      if (face1 === targetColor) return `${piece}-${face1}`
      if (face2 === targetColor) return `${piece}-${face2}`
    }
  }

  return null
}

// 檢查邊塊是否已還原（兩個面的顏色都正確）
function isEdgeSolved(state: CubeState, piece: string, indexMap: Record<string, number>): boolean {
  const edgeInfo = EDGES.find(([p]) => p === piece)
  if (!edgeInfo) return true

  const [, , faces] = edgeInfo
  const idx1 = indexMap[`${piece}-${faces[0]}`]
  const idx2 = indexMap[`${piece}-${faces[1]}`]

  return state[idx1] === faces[0] && state[idx2] === faces[1]
}

// 追蹤邊塊循環
function traceEdges(
  state: CubeState,
  encoding: CubeEncoding
): string[] {
  const memo: string[] = []
  const visited = new Set<string>()
  const indexMap = buildStickerIndexMap()

  // 找出第一個要追蹤的位置
  let currentPiece = EDGE_BUFFER
  let currentFace: Face | null = null  // 追蹤當前應該看的面

  // 調試：檢查每個邊塊的狀態
  console.log('🔍 邊塊狀態檢查：')
  console.log(`  Buffer (${EDGE_BUFFER}): ${isEdgeSolved(state, EDGE_BUFFER, indexMap) ? '✅ 已還原' : '❌ 未還原'}`)
  console.log(`  Target (${EDGE_TARGET}): ${isEdgeSolved(state, EDGE_TARGET, indexMap) ? '✅ 已還原' : '❌ 未還原'}`)

  // 如果 buffer 已還原，從 target 開始
  if (isEdgeSolved(state, EDGE_BUFFER, indexMap)) {
    currentPiece = EDGE_TARGET
    console.log(`  → Buffer 已還原，從 Target (${EDGE_TARGET}) 位置開始追蹤`)

    // 如果 target 也已還原，從循環順序中找第一個未還原的
    if (isEdgeSolved(state, EDGE_TARGET, indexMap)) {
      console.log(`  → Target 也已還原，檢查循環順序：`)
      let found = false
      for (const piece of EDGE_CYCLE_ORDER) {
        const solved = isEdgeSolved(state, piece, indexMap)
        console.log(`    ${piece}: ${solved ? '✅' : '❌'}`)
        if (!solved && !found) {
          currentPiece = piece
          found = true
          console.log(`  ✅ 選擇起始位置: ${piece}`)
        }
      }
      // 如果所有邊塊都已還原，返回空陣列
      if (!found) {
        console.log('  → 所有邊塊都已還原')
        return []
      }
    }
  } else {
    console.log(`  → Buffer 未還原，從 Buffer (${EDGE_BUFFER}) 開始`)
  }

  console.log(`\n📍 開始從位置 ${currentPiece} 追蹤...`)

  let cycleCount = 0
  const maxCycles = 12  // 最多 12 個邊塊

  while (cycleCount < maxCycles && visited.size < 12) {
    cycleCount++
    let cycleStartPiece = currentPiece
    currentFace = null  // 新循環開始，重置面

    // 記錄循環起點的編碼（包括第一個循環）
    const edgeInfo = EDGES.find(([p]) => p === currentPiece)
    if (edgeInfo) {
      const currentFaces = edgeInfo[2]
      const startSticker = `${currentPiece}-${currentFaces[0]}`
      const startLabel = encoding.edges[startSticker]
      if (startLabel) {
        memo.push(startLabel)
        console.log(`  🎯 記錄起始貼紙: ${startSticker} = ${startLabel}`)
      }
    }

    // 追蹤一個循環
    for (let i = 0; i < 24; i++) {
      // 讀取當前位置的兩個顏色
      const colors = getEdgeColors(state, currentPiece, indexMap)
      if (!colors) break

      const [color1, color2] = colors

      // 找出主貼紙的顏色
      const edgeInfo = EDGES.find(([p]) => p === currentPiece)
      if (!edgeInfo) break

      const currentFaces = edgeInfo[2]
      // 使用上一步指向的面，如果是循環開始則用第一個面
      const targetFace = currentFace || currentFaces[0]
      const primaryIdx = indexMap[`${currentPiece}-${targetFace}`]
      const primaryColor = state[primaryIdx]

      // 調試：顯示追蹤過程
      if (i === 0) {
        console.log(`  位置 ${currentPiece}-${targetFace}: 顏色=${primaryColor}+${color1 === primaryColor ? color2 : color1}`)
      }

      // 找出這個顏色組合在 solved state 是哪個邊塊，並返回「primaryColor 那面」的貼紙
      const targetSticker = findEdgeStickerByColors(color1, color2, primaryColor)
      if (!targetSticker) break

      const [targetPiece, targetFaceStr] = targetSticker.split('-') as [string, Face]

      // 標記當前 piece 為已訪問
      visited.add(currentPiece)

      // 記錄編碼
      const label = encoding.edges[targetSticker]
      if (!label) break

      // 調試：顯示選擇的貼紙和編碼
      if (i === 0) {
        console.log(`  → 這個邊塊應該在: ${targetSticker}`)
        console.log(`  → 編碼: ${label}\n`)
      }

      // 如果回到 buffer，這個循環結束（不記錄 buffer 的貼紙）
      if (targetPiece === EDGE_BUFFER) {
        break
      }

      memo.push(label)

      // 如果回到循環起點（cycle break 件），這個循環結束
      if (targetPiece === cycleStartPiece) {
        break
      }

      // 如果已經訪問過，這個循環結束
      if (visited.has(targetPiece)) {
        break
      }

      // 繼續追蹤，並記住下一步要看的面
      currentPiece = targetPiece
      currentFace = targetFaceStr
    }

    // 尋找下一個未訪問且未還原的邊塊作為新循環起點（按照注音編碼順序）
    let foundNext = false
    for (const piece of EDGE_CYCLE_ORDER) {
      if (!visited.has(piece) && !isEdgeSolved(state, piece, indexMap)) {
        currentPiece = piece
        foundNext = true
        break
      }
    }

    if (!foundNext) break
  }

  return memo
}

// 讀取某個角塊位置的三個顏色
function getCornerColors(state: CubeState, piece: string, indexMap: Record<string, number>): [Face, Face, Face] | null {
  const cornerInfo = CORNERS.find(([p]) => p === piece)
  if (!cornerInfo) return null

  const [, , faces] = cornerInfo
  const idx1 = indexMap[`${piece}-${faces[0]}`]
  const idx2 = indexMap[`${piece}-${faces[1]}`]
  const idx3 = indexMap[`${piece}-${faces[2]}`]

  if (idx1 === undefined || idx2 === undefined || idx3 === undefined) return null

  return [state[idx1], state[idx2], state[idx3]]
}

// 根據顏色組合找出在 solved state 這是哪個角塊，並返回「特定顏色」在那個角塊的貼紙
function findCornerStickerByColors(color1: Face, color2: Face, color3: Face, targetColor: Face): string | null {
  const colorSet = new Set([color1, color2, color3])

  for (const [piece, , faces] of CORNERS) {
    const faceSet = new Set(faces)

    // 檢查這個角塊是否包含這三個顏色
    if (colorSet.size === faceSet.size && [...colorSet].every(c => faceSet.has(c))) {
      // 返回「targetColor 那面」的貼紙
      for (const face of faces) {
        if (face === targetColor) {
          return `${piece}-${face}`
        }
      }
    }
  }

  return null
}

// 檢查角塊是否已還原（三個面的顏色都正確）
function isCornerSolved(state: CubeState, piece: string, indexMap: Record<string, number>): boolean {
  const cornerInfo = CORNERS.find(([p]) => p === piece)
  if (!cornerInfo) return true

  const [, , faces] = cornerInfo
  const idx1 = indexMap[`${piece}-${faces[0]}`]
  const idx2 = indexMap[`${piece}-${faces[1]}`]
  const idx3 = indexMap[`${piece}-${faces[2]}`]

  return state[idx1] === faces[0] && state[idx2] === faces[1] && state[idx3] === faces[2]
}

// 追蹤角塊循環
function traceCorners(
  state: CubeState,
  encoding: CubeEncoding
): string[] {
  const memo: string[] = []
  const visited = new Set<string>()
  const indexMap = buildStickerIndexMap()

  // 找出第一個要追蹤的位置
  let currentPiece = CORNER_BUFFER
  let currentFace: Face | null = null  // 追蹤當前應該看的面

  // 如果 buffer 已還原，從 target 開始
  if (isCornerSolved(state, CORNER_BUFFER, indexMap)) {
    currentPiece = CORNER_TARGET

    // 如果 target 也已還原，從循環順序中找第一個未還原的
    if (isCornerSolved(state, CORNER_TARGET, indexMap)) {
      let found = false
      for (const piece of CORNER_CYCLE_ORDER) {
        if (!isCornerSolved(state, piece, indexMap)) {
          currentPiece = piece
          found = true
          break
        }
      }
      // 如果所有角塊都已還原，返回空陣列
      if (!found) return []
    }
  }

  let cycleCount = 0
  const maxCycles = 8  // 最多 8 個角塊

  while (cycleCount < maxCycles && visited.size < 8) {
    cycleCount++
    let cycleStartPiece = currentPiece
    currentFace = null  // 新循環開始，重置面

    // 如果不是第一個循環，先記錄新循環起點的編碼作為 cycle break
    if (cycleCount > 1) {
      const cornerInfo = CORNERS.find(([p]) => p === currentPiece)
      if (cornerInfo) {
        const currentFaces = cornerInfo[2]
        const cycleBreakSticker = `${currentPiece}-${currentFaces[0]}`
        const cycleBreakLabel = encoding.corners[cycleBreakSticker]
        if (cycleBreakLabel) {
          memo.push(cycleBreakLabel)
        }
      }
    }

    // 追蹤一個循環
    for (let i = 0; i < 24; i++) {
      // 讀取當前位置的三個顏色
      const colors = getCornerColors(state, currentPiece, indexMap)
      if (!colors) break

      const [color1, color2, color3] = colors

      // 找出主貼紙的顏色
      const cornerInfo = CORNERS.find(([p]) => p === currentPiece)
      if (!cornerInfo) break

      const currentFaces = cornerInfo[2]
      // 使用上一步指向的面，如果是循環開始則用第一個面
      const targetFace = currentFace || currentFaces[0]
      const primaryIdx = indexMap[`${currentPiece}-${targetFace}`]
      const primaryColor = state[primaryIdx]

      // 找出這個顏色組合在 solved state 是哪個角塊，並返回「primaryColor 那面」的貼紙
      const targetSticker = findCornerStickerByColors(color1, color2, color3, primaryColor)
      if (!targetSticker) break

      const [targetPiece, targetFaceStr] = targetSticker.split('-') as [string, Face]

      // 標記當前 piece 為已訪問
      visited.add(currentPiece)

      // 記錄編碼
      const label = encoding.corners[targetSticker]
      if (!label) break

      // 如果回到 buffer，這個循環結束（不記錄 buffer 的貼紙）
      if (targetPiece === CORNER_BUFFER) {
        break
      }

      memo.push(label)

      // 如果回到循環起點（cycle break 件），這個循環結束
      if (targetPiece === cycleStartPiece) {
        break
      }

      // 如果已經訪問過，這個循環結束
      if (visited.has(targetPiece)) {
        break
      }

      // 繼續追蹤，並記住下一步要看的面
      currentPiece = targetPiece
      currentFace = targetFaceStr
    }

    // 尋找下一個未訪問且未還原的角塊作為新循環起點（按照注音編碼順序）
    let foundNext = false
    for (const piece of CORNER_CYCLE_ORDER) {
      if (!visited.has(piece) && !isCornerSolved(state, piece, indexMap)) {
        currentPiece = piece
        foundNext = true
        break
      }
    }

    if (!foundNext) break
  }

  return memo
}

export interface BlindsolveResult {
  edges: string
  corners: string
}

export function analyzeBlindsolve(state: CubeState, encoding: CubeEncoding): BlindsolveResult {
  const edgeMemo = traceEdges(state, encoding)
  const cornerMemo = traceCorners(state, encoding)

  return {
    edges: edgeMemo.join(' '),
    corners: cornerMemo.join(' ')
  }
}
