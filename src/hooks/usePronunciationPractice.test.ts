import { describe, it, expect } from 'vitest'
import { buildShuffledPairs, ZHUYIN_SYMBOLS } from './usePronunciationPractice'

describe('buildShuffledPairs', () => {
  it('should return 484 pairs', () => {
    const pairs = buildShuffledPairs()
    expect(pairs).toHaveLength(484)
  })

  it('should contain all 22x22 combinations', () => {
    const pairs = buildShuffledPairs()
    const keys = pairs.map(p => p.key)
    for (const a of ZHUYIN_SYMBOLS) {
      for (const b of ZHUYIN_SYMBOLS) {
        expect(keys).toContain(`${a}${b}`)
      }
    }
  })

  it('should be shuffled (not in alphabetical order)', () => {
    const ordered = ZHUYIN_SYMBOLS.flatMap(a => ZHUYIN_SYMBOLS.map(b => `${a}${b}`))
    let foundDifferent = false
    for (let i = 0; i < 10; i++) {
      const shuffled = buildShuffledPairs().map(p => p.key)
      if (JSON.stringify(shuffled) !== JSON.stringify(ordered)) {
        foundDifferent = true
        break
      }
    }
    expect(foundDifferent).toBe(true)
  })
})
