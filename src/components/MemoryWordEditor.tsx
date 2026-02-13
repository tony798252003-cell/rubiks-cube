import { useState } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { getMemoryWord, getMemoryWordKey } from '../types/memoryWord'
import './MemoryWordEditor.css'

// 所有可能的編碼（包含數字1）
const ALL_CODES = ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ', '1']

interface MemoryWordCellProps {
  code1: string
  code2: string
}

function MemoryWordCell({ code1, code2 }: MemoryWordCellProps) {
  const { state, dispatch } = useCubeContext()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const key = getMemoryWordKey(code1, code2)
  const currentWord = getMemoryWord(state.memoryWords, code1, code2)
  const isEmpty = currentWord === '未定'

  const handleClick = () => {
    setEditValue(isEmpty ? '' : currentWord)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editValue.trim()) {
      dispatch({
        type: 'UPDATE_MEMORY_WORD',
        payload: { key, word: editValue.trim() }
      })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  return (
    <div className={`memory-cell ${isEmpty ? 'empty' : ''}`}>
      <div className="cell-header">{code1}{code2}</div>
      {isEditing ? (
        <input
          type="text"
          className="cell-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="輸入記憶字"
        />
      ) : (
        <div className="cell-word" onClick={handleClick}>
          {currentWord}
        </div>
      )}
    </div>
  )
}

export function MemoryWordEditor() {
  const { dispatch } = useCubeContext()
  const [showModal, setShowModal] = useState(false)

  const handleReset = () => {
    if (window.confirm('確定要重置所有記憶字到預設值嗎？')) {
      dispatch({ type: 'RESET_MEMORY_WORDS' })
    }
  }

  return (
    <div className="memory-word-section">
      <div className="memory-word-header">
        <h3>記憶字編輯器</h3>
        <div className="memory-word-actions">
          <button onClick={() => setShowModal(!showModal)}>
            {showModal ? '收起' : '展開'}編輯器
          </button>
          {showModal && (
            <button onClick={handleReset} className="reset-btn">
              重置為預設
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="memory-word-grid">
          <div className="grid-header">
            <div className="corner-cell"></div>
            {ALL_CODES.map(code => (
              <div key={code} className="header-cell">{code}</div>
            ))}
          </div>
          {ALL_CODES.map(code1 => (
            <div key={code1} className="grid-row">
              <div className="row-header">{code1}</div>
              {ALL_CODES.map(code2 => (
                <MemoryWordCell key={`${code1}-${code2}`} code1={code1} code2={code2} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
