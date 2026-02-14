// FSRS 數據遷移工具 - 從舊的 SM-2 系統遷移到 FSRS

import { FSRSCard, FSRS } from './fsrs'
import { Flashcard, FlashcardDeck } from './flashcard'

/**
 * 將舊的 Flashcard 遷移到新的 FSRSCard
 */
export function migrateFlashcardToFSRS(oldCard: Flashcard, fsrs: FSRS): FSRSCard {
  const now = new Date()

  // 創建基本的 FSRS 卡片
  const newCard = fsrs.create_card(
    oldCard.id,
    oldCard.code1,
    oldCard.code2,
    oldCard.word
  )

  // 根據舊卡片的復習歷史推斷狀態
  if (oldCard.reviewCount === 0) {
    // 新卡片
    newCard.state = 'new'
    newCard.due = now
  } else if (oldCard.reviewCount < 3) {
    // 學習中
    newCard.state = 'learning'
    newCard.reps = oldCard.reviewCount
    newCard.stability = Math.max(oldCard.interval / 1440, 0.1) // 將分鐘轉為天
    newCard.difficulty = 5 // 默認中等難度
    newCard.due = new Date(oldCard.nextReviewDate)
  } else {
    // 復習中
    newCard.state = 'review'
    newCard.reps = oldCard.reviewCount
    newCard.stability = Math.max(oldCard.interval / 1440, 1) // 將分鐘轉為天
    newCard.difficulty = 5 // 默認中等難度
    newCard.due = new Date(oldCard.nextReviewDate)
    newCard.scheduled_days = Math.round(oldCard.interval / 1440)
  }

  newCard.last_review = new Date(oldCard.lastReviewed || now)

  // 計算 elapsed_days
  if (oldCard.lastReviewed > 0) {
    const diff = now.getTime() - oldCard.lastReviewed
    newCard.elapsed_days = Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  return newCard
}

/**
 * 將整個 FlashcardDeck 遷移到 FSRSCard 數組
 */
export function migrateDeckToFSRS(oldDeck: FlashcardDeck): FSRSCard[] {
  const fsrs = new FSRS()
  const cards: FSRSCard[] = []

  for (const oldCard of Object.values(oldDeck)) {
    cards.push(migrateFlashcardToFSRS(oldCard, fsrs))
  }

  return cards
}

/**
 * 從記憶字典初始化 FSRS 卡片
 */
export function initializeFSRSCards(
  memoryWords: Record<string, string>
): FSRSCard[] {
  const fsrs = new FSRS()
  const cards: FSRSCard[] = []

  for (const [key, word] of Object.entries(memoryWords)) {
    if (word && word !== '未定' && key.length === 2) {
      const code1 = key[0]
      const code2 = key[1]
      cards.push(fsrs.create_card(key, code1, code2, word))
    }
  }

  return cards
}

/**
 * 檢測是否為舊格式的數據
 */
export function isOldFormat(data: any): data is FlashcardDeck {
  if (!data || typeof data !== 'object') return false

  const firstKey = Object.keys(data)[0]
  if (!firstKey) return false

  const firstItem = data[firstKey]

  // 舊格式有 nextReviewDate 和 interval (number)
  // 新格式有 due (Date) 和 stability
  return (
    'nextReviewDate' in firstItem &&
    typeof firstItem.interval === 'number' &&
    !('stability' in firstItem)
  )
}

/**
 * 檢測是否為新格式的數據
 */
export function isNewFormat(data: any): data is FSRSCard[] {
  if (!Array.isArray(data)) return false
  if (data.length === 0) return true

  const firstItem = data[0]
  return (
    'stability' in firstItem &&
    'difficulty' in firstItem &&
    'state' in firstItem
  )
}
