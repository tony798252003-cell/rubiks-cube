import type { CubeState } from '../context/CubeContext'
import { applyScramble, createSolvedState } from './cubeState'
import { analyzeBlindsolve } from './blindsolve'
import { DEFAULT_MEMORY_WORDS } from '../types/memoryWord'
import { initializeFlashcards } from '../types/flashcard'
import { initializeFSRSCards, migrateDeckToFSRS, isOldFormat } from '../types/fsrsMigration'
import { FSRSCard } from '../types/fsrs'
import { DailySession } from '../types/dailySession'
import {
  saveToIndexedDB,
  loadFromIndexedDB,
  clearIndexedDB,
  isIndexedDBSupported,
  testIndexedDB
} from './indexedDB'

export const STORAGE_KEY = 'cubeTrainer'
const MIGRATED_FLAG_KEY = 'cubeTrainer_migrated_to_indexeddb'

// 存儲類型
export type StorageType = 'indexedDB' | 'localStorage' | 'none'

// 當前使用的存儲類型
let currentStorageType: StorageType = 'none'

/**
 * 檢測並初始化存儲系統
 */
export async function initializeStorage(): Promise<StorageType> {
  // 優先使用 IndexedDB
  if (isIndexedDBSupported()) {
    try {
      const works = await testIndexedDB()
      if (works) {
        currentStorageType = 'indexedDB'
        console.log('✅ Using IndexedDB for storage')

        // 檢查是否需要從 localStorage 遷移
        await migrateFromLocalStorageIfNeeded()

        return 'indexedDB'
      }
    } catch (error) {
      console.warn('IndexedDB test failed, falling back to localStorage:', error)
    }
  }

  // 降級到 localStorage
  if (typeof localStorage !== 'undefined') {
    currentStorageType = 'localStorage'
    console.log('⚠️ Using localStorage for storage (IndexedDB not available)')
    return 'localStorage'
  }

  // 都不可用
  currentStorageType = 'none'
  console.error('❌ No storage available!')
  return 'none'
}

/**
 * 獲取當前使用的存儲類型
 */
export function getCurrentStorageType(): StorageType {
  return currentStorageType
}

// 序列化 FSRS 卡片（Date -> string）
function serializeFSRSCards(cards: FSRSCard[]): any[] {
  const invalidCards: string[] = []

  const result = cards.map(card => {
    // 確保 due 和 last_review 是有效的 Date 對象
    const dueIsValid = card.due instanceof Date && !isNaN(card.due.getTime())
    const lastReviewIsValid = card.last_review instanceof Date && !isNaN(card.last_review.getTime())

    if (!dueIsValid || !lastReviewIsValid) {
      invalidCards.push(`${card.id} (due: ${dueIsValid ? 'OK' : 'INVALID'}, last_review: ${lastReviewIsValid ? 'OK' : 'INVALID'})`)
    }

    const due = dueIsValid ? card.due : new Date()
    const last_review = lastReviewIsValid ? card.last_review : new Date()

    return {
      ...card,
      due: due.toISOString(),
      last_review: last_review.toISOString(),
    }
  })

  if (invalidCards.length > 0) {
    console.warn('⚠️ Found cards with invalid dates:', invalidCards.slice(0, 5))
  }

  return result
}

// 反序列化 FSRS 卡片（string -> Date）
function deserializeFSRSCards(data: any[]): FSRSCard[] {
  return data.map(card => {
    // 如果已經是 Date 對象，直接使用；否則從字符串轉換
    let due: Date
    if (card.due instanceof Date) {
      due = card.due
    } else {
      due = new Date(card.due)
    }

    let last_review: Date
    if (card.last_review instanceof Date) {
      last_review = card.last_review
    } else {
      last_review = new Date(card.last_review)
    }

    // 驗證 Date 是否有效
    if (isNaN(due.getTime())) {
      console.warn(`⚠️ Invalid due date for card ${card.id}, using current time`)
      due = new Date()
    }

    if (isNaN(last_review.getTime())) {
      console.warn(`⚠️ Invalid last_review date for card ${card.id}, using current time`)
      last_review = new Date()
    }

    return {
      ...card,
      due,
      last_review,
    }
  })
}

/**
 * 保存狀態（自動選擇 IndexedDB 或 localStorage）
 */
export async function saveToStorage(state: CubeState): Promise<void> {
  // 如果存儲系統還沒初始化，先初始化
  if (currentStorageType === 'none') {
    console.log('💾 Storage not initialized, initializing now...')
    await initializeStorage()
  }

  const serializedData = {
    version: '2.0.0',
    encoding: state.encoding,
    labelMode: state.labelMode,
    layoutMode: state.layoutMode,
    currentScramble: state.currentScramble,
    memoryWords: state.memoryWords,
    flashcards: state.flashcards,
    fsrsCards: serializeFSRSCards(state.fsrsCards),
    dailySession: state.dailySession,
    lastUpdated: new Date().toISOString(),
  }

  console.log('💾 Saving state:', {
    fsrsCardsCount: state.fsrsCards.length,
    dailySession: state.dailySession,
    learning_queue: state.dailySession.learning_queue.length,
    introduced_cards: state.dailySession.introduced_cards.length,
  })

  // 優先保存到 IndexedDB
  if (currentStorageType === 'indexedDB') {
    try {
      await saveToIndexedDB(serializedData)
      // 同時備份到 localStorage（如果空間允許）
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedData))
      } catch {
        // localStorage 備份失敗不影響主流程
      }
      return
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error)
      // 降級到 localStorage
      currentStorageType = 'localStorage'
    }
  }

  // 降級到 localStorage
  if (currentStorageType === 'localStorage') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedData))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      throw error
    }
  }
}

/**
 * 從 localStorage 讀取數據（遷移用）
 */
function loadFromLocalStorage(): any | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * 從 localStorage 遷移到 IndexedDB
 */
async function migrateFromLocalStorageIfNeeded(): Promise<void> {
  // 檢查是否已經遷移過
  const migrated = localStorage.getItem(MIGRATED_FLAG_KEY)
  if (migrated === 'true') {
    return
  }

  console.log('🔄 Checking for data migration from localStorage to IndexedDB...')

  // 嘗試從 localStorage 讀取舊數據
  const oldData = loadFromLocalStorage()
  if (!oldData) {
    // 沒有舊數據，標記為已遷移
    localStorage.setItem(MIGRATED_FLAG_KEY, 'true')
    return
  }

  // 檢查 IndexedDB 中是否已有數據
  const existingData = await loadFromIndexedDB()
  if (existingData) {
    // IndexedDB 已有數據，不需要遷移
    localStorage.setItem(MIGRATED_FLAG_KEY, 'true')
    return
  }

  // 執行遷移
  try {
    console.log('📦 Migrating data from localStorage to IndexedDB...')
    await saveToIndexedDB(oldData)
    localStorage.setItem(MIGRATED_FLAG_KEY, 'true')
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    // 遷移失敗，下次再試
  }
}

/**
 * 讀取狀態（自動選擇 IndexedDB 或 localStorage）
 */
export async function loadFromStorage(): Promise<CubeState | null> {
  // 如果存儲系統還沒初始化，先初始化
  if (currentStorageType === 'none') {
    console.log('📂 Storage not initialized, initializing now...')
    await initializeStorage()
  }

  let data: any = null

  // 優先從 IndexedDB 讀取
  if (currentStorageType === 'indexedDB') {
    try {
      data = await loadFromIndexedDB()
      console.log('📂 Loaded from IndexedDB')
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error)
      // 降級到 localStorage
      currentStorageType = 'localStorage'
    }
  }

  // 降級到 localStorage
  if (!data && currentStorageType === 'localStorage') {
    data = loadFromLocalStorage()
    console.log('📂 Loaded from localStorage')
  }

  // 沒有數據
  if (!data) {
    console.log('📂 No data found in storage')
    return null
  }

  console.log('📂 Raw data from storage:', {
    fsrsCardsCount: data.fsrsCards?.length,
    dailySession: data.dailySession,
  })

  // 解析數據
  const parsed = parseStoredData(data)

  if (parsed) {
    console.log('📂 Parsed state:', {
      fsrsCardsCount: parsed.fsrsCards.length,
      dailySession: parsed.dailySession,
      learning_queue: parsed.dailySession.learning_queue.length,
      introduced_cards: parsed.dailySession.introduced_cards.length,
    })
  }

  return parsed
}

/**
 * 解析存儲的數據為 CubeState
 */
function parseStoredData(data: any): CubeState | null {
  try {
    if (!data.encoding?.corners || !data.encoding?.edges) {
      return null
    }

    const scramble = data.currentScramble ?? null
    const stickers = scramble ? applyScramble(scramble) : createSolvedState()
    const memo = scramble ? analyzeBlindsolve(stickers, data.encoding) : null
    const memoryWords = data.memoryWords ?? DEFAULT_MEMORY_WORDS

    // 處理 FSRS 卡片
    let fsrsCards: FSRSCard[]
    if (data.fsrsCards && Array.isArray(data.fsrsCards)) {
      fsrsCards = deserializeFSRSCards(data.fsrsCards)
      console.log('📋 Loaded FSRS cards from storage:', {
        total: fsrsCards.length,
        byState: {
          new: fsrsCards.filter(c => c.state === 'new').length,
          learning: fsrsCards.filter(c => c.state === 'learning').length,
          review: fsrsCards.filter(c => c.state === 'review').length,
          relearning: fsrsCards.filter(c => c.state === 'relearning').length,
        }
      })
    } else if (data.flashcards && isOldFormat(data.flashcards)) {
      console.log('🔄 Migrating from old flashcard format to FSRS...')
      fsrsCards = migrateDeckToFSRS(data.flashcards)
    } else {
      console.log('🆕 Initializing new FSRS cards')
      fsrsCards = initializeFSRSCards(memoryWords)
    }

    // 處理每日會話
    let dailySession: DailySession
    const today = new Date().toISOString().split('T')[0]

    if (data.dailySession) {
      dailySession = data.dailySession
      console.log('📅 Session date check:', {
        stored: dailySession.date,
        today: today,
        match: dailySession.date === today
      })

      if (dailySession.date !== today) {
        console.log('🔄 New day detected, resetting daily session (learning queue and introduced cards will be cleared)')
        dailySession = {
          date: today,
          new_cards_today: 0,
          new_cards_limit: dailySession.new_cards_limit || 10,
          reviews_completed: 0,
          learning_queue: [],
          introduced_cards: [],
          session_start: Date.now()
        }
      } else {
        console.log('✅ Same day, preserving session:', {
          learning_queue: dailySession.learning_queue.length,
          introduced_cards: dailySession.introduced_cards.length,
        })
      }
    } else {
      console.log('🆕 No session data, creating new session')
      dailySession = {
        date: today,
        new_cards_today: 0,
        new_cards_limit: 10,
        reviews_completed: 0,
        learning_queue: [],
        introduced_cards: [],
        session_start: Date.now()
      }
    }

    return {
      encoding: data.encoding,
      labelMode: data.labelMode ?? 'all',
      layoutMode: data.layoutMode ?? 'balanced',
      currentScramble: scramble,
      cubeStickers: stickers,
      memo,
      memoryWords,
      flashcards: data.flashcards ?? initializeFlashcards(memoryWords),
      fsrsCards,
      dailySession,
    }
  } catch (error) {
    console.error('Failed to parse stored data:', error)
    return null
  }
}

/**
 * 清除所有存儲數據
 */
export async function clearStorage(): Promise<void> {
  // 清除 IndexedDB
  if (isIndexedDBSupported()) {
    try {
      await clearIndexedDB()
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error)
    }
  }

  // 清除 localStorage
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(MIGRATED_FLAG_KEY)
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

/**
 * 導出學習進度為 JSON 文件
 */
export function exportProgress(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      throw new Error('No data to export')
    }

    const data = JSON.parse(stored)
    return JSON.stringify({
      ...data,
      exportedAt: new Date().toISOString(),
      exportVersion: '2.0.0'
    }, null, 2)
  } catch (error) {
    console.error('Failed to export progress:', error)
    throw error
  }
}

/**
 * 從 JSON 導入學習進度
 */
export async function importProgress(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString)

    // 驗證數據格式
    if (!data.encoding || !data.memoryWords) {
      throw new Error('Invalid data format')
    }

    // 保存到存儲
    if (currentStorageType === 'indexedDB') {
      await saveToIndexedDB(data)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }

    return true
  } catch (error) {
    console.error('Failed to import progress:', error)
    return false
  }
}

/**
 * 下載 JSON 文件
 */
export function downloadJSON(jsonString: string, filename: string = 'cube-trainer-backup.json'): void {
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 讀取 JSON 文件
 */
export function readJSONFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
