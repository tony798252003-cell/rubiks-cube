// 每日學習會話管理系統
// 實現「每天10張新卡片」的學習機制

import { FSRSCard, get_due_cards, get_learning_cards, get_new_cards } from './fsrs'

// ==================== 類型定義 ====================

export interface DailySession {
  date: string                    // YYYY-MM-DD
  new_cards_today: number        // 今天已學習的新卡片數
  new_cards_limit: number        // 每日新卡片上限（默認10）
  reviews_completed: number       // 今天完成的復習數
  learning_queue: string[]        // 當前學習隊列中的卡片ID
  session_start: number          // 會話開始時間戳
}

export interface DailyStats {
  due_count: number              // 到期需復習的卡片數
  new_count: number              // 可學習的新卡片數（考慮每日限額）
  learning_count: number         // 學習隊列中的卡片數
  total_new: number              // 總新卡片數
  total_review: number           // 總復習卡片數
  new_cards_today: number        // 今天已學習的新卡片數
  new_cards_remaining: number    // 今天還能學習的新卡片數
  completed_today: boolean       // 今天是否已完成所有任務
}

// ==================== 會話管理類 ====================

export class SessionManager {
  private session: DailySession

  constructor(session?: DailySession) {
    const today = this.get_today()
    this.session = session || this.create_new_session(today)

    // 檢查是否需要重置（新的一天）
    if (this.session.date !== today) {
      this.reset_for_new_day(today)
    }
  }

  /**
   * 獲取當前會話
   */
  get_session(): DailySession {
    return { ...this.session }
  }

  /**
   * 獲取今日統計
   */
  get_daily_stats(cards: FSRSCard[]): DailyStats {
    const now = new Date()
    const due_cards = get_due_cards(cards, now)
    const learning_cards = get_learning_cards(cards)
    const new_cards = get_new_cards(cards)
    const review_cards = cards.filter(c => c.state === 'review')

    const new_cards_remaining = Math.max(
      0,
      this.session.new_cards_limit - this.session.new_cards_today
    )

    const completed_today = (
      due_cards.length === 0 &&
      learning_cards.length === 0 &&
      new_cards_remaining === 0
    )

    return {
      due_count: due_cards.length,
      new_count: Math.min(new_cards.length, new_cards_remaining),
      learning_count: learning_cards.length,
      total_new: new_cards.length,
      total_review: review_cards.length,
      new_cards_today: this.session.new_cards_today,
      new_cards_remaining,
      completed_today
    }
  }

  /**
   * 記錄學習了一張新卡片
   */
  record_new_card(card_id: string): void {
    this.session.new_cards_today += 1
    this.add_to_learning_queue(card_id)
  }

  /**
   * 記錄完成了一次復習
   */
  record_review(): void {
    this.session.reviews_completed += 1
  }

  /**
   * 添加卡片到學習隊列
   */
  add_to_learning_queue(card_id: string): void {
    if (!this.session.learning_queue.includes(card_id)) {
      this.session.learning_queue.push(card_id)
    }
  }

  /**
   * 從學習隊列移除卡片（畢業時）
   */
  remove_from_learning_queue(card_id: string): void {
    this.session.learning_queue = this.session.learning_queue.filter(
      id => id !== card_id
    )
  }

  /**
   * 檢查卡片是否在學習隊列中
   */
  is_in_learning_queue(card_id: string): boolean {
    return this.session.learning_queue.includes(card_id)
  }

  /**
   * 檢查今天是否還能學習新卡片
   */
  can_learn_new_cards(): boolean {
    return this.session.new_cards_today < this.session.new_cards_limit
  }

  /**
   * 設置每日新卡片上限
   */
  set_new_cards_limit(limit: number): void {
    this.session.new_cards_limit = Math.max(1, limit)
  }

  /**
   * 清空學習隊列（用於調試）
   */
  clear_learning_queue(): void {
    this.session.learning_queue = []
  }

  /**
   * 序列化為 JSON（用於持久化）
   */
  to_json(): string {
    return JSON.stringify(this.session)
  }

  /**
   * 從 JSON 反序列化
   */
  static from_json(json: string): SessionManager {
    try {
      const session = JSON.parse(json) as DailySession
      return new SessionManager(session)
    } catch (e) {
      console.error('Failed to parse session JSON:', e)
      return new SessionManager()
    }
  }

  // ==================== 私有方法 ====================

  private create_new_session(date: string): DailySession {
    return {
      date,
      new_cards_today: 0,
      new_cards_limit: 10,
      reviews_completed: 0,
      learning_queue: [],
      session_start: Date.now()
    }
  }

  private reset_for_new_day(new_date: string): void {
    // 保留設定，重置計數和隊列
    this.session = {
      date: new_date,
      new_cards_today: 0,
      new_cards_limit: this.session.new_cards_limit,
      reviews_completed: 0,
      learning_queue: [],  // 新的一天，清空學習隊列
      session_start: Date.now()
    }
  }

  private get_today(): string {
    const now = new Date()
    return now.toISOString().split('T')[0]  // YYYY-MM-DD
  }
}

// ==================== 智能選卡函數 ====================

export interface CardSelectionResult {
  card: FSRSCard | null
  reason: 'review' | 'learning' | 'new' | 'none'
  message: string
}

/**
 * 智能選擇下一張需要學習的卡片
 * 優先級：復習到期 > 學習隊列 > 新卡片
 */
export function select_next_card(
  cards: FSRSCard[],
  session: SessionManager
): CardSelectionResult {
  const now = new Date()

  // 1. 優先返回到期的復習卡片
  const due_cards = get_due_cards(cards, now).filter(c => c.state === 'review')
  if (due_cards.length > 0) {
    // 按照到期時間排序，最早到期的優先
    due_cards.sort((a, b) => a.due.getTime() - b.due.getTime())
    return {
      card: due_cards[0],
      reason: 'review',
      message: `復習到期的卡片（還有 ${due_cards.length - 1} 張）`
    }
  }

  // 2. 返回學習隊列中到期的卡片
  const learning_cards = get_due_cards(cards, now).filter(
    c => (c.state === 'learning' || c.state === 'relearning') &&
         session.is_in_learning_queue(c.id)
  )
  if (learning_cards.length > 0) {
    // 按照到期時間排序
    learning_cards.sort((a, b) => a.due.getTime() - b.due.getTime())
    return {
      card: learning_cards[0],
      reason: 'learning',
      message: `學習隊列中的卡片（還有 ${learning_cards.length - 1} 張）`
    }
  }

  // 3. 如果還能學習新卡片，返回新卡片
  if (session.can_learn_new_cards()) {
    const new_cards = get_new_cards(cards)
    if (new_cards.length > 0) {
      // 隨機選擇一張新卡片（避免總是按相同順序）
      const random_index = Math.floor(Math.random() * new_cards.length)
      const selected = new_cards[random_index]

      // 記錄這張新卡片
      session.record_new_card(selected.id)

      return {
        card: selected,
        reason: 'new',
        message: `新卡片 ${session.get_session().new_cards_today}/${session.get_session().new_cards_limit}`
      }
    }
  }

  // 4. 沒有任何卡片可學習
  const stats = session.get_daily_stats(cards)

  if (stats.completed_today) {
    return {
      card: null,
      reason: 'none',
      message: '🎉 今日學習完成！明天見！'
    }
  } else if (!session.can_learn_new_cards() && learning_cards.length === 0) {
    return {
      card: null,
      reason: 'none',
      message: '今日新卡片已學完，請稍後復習學習隊列中的卡片'
    }
  } else {
    return {
      card: null,
      reason: 'none',
      message: '暫時沒有到期的卡片'
    }
  }
}

/**
 * 批量選擇卡片（用於預覽接下來的卡片）
 */
export function select_next_cards(
  cards: FSRSCard[],
  session: SessionManager,
  count: number = 10
): FSRSCard[] {
  const selected: FSRSCard[] = []
  const temp_session = new SessionManager(session.get_session())
  const temp_cards = [...cards]

  for (let i = 0; i < count; i++) {
    const result = select_next_card(temp_cards, temp_session)
    if (!result.card) break

    selected.push(result.card)

    // 從臨時列表中移除已選擇的卡片
    const index = temp_cards.findIndex(c => c.id === result.card!.id)
    if (index !== -1) {
      temp_cards.splice(index, 1)
    }
  }

  return selected
}
