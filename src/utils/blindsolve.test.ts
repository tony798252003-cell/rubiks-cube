import { describe, it, expect } from 'vitest'
import { analyzeBlindsolve } from './blindsolve'
import { createSolvedState, applyScramble } from './cubeState'
import { DEFAULT_SPEFFZ_ENCODING } from '../types/encoding'

describe('blindsolve', () => {
  it('returns empty for solved cube', () => {
    const state = createSolvedState()
    const result = analyzeBlindsolve(state, DEFAULT_SPEFFZ_ENCODING)
    expect(result.edges).toBe('')
    expect(result.corners).toBe('')
  })

  it('analyzes simple R move', () => {
    const state = applyScramble('R')
    const result = analyzeBlindsolve(state, DEFAULT_SPEFFZ_ENCODING)
    // R move affects: UR, BR, DR, FR edges and UFR, UBR, DBR, DFR corners
    console.log('R move result:', result)
    expect(result.edges).toBeTruthy()
    expect(result.corners).toBeTruthy()
  })

  it('analyzes U move', () => {
    const state = applyScramble('U')
    const result = analyzeBlindsolve(state, DEFAULT_SPEFFZ_ENCODING)
    console.log('U move result:', result)
    expect(result.edges).toBeTruthy()
    expect(result.corners).toBeTruthy()
  })
})
