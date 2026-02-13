// 記憶卡片系統 - 類似 Anki 的間隔重複演算法

export type Familiarity = 'unfamiliar' | 'okay' | 'familiar'

// 單張記憶卡
export interface Flashcard {
  id: string              // 卡片 ID (例如 "ㄎㄊ")
  code1: string          // 第一個編碼
  code2: string          // 第二個編碼
  word: string           // 記憶字
  nextReviewDate: number // 下次複習時間（毫秒時間戳）
  interval: number       // 當前間隔（分鐘）
  reviewCount: number    // 複習次數
  lastReviewed: number   // 上次複習時間
}

// 卡片集合
export type FlashcardDeck = Record<string, Flashcard>

// 根據熟悉度計算下次複習間隔（分鐘）
export function calculateNextInterval(
  currentInterval: number,
  familiarity: Familiarity,
  reviewCount: number
): number {
  // 簡化版的 SM-2 演算法
  switch (familiarity) {
    case 'unfamiliar':
      // 不熟：立即重新出現（1分鐘）
      return 1

    case 'okay':
      // 還好：適度增加間隔
      if (reviewCount === 0) return 10      // 第一次：10分鐘
      if (reviewCount === 1) return 60      // 第二次：1小時
      return Math.min(currentInterval * 1.5, 1440)  // 最多1天

    case 'familiar':
      // 熟悉：大幅增加間隔
      if (reviewCount === 0) return 60      // 第一次：1小時
      if (reviewCount === 1) return 240     // 第二次：4小時
      if (reviewCount === 2) return 1440    // 第三次：1天
      if (reviewCount === 3) return 4320    // 第四次：3天
      if (reviewCount === 4) return 10080   // 第五次：7天
      return Math.min(currentInterval * 2, 43200)  // 最多30天
  }
}

// 更新卡片狀態
export function updateFlashcard(
  card: Flashcard,
  familiarity: Familiarity
): Flashcard {
  const now = Date.now()
  const newInterval = calculateNextInterval(
    card.interval,
    familiarity,
    card.reviewCount
  )

  return {
    ...card,
    interval: newInterval,
    nextReviewDate: now + newInterval * 60 * 1000, // 轉換為毫秒
    reviewCount: card.reviewCount + 1,
    lastReviewed: now,
  }
}

// 獲取到期的卡片（需要複習的）
export function getDueCards(deck: FlashcardDeck): Flashcard[] {
  const now = Date.now()
  return Object.values(deck).filter(card => card.nextReviewDate <= now)
}

// 從記憶字典初始化卡片集
export function initializeFlashcards(
  memoryWords: Record<string, string>
): FlashcardDeck {
  const deck: FlashcardDeck = {}
  const now = Date.now()

  for (const [key, word] of Object.entries(memoryWords)) {
    if (word && word !== '未定' && key.length === 2) {
      const code1 = key[0]
      const code2 = key[1]

      deck[key] = {
        id: key,
        code1,
        code2,
        word,
        nextReviewDate: now, // 初始全部可複習
        interval: 0,
        reviewCount: 0,
        lastReviewed: 0,
      }
    }
  }

  return deck
}

// 隨機選擇一張卡片（優先選擇到期的）
export function selectCard(deck: FlashcardDeck): Flashcard | null {
  // 先嘗試獲取到期的卡片
  const dueCards = getDueCards(deck)

  if (dueCards.length > 0) {
    // 隨機選擇一張到期的卡片
    return dueCards[Math.floor(Math.random() * dueCards.length)]
  }

  // 如果沒有到期的，隨機選擇任意卡片
  const allCards = Object.values(deck)
  if (allCards.length === 0) return null

  return allCards[Math.floor(Math.random() * allCards.length)]
}

// 獲取統計資訊
export interface DeckStats {
  total: number           // 總卡片數
  new: number            // 新卡片（未複習過）
  learning: number       // 學習中（複習次數 < 3）
  reviewing: number      // 複習中（複習次數 >= 3）
  due: number            // 到期需複習
}

export function getDeckStats(deck: FlashcardDeck): DeckStats {
  const cards = Object.values(deck)
  const now = Date.now()

  return {
    total: cards.length,
    new: cards.filter(c => c.reviewCount === 0).length,
    learning: cards.filter(c => c.reviewCount > 0 && c.reviewCount < 3).length,
    reviewing: cards.filter(c => c.reviewCount >= 3).length,
    due: cards.filter(c => c.nextReviewDate <= now).length,
  }
}
