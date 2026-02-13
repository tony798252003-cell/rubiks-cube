import type { CornerPosition, EdgePosition, Face } from './cube'

// 完整編碼系統：每個貼紙都有獨立的編碼
// Key 格式："piece-face"，例如 "UFR-U", "UFR-F", "UFR-R"
export interface CubeEncoding {
  corners: Record<string, string> // 24 個 (8 角塊 × 3 面)
  edges: Record<string, string>   // 24 個 (12 邊塊 × 2 面)
}

// 角塊的面組合：每個角塊有 3 個外露面
export const CORNER_FACES: Record<CornerPosition, Face[]> = {
  'UBL': ['U', 'B', 'L'],
  'UBR': ['U', 'B', 'R'],
  'UFR': ['U', 'F', 'R'],
  'UFL': ['U', 'F', 'L'],
  'DBL': ['D', 'B', 'L'],
  'DBR': ['D', 'B', 'R'],
  'DFR': ['D', 'F', 'R'],
  'DFL': ['D', 'F', 'L'],
}

// 邊塊的面組合：每個邊塊有 2 個外露面
export const EDGE_FACES: Record<EdgePosition, Face[]> = {
  'UB': ['U', 'B'],
  'UR': ['U', 'R'],
  'UF': ['U', 'F'],
  'UL': ['U', 'L'],
  'BL': ['B', 'L'],
  'BR': ['B', 'R'],
  'FR': ['F', 'R'],
  'FL': ['F', 'L'],
  'DB': ['D', 'B'],
  'DR': ['D', 'R'],
  'DF': ['D', 'F'],
  'DL': ['D', 'L'],
}

// 注音預設編碼（Buffer: 邊塊B和M, 角塊A和R）
export const DEFAULT_ZHUYIN_ENCODING: CubeEncoding = {
  corners: {
    // U 面 (A-D)
    'UBL-U': '', 'UBR-U': 'ㄍ', 'UFR-U': 'ㄎ', 'UFL-U': 'ㄏ',
    // L 面 (E-H)
    'UBL-L': 'ㄓ', 'DBL-L': 'ㄖ', 'DFL-L': 'ㄕ', 'UFL-L': 'ㄔ',
    // F 面 (I-L)
    'UFL-F': 'ㄒ', 'UFR-F': 'ㄑ', 'DFR-F': 'ㄊ', 'DFL-F': 'ㄉ',
    // R 面 (M-P)
    'UFR-R': 'ㄗ', 'UBR-R': 'ㄘ', 'DBR-R': 'ㄙ', 'DFR-R': '1',
    // B 面 (Q-T)
    'UBR-B': 'ㄐ', 'UBL-B': '', 'DBL-B': 'ㄌ', 'DBR-B': 'ㄋ',
    // D 面 (U-X)
    'DFL-D': 'ㄅ', 'DFR-D': 'ㄆ', 'DBR-D': 'ㄈ', 'DBL-D': 'ㄇ',
  },
  edges: {
    // U 面 (A-D)
    'UB-U': 'ㄍ', 'UR-U': '', 'UF-U': 'ㄏ', 'UL-U': 'ㄎ',
    // L 面 (E-H)
    'UL-L': 'ㄑ', 'BL-L': 'ㄗ', 'DL-L': 'ㄊ', 'FL-L': 'ㄘ',
    // F 面 (I-L)
    'UF-F': 'ㄒ', 'FR-F': 'ㄕ', 'DF-F': 'ㄉ', 'FL-F': 'ㄔ',
    // R 面 (M-P)
    'UR-R': '', 'BR-R': 'ㄗ', 'DR-R': '1', 'FR-R': 'ㄘ',
    // B 面 (Q-T)
    'UB-B': 'ㄐ', 'BL-B': 'ㄓ', 'DB-B': 'ㄋ', 'BR-B': 'ㄖ',
    // D 面 (U-X)
    'DF-D': 'ㄅ', 'DR-D': 'ㄈ', 'DB-D': 'ㄇ', 'DL-D': 'ㄆ',
  },
}

// Speffz 預設編碼
// 角塊：每面 4 個角貼紙，順時針排列
// U→A,B,C,D  L→E,F,G,H  F→I,J,K,L  R→M,N,O,P  B→Q,R,S,T  D→U,V,W,X
export const DEFAULT_SPEFFZ_ENCODING: CubeEncoding = {
  corners: {
    // U 面 (A-D)
    'UBL-U': 'A', 'UBR-U': 'B', 'UFR-U': 'C', 'UFL-U': 'D',
    // L 面 (E-H)
    'UBL-L': 'E', 'DBL-L': 'F', 'DFL-L': 'G', 'UFL-L': 'H',
    // F 面 (I-L)
    'UFL-F': 'I', 'UFR-F': 'J', 'DFR-F': 'K', 'DFL-F': 'L',
    // R 面 (M-P)
    'UFR-R': 'M', 'UBR-R': 'N', 'DBR-R': 'O', 'DFR-R': 'P',
    // B 面 (Q-T)
    'UBR-B': 'Q', 'UBL-B': 'R', 'DBL-B': 'S', 'DBR-B': 'T',
    // D 面 (U-X)
    'DFL-D': 'U', 'DFR-D': 'V', 'DBR-D': 'W', 'DBL-D': 'X',
  },
  edges: {
    // U 面 (A-D)
    'UB-U': 'A', 'UR-U': 'B', 'UF-U': 'C', 'UL-U': 'D',
    // L 面 (E-H)
    'UL-L': 'E', 'BL-L': 'F', 'DL-L': 'G', 'FL-L': 'H',
    // F 面 (I-L)
    'UF-F': 'I', 'FR-F': 'J', 'DF-F': 'K', 'FL-F': 'L',
    // R 面 (M-P)
    'UR-R': 'M', 'BR-R': 'N', 'DR-R': 'O', 'FR-R': 'P',
    // B 面 (Q-T)
    'UB-B': 'Q', 'BL-B': 'R', 'DB-B': 'S', 'BR-B': 'T',
    // D 面 (U-X)
    'DF-D': 'U', 'DR-D': 'V', 'DB-D': 'W', 'DL-D': 'X',
  },
}

// 面的顯示順序（用於 UI 分組）
export const FACES_ORDER: Face[] = ['U', 'L', 'F', 'R', 'B', 'D']

// 面名稱
export const FACE_NAMES: Record<Face, string> = {
  'U': '上面 (U)', 'D': '下面 (D)', 'F': '前面 (F)',
  'B': '後面 (B)', 'R': '右面 (R)', 'L': '左面 (L)',
}
