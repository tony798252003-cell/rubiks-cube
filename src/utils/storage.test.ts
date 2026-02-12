import { describe, it, expect, beforeEach } from 'vitest'
import { saveToStorage, loadFromStorage, STORAGE_KEY, clearStorage } from './storage'
import { DEFAULT_SPEFFZ_ENCODING } from '../types/encoding'
import { createSolvedState } from './cubeState'

describe('storage', () => {
  beforeEach(() => { localStorage.clear() })

  it('saves and loads state', () => {
    const state = {
      encoding: DEFAULT_SPEFFZ_ENCODING,
      labelMode: 'all' as const,
      currentScramble: "R U R'",
      cubeStickers: createSolvedState(),
      memo: null
    }
    saveToStorage(state)
    const loaded = loadFromStorage()
    expect(loaded?.encoding).toEqual(DEFAULT_SPEFFZ_ENCODING)
    expect(loaded?.currentScramble).toBe("R U R'")
  })

  it('returns null for missing data', () => {
    expect(loadFromStorage()).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not json')
    expect(loadFromStorage()).toBeNull()
  })

  it('clears storage', () => {
    saveToStorage({
      encoding: DEFAULT_SPEFFZ_ENCODING,
      labelMode: 'all',
      currentScramble: null,
      cubeStickers: createSolvedState(),
      memo: null
    })
    clearStorage()
    expect(loadFromStorage()).toBeNull()
  })
})
