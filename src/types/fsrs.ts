// FSRS-4.5 (Free Spaced Repetition Scheduler) 算法實現
// 基於 Anki v23.10+ 使用的間隔重複算法
// 參考：https://github.com/open-spaced-repetition/fsrs4anki

// ==================== 類型定義 ====================

export type Rating = 1 | 2 | 3 | 4  // Again | Hard | Good | Easy
export type State = 'new' | 'learning' | 'review' | 'relearning'

export interface FSRSCard {
  // 基本資訊
  id: string
  code1: string
  code2: string
  word: string

  // FSRS 核心狀態
  state: State
  due: Date              // 到期時間
  stability: number      // 記憶穩定性 (S)
  difficulty: number     // 卡片難度 (D, 1-10)
  elapsed_days: number   // 自上次復習經過的天數
  scheduled_days: number // 計劃間隔天數
  reps: number          // 復習次數
  lapses: number        // 遺忘次數（選 Again 的次數）

  // 學習狀態
  last_review: Date     // 上次復習時間

  // 元數據
  introduced_date: string  // 首次學習日期 (YYYY-MM-DD)
}

export interface FSRSParameters {
  // 17 個 FSRS 參數（使用官方推薦的默認值）
  request_retention: number      // 目標記憶保持率 (0.9 = 90%)
  maximum_interval: number       // 最大間隔天數
  w: number[]                    // 19 個權重參數
}

export interface ReviewLog {
  rating: Rating
  state: State
  due: Date
  stability: number
  difficulty: number
  elapsed_days: number
  last_elapsed_days: number
  scheduled_days: number
  review: Date
}

export interface SchedulingInfo {
  card: FSRSCard
  review_log: ReviewLog
}

export interface SchedulingCards {
  again: SchedulingInfo
  hard: SchedulingInfo
  good: SchedulingInfo
  easy: SchedulingInfo
}

// ==================== FSRS 參數 ====================

// 官方推薦的默認參數（基於百萬用戶數據優化）
export const DEFAULT_PARAMETERS: FSRSParameters = {
  request_retention: 0.9,      // 90% 記憶保持率
  maximum_interval: 36500,     // 100 年（實際上沒有上限）
  w: [
    0.4072, 1.1829, 3.1262, 15.4722, 7.2102,
    0.5316, 1.0651, 0.0234, 1.616, 0.1544,
    1.0824, 1.9813, 0.0953, 0.2975, 2.2042,
    0.2407, 2.9466, 0.5034, 0.6567
  ]
}

// 學習步驟（分鐘）
export const LEARNING_STEPS = [1, 10]  // 1分鐘，10分鐘
export const RELEARNING_STEPS = [1]   // 重新學習：1分鐘

// ==================== 核心算法函數 ====================

/**
 * 計算初始難度（首次學習時）
 */
export function init_difficulty(rating: Rating, w: number[]): number {
  const difficulty = w[4] - (rating - 3) * w[5]
  return constrain_difficulty(difficulty)
}

/**
 * 計算初始穩定性（首次學習時）
 */
export function init_stability(rating: Rating, w: number[]): number {
  const stability = w[rating - 1]
  if (typeof stability !== 'number' || isNaN(stability) || !isFinite(stability)) {
    console.error('Invalid stability from weights:', { rating, w_value: stability, w })
    return 0.1
  }
  return Math.max(stability, 0.1)
}

/**
 * 遺忘曲線：計算記憶提取率 R
 * R = 0.9^(t/S)
 * 其中 t = 經過的天數，S = 穩定性
 */
export function forgetting_curve(elapsed_days: number, stability: number): number {
  if (typeof stability !== 'number' || isNaN(stability) || stability === 0 || !isFinite(stability)) {
    console.error('Invalid stability in forgetting_curve:', stability)
    return 0.9 // 默認提取率
  }
  if (typeof elapsed_days !== 'number' || isNaN(elapsed_days) || !isFinite(elapsed_days)) {
    console.error('Invalid elapsed_days in forgetting_curve:', elapsed_days)
    elapsed_days = 0
  }

  const result = Math.pow(0.9, elapsed_days / stability)

  if (isNaN(result) || !isFinite(result)) {
    console.error('forgetting_curve produced invalid result:', { elapsed_days, stability, result })
    return 0.9
  }

  return result
}

/**
 * 計算下一個難度
 */
export function next_difficulty(d: number, rating: Rating, w: number[]): number {
  const delta_d = -w[6] * (rating - 3)
  const next_d = d + delta_d
  return constrain_difficulty(mean_reversion(w[4], next_d, w[7]))
}

/**
 * 計算下一個穩定性（學習/重新學習階段）
 */
export function next_stability_from_learning(
  s: number,
  rating: Rating,
  w: number[]
): number {
  if (typeof s !== 'number' || isNaN(s) || !isFinite(s) || s <= 0) {
    console.error('Invalid stability in next_stability_from_learning:', s)
    return 0.1
  }

  const hard_penalty = rating === 2 ? w[15] : 1
  const easy_bonus = rating === 4 ? w[16] : 1
  const result = s * Math.exp(w[17] * (rating - 3 + w[18])) * hard_penalty * easy_bonus

  if (isNaN(result) || !isFinite(result) || result <= 0) {
    console.error('next_stability_from_learning produced invalid result:', { s, rating, result, w })
    return Math.max(s, 0.1)
  }

  return result
}

/**
 * 計算下一個穩定性（復習階段）
 */
export function next_stability_from_review(
  d: number,
  s: number,
  r: number,
  rating: Rating,
  w: number[]
): number {
  // 驗證輸入
  if (typeof s !== 'number' || isNaN(s) || !isFinite(s) || s <= 0) {
    console.error('Invalid stability in next_stability_from_review:', s)
    return 0.1
  }
  if (typeof d !== 'number' || isNaN(d) || !isFinite(d)) {
    console.error('Invalid difficulty in next_stability_from_review:', d)
    d = 5 // 使用默認難度
  }
  if (typeof r !== 'number' || isNaN(r) || !isFinite(r)) {
    console.error('Invalid retrievability in next_stability_from_review:', r)
    r = 0.9 // 使用默認提取率
  }

  const hard_penalty = rating === 2 ? w[15] : 1
  const easy_bonus = rating === 4 ? w[16] : 1

  let next_s = s * (
    1 +
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp((1 - r) * w[10]) - 1) *
    hard_penalty *
    easy_bonus
  )

  if (isNaN(next_s) || !isFinite(next_s) || next_s <= 0) {
    console.error('Calculated next_stability is invalid:', { d, s, r, rating, next_s, w })
    return Math.max(s, 0.1) // fallback 到當前 stability
  }

  return next_s
}

/**
 * 計算下次復習間隔（天數）
 * 公式：interval = S * (R^(1/D) - 1)
 * 其中 S = stability, R = request_retention, D = decay (w[10])
 */
export function next_interval(s: number, request_retention: number, w: number[]): number {
  // 驗證輸入
  if (typeof s !== 'number' || isNaN(s) || !isFinite(s) || s <= 0) {
    console.error('Invalid stability in next_interval:', s)
    return 1
  }
  if (typeof w[10] !== 'number' || isNaN(w[10]) || w[10] === 0 || !isFinite(w[10])) {
    console.error('Invalid w[10] in next_interval:', w[10])
    return 1
  }
  if (typeof request_retention !== 'number' || isNaN(request_retention) || request_retention <= 0 || request_retention >= 1) {
    console.error('Invalid request_retention in next_interval:', request_retention)
    request_retention = 0.9
  }

  // FSRS 間隔公式：interval = S * (R^(1/D) - 1)
  const new_interval = s * (Math.pow(request_retention, 1 / w[10]) - 1)

  if (isNaN(new_interval) || !isFinite(new_interval)) {
    console.error('Calculated interval is NaN or infinite:', { s, request_retention, w10: w[10], new_interval })
    return 1
  }

  return Math.max(1, Math.round(new_interval))
}

/**
 * 限制難度在 1-10 之間
 */
function constrain_difficulty(difficulty: number): number {
  return Math.min(Math.max(difficulty, 1), 10)
}

/**
 * 均值回歸（難度會逐漸回歸到初始難度）
 */
function mean_reversion(init: number, current: number, factor: number): number {
  return factor * init + (1 - factor) * current
}

/**
 * 添加 Fuzz（隨機變化，避免卡片同時到期）
 */
export function apply_fuzz(interval: number): number {
  if (interval < 2.5) return interval

  const min_ivl = Math.max(2, Math.round(interval * 0.95))
  const max_ivl = Math.round(interval * 1.05)

  return Math.floor(Math.random() * (max_ivl - min_ivl + 1)) + min_ivl
}

// ==================== FSRS 調度器類 ====================

export class FSRS {
  private p: FSRSParameters

  constructor(parameters?: Partial<FSRSParameters>) {
    this.p = { ...DEFAULT_PARAMETERS, ...parameters }
  }

  /**
   * 創建一張新卡片
   */
  create_card(id: string, code1: string, code2: string, word: string): FSRSCard {
    const now = new Date()
    return {
      id,
      code1,
      code2,
      word,
      state: 'new',
      due: now,
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      last_review: now,
      introduced_date: this.format_date(now)
    }
  }

  /**
   * 重複卡片（生成 4 個選項的排程結果）
   */
  repeat(card: FSRSCard, now: Date): SchedulingCards {
    // 驗證輸入
    if (!(now instanceof Date) || isNaN(now.getTime())) {
      console.error('Invalid now date passed to repeat:', now)
      now = new Date()
    }

    card = { ...card }

    if (card.state === 'new') {
      card.elapsed_days = 0
    } else {
      card.elapsed_days = Math.max(0, this.diff_days(card.last_review, now))
    }

    card.last_review = now
    card.reps += 1

    const s = card.state

    // 根據當前狀態生成 4 個選項
    const again = this.schedule_again(card, now)
    const hard = this.schedule_hard(card, now, s)
    const good = this.schedule_good(card, now, s)
    const easy = this.schedule_easy(card, now, s)

    return { again, hard, good, easy }
  }

  /**
   * Again 按鈕的排程
   */
  private schedule_again(card: FSRSCard, now: Date): SchedulingInfo {
    const new_card = { ...card }
    new_card.scheduled_days = 0
    new_card.due = this.add_minutes(now, RELEARNING_STEPS[0])

    if (card.state === 'new') {
      new_card.difficulty = init_difficulty(1, this.p.w)
      new_card.stability = init_stability(1, this.p.w)
      new_card.state = 'learning'
    } else {
      new_card.difficulty = next_difficulty(card.difficulty, 1, this.p.w)
      new_card.stability = next_stability_from_learning(card.stability, 1, this.p.w)
      new_card.state = 'relearning'
      new_card.lapses += 1
    }

    return {
      card: new_card,
      review_log: this.create_review_log(new_card, 1, now)
    }
  }

  /**
   * Hard 按鈕的排程
   */
  private schedule_hard(card: FSRSCard, now: Date, old_state: State): SchedulingInfo {
    const new_card = { ...card }

    if (old_state === 'new' || old_state === 'learning' || old_state === 'relearning') {
      // 學習階段：Hard 使用第一個學習步驟
      new_card.scheduled_days = 0
      new_card.due = this.add_minutes(now, LEARNING_STEPS[0])
      new_card.difficulty = init_difficulty(2, this.p.w)
      new_card.stability = init_stability(2, this.p.w)
      new_card.state = old_state === 'new' ? 'learning' : old_state
    } else {
      // 復習階段
      const r = forgetting_curve(card.elapsed_days, card.stability)
      new_card.difficulty = next_difficulty(card.difficulty, 2, this.p.w)
      new_card.stability = next_stability_from_review(card.difficulty, card.stability, r, 2, this.p.w)

      let interval = next_interval(new_card.stability, this.p.request_retention, this.p.w)
      interval = Math.min(interval, Math.round(card.scheduled_days * 1.2))  // Hard 不超過 1.2 倍
      interval = Math.max(interval, 1)

      new_card.scheduled_days = interval
      new_card.due = this.add_days(now, interval)
      new_card.state = 'review'
    }

    return {
      card: new_card,
      review_log: this.create_review_log(new_card, 2, now)
    }
  }

  /**
   * Good 按鈕的排程
   */
  private schedule_good(card: FSRSCard, now: Date, old_state: State): SchedulingInfo {
    const new_card = { ...card }

    if (old_state === 'new' || old_state === 'learning' || old_state === 'relearning') {
      // 學習階段：Good 畢業到復習
      new_card.difficulty = init_difficulty(3, this.p.w)
      new_card.stability = init_stability(3, this.p.w)

      const interval = next_interval(new_card.stability, this.p.request_retention, this.p.w)
      new_card.scheduled_days = interval
      new_card.due = this.add_days(now, interval)
      new_card.state = 'review'
    } else {
      // 復習階段
      const r = forgetting_curve(card.elapsed_days, card.stability)
      new_card.difficulty = next_difficulty(card.difficulty, 3, this.p.w)
      new_card.stability = next_stability_from_review(card.difficulty, card.stability, r, 3, this.p.w)

      const interval = next_interval(new_card.stability, this.p.request_retention, this.p.w)
      new_card.scheduled_days = interval
      new_card.due = this.add_days(now, interval)
      new_card.state = 'review'
    }

    return {
      card: new_card,
      review_log: this.create_review_log(new_card, 3, now)
    }
  }

  /**
   * Easy 按鈕的排程
   */
  private schedule_easy(card: FSRSCard, now: Date, old_state: State): SchedulingInfo {
    const new_card = { ...card }

    if (old_state === 'new' || old_state === 'learning' || old_state === 'relearning') {
      // 學習階段：Easy 直接畢業，間隔更長
      new_card.difficulty = init_difficulty(4, this.p.w)
      new_card.stability = init_stability(4, this.p.w)

      let interval = next_interval(new_card.stability, this.p.request_retention, this.p.w)
      interval = Math.max(interval, 4)  // Easy 至少 4 天

      new_card.scheduled_days = interval
      new_card.due = this.add_days(now, interval)
      new_card.state = 'review'
    } else {
      // 復習階段
      const r = forgetting_curve(card.elapsed_days, card.stability)
      new_card.difficulty = next_difficulty(card.difficulty, 4, this.p.w)
      new_card.stability = next_stability_from_review(card.difficulty, card.stability, r, 4, this.p.w)

      let interval = next_interval(new_card.stability, this.p.request_retention, this.p.w)
      interval = Math.max(interval, Math.round(card.scheduled_days * 1.3))  // Easy 至少 1.3 倍

      new_card.scheduled_days = interval
      new_card.due = this.add_days(now, interval)
      new_card.state = 'review'
    }

    return {
      card: new_card,
      review_log: this.create_review_log(new_card, 4, now)
    }
  }

  /**
   * 創建復習記錄
   */
  private create_review_log(card: FSRSCard, rating: Rating, now: Date): ReviewLog {
    return {
      rating,
      state: card.state,
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      last_elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      review: now
    }
  }

  // ==================== 工具函數 ====================

  private diff_days(from: Date, to: Date): number {
    const diff = to.getTime() - from.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  private add_days(date: Date, days: number): Date {
    // 驗證輸入
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid date passed to add_days:', date)
      date = new Date()
    }
    if (typeof days !== 'number' || isNaN(days) || !isFinite(days)) {
      console.error('Invalid days passed to add_days:', days)
      days = 1
    }

    const result = new Date(date)
    result.setDate(result.getDate() + days)

    // 驗證結果
    if (isNaN(result.getTime())) {
      console.error('add_days produced invalid date:', { date, days, result })
      return new Date()
    }

    return result
  }

  private add_minutes(date: Date, minutes: number): Date {
    // 驗證輸入
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid date passed to add_minutes:', date)
      date = new Date()
    }
    if (typeof minutes !== 'number' || isNaN(minutes) || !isFinite(minutes)) {
      console.error('Invalid minutes passed to add_minutes:', minutes)
      minutes = 10
    }

    const result = new Date(date)
    result.setMinutes(result.getMinutes() + minutes)

    // 驗證結果
    if (isNaN(result.getTime())) {
      console.error('add_minutes produced invalid date:', { date, minutes, result })
      return new Date()
    }

    return result
  }

  private format_date(date: Date): string {
    return date.toISOString().split('T')[0]
  }
}

// ==================== 輔助函數 ====================

/**
 * 獲取到期的卡片（需要復習的）
 */
export function get_due_cards(cards: FSRSCard[], now: Date = new Date()): FSRSCard[] {
  return cards.filter(card => card.due <= now)
}

/**
 * 獲取新卡片
 */
export function get_new_cards(cards: FSRSCard[]): FSRSCard[] {
  return cards.filter(card => card.state === 'new')
}

/**
 * 獲取學習中的卡片
 */
export function get_learning_cards(cards: FSRSCard[]): FSRSCard[] {
  return cards.filter(card => card.state === 'learning' || card.state === 'relearning')
}

/**
 * 獲取復習中的卡片
 */
export function get_review_cards(cards: FSRSCard[]): FSRSCard[] {
  return cards.filter(card => card.state === 'review')
}

/**
 * 格式化間隔時間顯示
 */
export function format_interval(days: number, minutes?: number): string {
  if (minutes !== undefined && minutes < 60) {
    return `${minutes}分鐘`
  }
  if (days < 1) return '少於1天'
  if (days === 1) return '1天'
  if (days < 30) return `${days}天`
  if (days < 365) return `${Math.round(days / 30)}個月`
  return `${Math.round(days / 365)}年`
}
