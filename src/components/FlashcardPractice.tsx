import { useState, useMemo, useCallback, useEffect } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { FSRS, Rating, SchedulingCards, format_interval, FSRSCard } from '../types/fsrs'
import { SessionManager, select_next_card, CardSelectionResult } from '../types/dailySession'
import './FlashcardPractice.css'

export function FlashcardPractice() {
  const { state, dispatch } = useCubeContext()
  const [showModal, setShowModal] = useState(false)
  const [selectionResult, setSelectionResult] = useState<CardSelectionResult | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [schedulingCards, setSchedulingCards] = useState<SchedulingCards | null>(null)

  // 本地維護卡片列表和會話管理器
  const [localCards, setLocalCards] = useState<FSRSCard[]>([])
  const [localSession, setLocalSession] = useState<SessionManager | null>(null)

  // 初始化 FSRS 和 SessionManager
  const fsrs = useMemo(() => new FSRS(), [])

  // 當 state 變化時，同步到本地
  useEffect(() => {
    setLocalCards(state.fsrsCards)
    setLocalSession(new SessionManager(state.dailySession))
  }, [state.fsrsCards, state.dailySession])

  // 計算統計（使用本地狀態）
  const stats = useMemo(() => {
    if (!localSession) return {
      due_count: 0,
      new_count: 0,
      learning_count: 0,
      total_new: 0,
      total_review: 0,
      new_cards_today: 0,
      new_cards_remaining: 0,
      completed_today: false
    }
    return localSession.get_daily_stats(localCards)
  }, [localCards, localSession])

  // 開始練習
  const startPractice = useCallback(() => {
    if (!localSession) return

    const result = select_next_card(localCards, localSession)
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
  }, [localCards, localSession, fsrs])

  // 再背 10 題
  const learnMore = useCallback(() => {
    if (!localSession) return

    const currentLimit = localSession.get_session().new_cards_limit
    localSession.set_new_cards_limit(currentLimit + 10)

    // 更新全局狀態
    dispatch({
      type: 'UPDATE_DAILY_SESSION',
      payload: localSession.get_session()
    })

    // 立即開始練習
    startPractice()
  }, [localSession, dispatch, startPractice])

  // 處理評分
  const handleRating = useCallback((rating: Rating) => {
    if (!selectionResult?.card || !schedulingCards || !localSession) return

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

    // 更新本地卡片列表
    const newLocalCards = localCards.map(card =>
      card.id === updatedCard.id ? updatedCard : card
    )
    setLocalCards(newLocalCards)

    // 記錄學習狀態
    if (selectionResult.reason === 'new') {
      // 首次學習新卡片時記錄
      localSession.record_new_card_learned(selectionResult.card.id)
    } else if (selectionResult.reason === 'review' || selectionResult.reason === 'learning') {
      // 記錄複習（包括學習中和正式複習）
      localSession.record_review()
    }

    // 如果卡片畢業到 review 狀態，從學習隊列移除
    if (updatedCard.state === 'review') {
      localSession.remove_from_learning_queue(updatedCard.id)
    } else if (updatedCard.state === 'learning' || updatedCard.state === 'relearning') {
      localSession.add_to_learning_queue(updatedCard.id)
    }

    // 更新到全局 state
    dispatch({
      type: 'UPDATE_FSRS_CARD',
      payload: updatedCard
    })

    dispatch({
      type: 'UPDATE_DAILY_SESSION',
      payload: localSession.get_session()
    })

    // 使用更新後的本地狀態選擇下一張卡片
    setTimeout(() => {
      const nextResult = select_next_card(newLocalCards, localSession)
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
  }, [selectionResult, schedulingCards, localCards, localSession, dispatch, fsrs])

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
    } else if (card.scheduled_days > 0) {
      // 復習階段，顯示天數
      interval = format_interval(card.scheduled_days)
    } else {
      // 新卡片，顯示預設值
      interval = rating === 1 ? '1分鐘' :
                 rating === 2 ? '1分鐘' :
                 rating === 3 ? '1天' : '4天'
    }

    return {
      text: rating === 1 ? '再來一次' : rating === 2 ? '有點難' : rating === 3 ? '記得' : '很容易',
      interval
    }
  }

  if (!localSession) {
    return <div>載入中...</div>
  }

  return (
    <div>
      {/* 統計信息 - 始終顯示 */}
      <div className="flashcard-header">
        <div className="flashcard-stats">
          <span className="stat-item">總計: {localCards.length}</span>
          <span className="stat-item new">
            ✨ 新卡片: {stats.new_cards_today}
          </span>
          <span className="stat-item review">
            📚 複習: {localSession?.get_session().reviews_completed || 0}
          </span>
          <span className="stat-item learning">學習中: {stats.learning_count}</span>
          <span className="stat-item due">待復習: {stats.due_count}</span>
        </div>
      </div>

      {/* 完成提示 */}
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
            ✨ 新卡片：{stats.new_cards_today} 張 · 📚 複習：{localSession?.get_session().reviews_completed || 0} 張
          </div>
          <button
            onClick={learnMore}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            📚 再背 10 題
          </button>
        </div>
      )}

      {/* 學習未完成提示 */}
      {!stats.completed_today && stats.new_cards_remaining === 0 && stats.learning_count > 0 && (
        <div style={{
          padding: '16px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
          border: '2px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '16px',
          textAlign: 'center',
          color: '#fcd34d'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📖</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>還有 {stats.learning_count} 張卡片需要複習</div>
          <div style={{ fontSize: '13px', marginTop: '6px', opacity: 0.9 }}>
            確保所有卡片都至少達到「有點難」才能完成今日學習
          </div>
        </div>
      )}

      {/* 開始按鈕 */}
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
          ? `學習新卡片 (還剩 ${stats.new_cards_remaining} 張)`
          : '今日學習完成'}
      </button>

      {/* 卡片練習模態窗口 */}
      {showModal && selectionResult?.card && schedulingCards && (
        <div className="flashcard-modal-overlay" onClick={closeModal}>
          <div className="flashcard-modal" onClick={(e) => e.stopPropagation()}>
            {/* 頂部統計條 - 練習時始終可見 */}
            <div style={{
              position: 'sticky',
              top: 0,
              background: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '12px 12px 0 0',
              zIndex: 10,
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
                <span style={{ color: '#93c5fd' }}>✨ 新: {stats.new_cards_today}</span>
                <span style={{ color: '#a78bfa' }}>📚 複習: {localSession?.get_session().reviews_completed || 0}</span>
                <span style={{ color: '#fcd34d' }}>📖 學習中: {stats.learning_count}</span>
                <span style={{ color: '#fca5a5' }}>⏰ 待復習: {stats.due_count}</span>
              </div>
              <button onClick={closeModal} style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1
              }}>✕</button>
            </div>

            <div className="flashcard-content">
              {/* 卡片信息 */}
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '8px',
                textAlign: 'center',
                flexShrink: 0
              }}>
                {selectionResult.reason === 'review' && '📚 復習'}
                {selectionResult.reason === 'learning' && '📖 學習中'}
                {selectionResult.reason === 'new' && `✨ 新卡片`}
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
