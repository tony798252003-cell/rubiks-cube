import type { CubeState } from '../context/CubeContext'

export const STORAGE_KEY = 'cubeTrainer'

export function saveToStorage(state: CubeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: '1.0.0',
      ...state,
      lastUpdated: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export function loadFromStorage(): CubeState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const data = JSON.parse(stored)
    if (!data.encoding?.corners || !data.encoding?.edges) return null
    return {
      encoding: data.encoding,
      showLabels: data.showLabels ?? true,
      currentScramble: data.currentScramble ?? null,
    }
  } catch {
    return null
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}
