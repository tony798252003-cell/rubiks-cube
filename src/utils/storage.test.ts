import { describe, it, expect, beforeEach } from 'vitest'
import { saveToStorage, loadFromStorage, STORAGE_KEY, clearStorage } from './storage'
import { DEFAULT_SPEFFZ_ENCODING } from '../types/encoding'
import { DEFAULT_MEMORY_WORDS } from '../types/memoryWord'
import { initializeFlashcards } from '../types/flashcard'
import { initializeFSRSCards } from '../types/fsrsMigration'
import { createSolvedState } from './cubeState'

function createDefaultSession() {
  const today = new Date().toISOString().split('T')[0]
  return {
    date: today,
    new_cards_today: 0,
    new_cards_limit: 10,
    reviews_completed: 0,
    learning_queue: [],
    introduced_cards: [],
    session_start: Date.now()
  }
}

describe('storage', () => {
  beforeEach(() => { localStorage.clear() })

  it('saves and loads state', async () => {
    const state = {
      encoding: DEFAULT_SPEFFZ_ENCODING,
      labelMode: 'all' as const,
      layoutMode: 'balanced' as const,
      currentScramble: "R U R'",
      cubeStickers: createSolvedState(),
      memo: null,
      memoryWords: DEFAULT_MEMORY_WORDS,
      flashcards: initializeFlashcards(DEFAULT_MEMORY_WORDS),
      fsrsCards: initializeFSRSCards(DEFAULT_MEMORY_WORDS),
      dailySession: createDefaultSession(),
      googleSheetsUrl: '',
    }
    await saveToStorage(state)
    const loaded = await loadFromStorage()
    expect(loaded?.encoding).toEqual(DEFAULT_SPEFFZ_ENCODING)
    expect(loaded?.currentScramble).toBe("R U R'")
  })

  it('returns null for missing data', async () => {
    const loaded = await loadFromStorage()
    expect(loaded).toBeNull()
  })

  it('returns null for invalid JSON', async () => {
    localStorage.setItem(STORAGE_KEY, 'not json')
    const loaded = await loadFromStorage()
    expect(loaded).toBeNull()
  })

  it('clears storage', async () => {
    await saveToStorage({
      encoding: DEFAULT_SPEFFZ_ENCODING,
      labelMode: 'all',
      layoutMode: 'balanced',
      currentScramble: null,
      cubeStickers: createSolvedState(),
      memo: null,
      memoryWords: DEFAULT_MEMORY_WORDS,
      flashcards: initializeFlashcards(DEFAULT_MEMORY_WORDS),
      fsrsCards: initializeFSRSCards(DEFAULT_MEMORY_WORDS),
      dailySession: createDefaultSession(),
      googleSheetsUrl: '',
    })
    await clearStorage()
    const loaded = await loadFromStorage()
    expect(loaded).toBeNull()
  })
})
