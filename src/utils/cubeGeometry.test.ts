import { describe, it, expect } from 'vitest'
import { getFaceColor, getColorHex, getCubiePosition } from './cubeGeometry'

describe('cubeGeometry', () => {
  it('returns correct colors for each face', () => {
    expect(getFaceColor('U')).toBe('white')
    expect(getFaceColor('D')).toBe('yellow')
    expect(getFaceColor('F')).toBe('green')
    expect(getFaceColor('B')).toBe('blue')
    expect(getFaceColor('L')).toBe('orange')
    expect(getFaceColor('R')).toBe('red')
  })

  it('returns correct hex colors', () => {
    expect(getColorHex('white')).toBe('#FFFFFF')
    expect(getColorHex('red')).toBe('#FF0000')
  })

  it('calculates cubie positions correctly', () => {
    expect(getCubiePosition(1, 1, 1)).toEqual([0, 0, 0])
    expect(getCubiePosition(0, 0, 0)).toEqual([-1.05, -1.05, -1.05])
  })
})
