import { useState, useMemo } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { FSRS, Rating, SchedulingCards, format_interval } from '../types/fsrs'
import { SessionManager, select_next_card, CardSelectionResult } from '../types/dailySession'
import './FlashcardPractice.css'

export function FlashcardPractice() {
  const { state, dispatch } = useCubeContext()
  const [showModal, setShowModal] = useState(false)
  const [selectionResult, setSelectionResult] = useState<CardSelectionResult | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [schedulingCards, setSchedulingCards] = useState<SchedulingCards | null>(null)

  // 初始化 FSRS 和 SessionManager
  const fsrs = useMemo(() => new FSRS(), [])
  const sessionManager = useMemo(
    () => new SessionManager(state.dailySession),
    [state.dailySession]
  )

  // 計算統計
  const stats = useMemo(
    () => sessionManager.get_daily_stats(state.fsrsCards),
    [state.fsrsCards, sessionManager]
  )

  // 開始練習
  const startPractice = () => {
    const result = select_next_card(state.fsrsCards, sessionManager)
    setSelectionResult(result)

    if (result.card) {
      // 生成 4 個選項的排程結果
      const now = new Date()
      const scheduling = fsrs.repeat(result.card, now)
      setSchedulingCards(scheduling)
      setShowAnswer(false)
      setShowModal(true)
    } else {
      // 沒有卡片可學習，顯示提示
      alert(result.message)
    }
  }

  // 處理評分
  const handleRating = (rating: Rating) => {
    if (!selectionResult?.card || !schedulingCards) return

    // 根據評分選擇對應的排程結果
    let selectedScheduling
    switch (rating) {
      case 1:
        selectedScheduling = schedulingCards.again
        break
      case 2:
        selectedScheduling = schedulingCards.hard
        break
      case 3:
        selectedScheduling = schedulingCards.good
        break
      case 4:
        selectedScheduling = schedulingCards.easy
        break
    }

    const updatedCard = selectedScheduling.card

    // 更新會話狀態
    if (selectionResult.reason === 'review') {
      sessionManager.record_review()
    }

    // 如果卡片畢業到 review 狀態，從學習隊列移除
    if (updatedCard.state === 'review') {
      sessionManager.remove_from_learning_queue(updatedCard.id)
    } else if (updatedCard.state === 'learning' || updatedCard.state === 'relearning') {
      sessionManager.add_to_learning_queue(updatedCard.id)
    }

    // 更新卡片到 state
    dispatch({
      type: 'UPDATE_FSRS_CARD',
      payload: updatedCard
    })

    // 更新會話
    dispatch({
      type: 'UPDATE_DAILY_SESSION',
      payload: sessionManager.get_session()
    })

    // 短暫延遲後選擇下一張卡片
    setTimeout(() => {
      const nextResult = select_next_card(state.fsrsCards, sessionManager)
      setSelectionResult(nextResult)

      if (nextResult.card) {
        const now = new Date()
        const scheduling = fsrs.repeat(nextResult.card, now)
        setSchedulingCards(scheduling)
        setShowAnswer(false)
      } else {
        // 沒有更多卡片
        setShowModal(false)
        alert(nextResult.message)
      }
    }, 300)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectionResult(null)
    setShowAnswer(false)
    setSchedulingCards(null)
  }

  // 獲取按鈕標籤
  const getButtonLabel = (rating: Rating): { text: string; interval: string } => {
    if (!schedulingCards) return { text: '', interval: '' }

    let card
    switch (rating) {
      case 1:
        card = schedulingCards.again.card
        break
      case 2:
        card = schedulingCards.hard.card
        break
      case 3:
        card = schedulingCards.good.card
        break
      case 4:
        card = schedulingCards.easy.card
        break
    }

    // 計算間隔顯示
    let interval: string
    if (card.state === 'learning' || card.state === 'relearning') {
      // 學習階段，顯示分鐘
      const now = new Date()
      const diff = card.due.getTime() - now.getTime()
      const minutes = Math.max(1, Math.round(diff / (1000 * 60)))
      interval = `${minutes}分鐘`
    } else {
      // 復習階段，顯示天數
      interval = format_interval(card.scheduled_days)
    }

    return {
      text: rating === 1 ? '再來一次' : rating === 2 ? '有點難' : rating === 3 ? '記得' : '很容易',
      interval
    }
  }

  return (
    <div>
      <div className="flashcard-header">
        <div className="flashcard-stats">
          <span className="stat-item">總計: {state.fsrsCards.length}</span>
          <span className="stat-item new">
            新卡片: {stats.new_cards_today}/{stats.new_cards_remaining + stats.new_cards_today}
          </span>
          <span className="stat-item learning">學習中: {stats.learning_count}</span>
          <span className="stat-item reviewing">復習: {stats.total_review}</span>
          <span className="stat-item due">待復習: {stats.due_count}</span>
        </div>
      </div>

      {stats.completed_today && (
        <div style={{
          padding: '20px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
          border: '2px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '16px',
          textAlign: 'center',
          color: '#86efac'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>今日學習完成！</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
            明天見！繼續保持！
          </div>
        </div>
      )}

      <button
        onClick={startPractice}
        className="start-practice-btn"
        disabled={stats.due_count === 0 && stats.learning_count === 0 && stats.new_count === 0}
      >
        {stats.due_count > 0
          ? `開始復習 (${stats.due_count} 張到期)`
          : stats.learning_count > 0
          ? `繼續學習 (${stats.learning_count} 張)`
          : stats.new_count > 0
          ? `學習新卡片 (${stats.new_cards_today}/${stats.new_cards_today + stats.new_cards_remaining})`
          : '今日學習完成'}
      </button>

      {showModal && selectionResult?.card && schedulingCards && (
        <div className="flashcard-modal-overlay" onClick={closeModal}>
          <div className="flashcard-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal}>✕</button>

            <div className="flashcard-content">
              {/* 卡片信息 */}
              <div style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                {selectionResult.reason === 'review' && '📚 復習'}
                {selectionResult.reason === 'learning' && '📖 學習中'}
                {selectionResult.reason === 'new' && '✨ 新卡片'}
                {' · '}
                {selectionResult.card.state === 'new' && '首次學習'}
                {selectionResult.card.state === 'learning' && '學習階段'}
                {selectionResult.card.state === 'relearning' && '重新學習'}
                {selectionResult.card.state === 'review' && `復習 ${selectionResult.card.reps} 次`}
              </div>

              <div className="flashcard-question">
                <h2>請回想這兩個編碼的記憶字：</h2>
                <div className="codes-display">
                  {selectionResult.card.code1} {selectionResult.card.code2}
                </div>
              </div>

              {!showAnswer ? (
                <button
                  className="show-answer-btn"
                  onClick={() => setShowAnswer(true)}
                >
                  顯示答案
                </button>
              ) : (
                <>
                  <div className="flashcard-answer">
                    <div className="answer-label">答案：</div>
                    <div className="answer-word">{selectionResult.card.word}</div>
                  </div>

                  <div className="familiarity-buttons">
                    <p className="familiarity-prompt">你記得多少？</p>
                    <div className="button-group-four">
                      <button
                        className="familiarity-btn unfamiliar"
                        onClick={() => handleRating(1)}
                      >
                        {getButtonLabel(1).text}
                        <span className="interval-hint">{getButtonLabel(1).interval}</span>
                      </button>
                      <button
                        className="familiarity-btn hard"
                        onClick={() => handleRating(2)}
                      >
                        {getButtonLabel(2).text}
                        <span className="interval-hint">{getButtonLabel(2).interval}</span>
                      </button>
                      <button
                        className="familiarity-btn okay"
                        onClick={() => handleRating(3)}
                      >
                        {getButtonLabel(3).text}
                        <span className="interval-hint">{getButtonLabel(3).interval}</span>
                      </button>
                      <button
                        className="familiarity-btn familiar"
                        onClick={() => handleRating(4)}
                      >
                        {getButtonLabel(4).text}
                        <span className="interval-hint">{getButtonLabel(4).interval}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 卡片詳細信息 */}
            <div className="card-info">
              <span>復習: {selectionResult.card.reps} 次</span>
              {selectionResult.card.difficulty > 0 && (
                <span>難度: {selectionResult.card.difficulty.toFixed(1)}</span>
              )}
              {selectionResult.card.stability > 0 && (
                <span>穩定性: {format_interval(Math.round(selectionResult.card.stability))}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
