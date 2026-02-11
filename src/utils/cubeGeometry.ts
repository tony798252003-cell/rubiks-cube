import type { Face, Color } from '../types/cube'

// 色彩方案：白色朝下(D)、紅色朝前(F)
export function getFaceColor(face: Face): Color {
  const colorMap: Record<Face, Color> = {
    'U': 'yellow', 'D': 'white', 'F': 'red',
    'B': 'orange', 'R': 'green', 'L': 'blue',
  }
  return colorMap[face]
}

export function getColorHex(color: Color): string {
  const hexMap: Record<Color, string> = {
    'white': '#FFFFFF', 'yellow': '#FFD500', 'green': '#00D800',
    'blue': '#0046AD', 'orange': '#FF5800', 'red': '#C41E3A',
  }
  return hexMap[color]
}

// 內部面（不可見）的顏色
export const INTERNAL_COLOR = '#1a1a1a'

export function getCubiePosition(x: number, y: number, z: number): [number, number, number] {
  const spacing = 1.05
  return [(x - 1) * spacing, (y - 1) * spacing, (z - 1) * spacing]
}
