import { describe, it, expect } from 'vitest'
import { isValidCornerPosition, isValidEdgePosition } from './cube'

describe('Cube Types', () => {
  it('validates corner positions', () => {
    expect(isValidCornerPosition('UBL')).toBe(true)
    expect(isValidCornerPosition('UFR')).toBe(true)
    expect(isValidCornerPosition('INVALID')).toBe(false)
  })

  it('validates edge positions', () => {
    expect(isValidEdgePosition('UB')).toBe(true)
    expect(isValidEdgePosition('FR')).toBe(true)
    expect(isValidEdgePosition('INVALID')).toBe(false)
  })
})
