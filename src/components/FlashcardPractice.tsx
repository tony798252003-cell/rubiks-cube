import { useState, useEffect } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { selectCard, updateFlashcard, getDeckStats, type Familiarity } from '../types/flashcard'
import './FlashcardPractice.css'

export function FlashcardPractice() {
  const { state, dispatch } = useCubeContext()
  const [showModal, setShowModal] = useState(false)
  const [currentCard, setCurrentCard] = useState<ReturnType<typeof selectCard>>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [stats, setStats] = useState(getDeckStats(state.flashcards))

  useEffect(() => {
    setStats(getDeckStats(state.flashcards))
  }, [state.flashcards])

  const startPractice = () => {
    const card = selectCard(state.flashcards)
    if (card) {
      setCurrentCard(card)
      setShowAnswer(false)
      setShowModal(true)
    }
  }

  const handleAnswer = (familiarity: Familiarity) => {
    if (!currentCard) return

    // 更新卡片狀態
    const updatedCard = updateFlashcard(currentCard, familiarity)
    dispatch({
      type: 'UPDATE_FLASHCARD',
      payload: updatedCard,
    })

    // 選擇下一張卡片
    setTimeout(() => {
      const nextCard = selectCard(state.flashcards)
      if (nextCard) {
        setCurrentCard(nextCard)
        setShowAnswer(false)
      } else {
        // 沒有更多卡片了
        setShowModal(false)
        setCurrentCard(null)
      }
    }, 300)
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentCard(null)
    setShowAnswer(false)
  }

  return (
    <div>
      <div className="flashcard-header">
        <div className="flashcard-stats">
          <span className="stat-item">總計: {stats.total}</span>
          <span className="stat-item new">新: {stats.new}</span>
          <span className="stat-item learning">學習中: {stats.learning}</span>
          <span className="stat-item reviewing">複習中: {stats.reviewing}</span>
          <span className="stat-item due">待複習: {stats.due}</span>
        </div>
      </div>

      <button
        onClick={startPractice}
        className="start-practice-btn"
        disabled={stats.total === 0}
      >
        開始練習 ({stats.due > 0 ? `${stats.due} 張到期` : '隨機練習'})
      </button>

      {showModal && currentCard && (
        <div className="flashcard-modal-overlay" onClick={closeModal}>
          <div className="flashcard-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal}>✕</button>

            <div className="flashcard-content">
              <div className="flashcard-question">
                <h2>請回想這兩個編碼的記憶字：</h2>
                <div className="codes-display">
                  {currentCard.code1} {currentCard.code2}
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
                    <div className="answer-word">{currentCard.word}</div>
                  </div>

                  <div className="familiarity-buttons">
                    <p className="familiarity-prompt">你對這個記憶字的熟悉度？</p>
                    <div className="button-group">
                      <button
                        className="familiarity-btn unfamiliar"
                        onClick={() => handleAnswer('unfamiliar')}
                      >
                        不熟
                        <span className="interval-hint">再次出現：1分鐘</span>
                      </button>
                      <button
                        className="familiarity-btn okay"
                        onClick={() => handleAnswer('okay')}
                      >
                        還好
                        <span className="interval-hint">再次出現：10分鐘+</span>
                      </button>
                      <button
                        className="familiarity-btn familiar"
                        onClick={() => handleAnswer('familiar')}
                      >
                        熟悉
                        <span className="interval-hint">再次出現：1小時+</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="card-info">
              <span>複習次數: {currentCard.reviewCount}</span>
              {currentCard.reviewCount > 0 && (
                <span>當前間隔: {formatInterval(currentCard.interval)}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes}分鐘`
  if (minutes < 1440) return `${Math.round(minutes / 60)}小時`
  return `${Math.round(minutes / 1440)}天`
}
