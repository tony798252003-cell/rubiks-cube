import type { Face, Color } from '../types/cube'

export function getFaceColor(face: Face): Color {
  const colorMap: Record<Face, Color> = {
    'U': 'white', 'D': 'yellow', 'F': 'green',
    'B': 'blue', 'L': 'orange', 'R': 'red',
  }
  return colorMap[face]
}

export function getColorHex(color: Color): string {
  const hexMap: Record<Color, string> = {
    'white': '#FFFFFF', 'yellow': '#FFFF00', 'green': '#00FF00',
    'blue': '#0000FF', 'orange': '#FF8800', 'red': '#FF0000',
  }
  return hexMap[color]
}

export function getCubiePosition(x: number, y: number, z: number): [number, number, number] {
  const spacing = 1.05
  return [(x - 1) * spacing, (y - 1) * spacing, (z - 1) * spacing]
}
