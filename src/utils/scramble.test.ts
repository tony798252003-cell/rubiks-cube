import { describe, it, expect } from 'vitest'
import { generateScramble } from './scramble'

describe('scramble', () => {
  it('generates a scramble string with default 20 moves', () => {
    const scramble = generateScramble()
    expect(typeof scramble).toBe('string')
    expect(scramble.split(' ').length).toBe(20)
  })

  it('generates different scrambles', () => {
    const s1 = generateScramble()
    const s2 = generateScramble()
    expect(s1).not.toBe(s2)
  })

  it('does not have consecutive same-face moves', () => {
    const scramble = generateScramble()
    const moves = scramble.split(' ').map(m => m.replace(/['2]/g, ''))
    for (let i = 1; i < moves.length; i++) {
      expect(moves[i]).not.toBe(moves[i - 1])
    }
  })
})
