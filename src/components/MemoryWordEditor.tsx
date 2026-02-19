import { useState } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { getMemoryWord, getMemoryWordKey } from '../types/memoryWord'
import { syncFromGoogleSheets, isOnline } from '../utils/googleSheets'
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
  const { state, dispatch } = useCubeContext()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string>('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState(state.googleSheetsUrl)

  const handleReset = () => {
    if (window.confirm('確定要重置所有記憶字到預設值嗎？')) {
      dispatch({ type: 'RESET_MEMORY_WORDS' })
    }
  }

  const handleSaveUrl = () => {
    dispatch({ type: 'SET_GOOGLE_SHEETS_URL', payload: urlInput })
    setShowUrlInput(false)
    setSyncStatus('✅ URL 已儲存')
    setTimeout(() => setSyncStatus(''), 3000)
  }

  const handleSync = async () => {
    if (!state.googleSheetsUrl) {
      setSyncStatus('❌ 請先設定 Google Sheets URL')
      setTimeout(() => setSyncStatus(''), 3000)
      return
    }

    if (!isOnline()) {
      setSyncStatus('❌ 無網路連線')
      setTimeout(() => setSyncStatus(''), 3000)
      return
    }

    setIsSyncing(true)
    setSyncStatus('⏳ 同步中...')

    try {
      const syncedWords = await syncFromGoogleSheets(state.googleSheetsUrl)
      dispatch({ type: 'SYNC_MEMORY_WORDS', payload: syncedWords })
      setSyncStatus(`✅ 已同步 ${Object.keys(syncedWords).length} 個記憶字`)
      setTimeout(() => setSyncStatus(''), 5000)
    } catch (error) {
      setSyncStatus(`❌ ${(error as Error).message}`)
      setTimeout(() => setSyncStatus(''), 5000)
    } finally {
      setIsSyncing(false)
    }
  }


  return (
    <div className="memory-word-section">
      <div className="memory-word-actions">
        {/* Google Sheets 同步 */}
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              style={{
                padding: '8px 16px',
                background: isSyncing ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {isSyncing ? '⏳ 同步中...' : '🔄 從 Google Sheets 同步'}
            </button>
            {syncStatus && (
              <span style={{ color: syncStatus.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: '14px' }}>
                {syncStatus}
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
            💡 開啟應用時會自動同步（使用 TSV 格式）
          </div>
        </div>

        {/* 備用：從 CSV 匯入 */}
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!showUrlInput ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowUrlInput(true)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {state.googleSheetsUrl ? '📝 編輯 Google Sheets URL' : '🔗 設定 Google Sheets URL'}
              </button>
              {state.googleSheetsUrl && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  style={{
                    padding: '8px 16px',
                    background: isSyncing ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  {isSyncing ? '⏳ 同步中...' : '🔄 立即同步'}
                </button>
              )}
              {syncStatus && (
                <span style={{ color: syncStatus.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: '14px' }}>
                  {syncStatus}
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="貼上 Google Sheets 分享連結"
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  width: '100%'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSaveUrl}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  ✅ 儲存
                </button>
                <button
                  onClick={() => {
                    setShowUrlInput(false)
                    setUrlInput(state.googleSheetsUrl)
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={handleReset} className="reset-btn">
          重置為預設
        </button>
      </div>

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
    </div>
  )
}
