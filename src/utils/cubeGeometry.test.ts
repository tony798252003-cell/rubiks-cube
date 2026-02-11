import { describe, it, expect } from 'vitest'
import { getFaceColor, getColorHex, getCubiePosition } from './cubeGeometry'

describe('cubeGeometry', () => {
  it('returns correct colors for each face (white-down, red-front)', () => {
    expect(getFaceColor('U')).toBe('yellow')
    expect(getFaceColor('D')).toBe('white')
    expect(getFaceColor('F')).toBe('red')
    expect(getFaceColor('B')).toBe('orange')
    expect(getFaceColor('R')).toBe('green')
    expect(getFaceColor('L')).toBe('blue')
  })

  it('returns correct hex colors', () => {
    expect(getColorHex('white')).toBe('#FFFFFF')
    expect(getColorHex('red')).toBe('#C41E3A')
  })

  it('calculates cubie positions correctly', () => {
    expect(getCubiePosition(1, 1, 1)).toEqual([0, 0, 0])
    expect(getCubiePosition(0, 0, 0)).toEqual([-1.05, -1.05, -1.05])
  })
})
