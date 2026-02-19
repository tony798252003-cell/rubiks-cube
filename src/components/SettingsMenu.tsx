import { useState, useRef } from 'react'
import { useCubeContext } from '../hooks/useCubeContext'
import { createPortal } from 'react-dom'
import EncodingPanel from './EncodingPanel'
import { MemoryWordEditor } from './MemoryWordEditor'
import {
  exportProgress,
  downloadJSON,
  importProgress,
  readJSONFile,
  clearStorage,
  getCurrentStorageType
} from '../utils/storage'
import { getStorageEstimate, formatBytes } from '../utils/indexedDB'

export function SettingsMenu() {
  const { dispatch } = useCubeContext()
  const [showEncodingPanel, setShowEncodingPanel] = useState(false)
  const [showMemoryEditor, setShowMemoryEditor] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 導出學習進度
  const handleExport = () => {
    try {
      const jsonString = exportProgress()
      const timestamp = new Date().toISOString().split('T')[0]
      downloadJSON(jsonString, `cube-trainer-backup-${timestamp}.json`)
      alert('✅ 學習進度已導出！')
    } catch (error) {
      alert('❌ 導出失敗：' + (error as Error).message)
    }
  }

  // 導入學習進度
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const jsonString = await readJSONFile(file)
      const success = await importProgress(jsonString)

      if (success) {
        alert('✅ 學習進度已導入！頁面將重新載入。')
        window.location.reload()
      } else {
        alert('❌ 導入失敗：數據格式不正確')
      }
    } catch (error) {
      alert('❌ 導入失敗：' + (error as Error).message)
    }

    // 清空 input 以便下次選擇相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 清除所有數據
  const handleClearData = async () => {
    const confirmed = window.confirm(
      '⚠️ 警告：這將清除所有學習進度、記憶字和設定！\n\n' +
      '建議先導出備份。\n\n' +
      '確定要清除所有數據嗎？'
    )

    if (confirmed) {
      const doubleConfirm = window.confirm('再次確認：真的要清除所有數據嗎？')

      if (doubleConfirm) {
        try {
          await clearStorage()
          alert('✅ 所有數據已清除！頁面將重新載入。')
          window.location.reload()
        } catch (error) {
          alert('❌ 清除失敗：' + (error as Error).message)
        }
      }
    }
  }

  // 重置為預設編碼
  const handleResetEncoding = () => {
    const confirmed = window.confirm(
      '重置注音/Speffz 編碼為預設值？\n\n' +
      '⚠️ 此操作只影響編碼設定，不會影響複習紀錄。'
    )
    if (!confirmed) return
    dispatch({ type: 'RESET_ENCODING' })
    alert('✅ 編碼已重置為預設值！')
  }

  // 顯示存儲狀態
  const handleShowStorageInfo = async () => {
    const storageType = getCurrentStorageType()
    const estimate = await getStorageEstimate()

    let info = `存儲方式：${
      storageType === 'indexedDB' ? 'IndexedDB（推薦）' :
      storageType === 'localStorage' ? 'localStorage（降級）' :
      '無可用存儲'
    }\n\n`

    if (estimate) {
      info += `已使用：${formatBytes(estimate.usage)}\n`
      info += `總容量：${formatBytes(estimate.quota)}\n`
      info += `使用率：${estimate.percentage.toFixed(2)}%`
    } else {
      info += '無法獲取存儲資訊'
    }

    alert(info)
  }

  return (
    <>
      {/* 隱藏的文件輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* 齒輪按鈕 */}
      <button
        onClick={() => setShowSettingsMenu(true)}
        className="p-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-white/10"
        title="設定"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* 全屏設定選單 */}
      {showSettingsMenu && !showEncodingPanel && !showMemoryEditor && createPortal(
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-[99999] flex flex-col">
          {/* 標題欄 */}
          <div className="flex items-center px-6 py-4 border-b border-white/10 bg-slate-800/50 backdrop-blur-xl">
            <button
              onClick={() => setShowSettingsMenu(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors mr-4"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white text-xl font-bold">設定</h1>
          </div>

          {/* 選單內容 */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-4">
              {/* 編碼設定 */}
              <button
                onClick={() => setShowEncodingPanel(true)}
                className="w-full text-left px-6 py-4 mb-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-4"
              >
                <span className="text-3xl">⚙️</span>
                <div>
                  <div className="text-white text-lg font-semibold">編碼設定</div>
                  <div className="text-gray-400 text-sm">設定角塊和邊塊的編碼標籤</div>
                </div>
              </button>

              {/* 重置為預設編碼 */}
              <button
                onClick={handleResetEncoding}
                className="w-full text-left px-6 py-4 mb-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors flex items-center gap-4"
              >
                <span className="text-3xl">↩️</span>
                <div>
                  <div className="text-amber-400 text-lg font-semibold">重置為預設編碼</div>
                  <div className="text-amber-300/60 text-sm">重置編碼對應表（不影響複習紀錄）</div>
                </div>
              </button>

              {/* 記憶字編輯 */}
              <button
                onClick={() => setShowMemoryEditor(true)}
                className="w-full text-left px-6 py-4 mb-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-4"
              >
                <span className="text-3xl">📝</span>
                <div>
                  <div className="text-white text-lg font-semibold">記憶字編輯</div>
                  <div className="text-gray-400 text-sm">編輯和管理記憶字詞庫</div>
                </div>
              </button>

              {/* 分隔線 */}
              <div className="border-t border-white/10 my-4"></div>

              {/* 導出學習進度 */}
              <button
                onClick={handleExport}
                className="w-full text-left px-6 py-4 mb-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-4"
              >
                <span className="text-3xl">💾</span>
                <div>
                  <div className="text-white text-lg font-semibold">導出學習進度</div>
                  <div className="text-gray-400 text-sm">備份所有學習數據</div>
                </div>
              </button>

              {/* 導入學習進度 */}
              <button
                onClick={handleImport}
                className="w-full text-left px-6 py-4 mb-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-4"
              >
                <span className="text-3xl">📥</span>
                <div>
                  <div className="text-white text-lg font-semibold">導入學習進度</div>
                  <div className="text-gray-400 text-sm">從備份文件恢復數據</div>
                </div>
              </button>

              {/* 存儲狀態 */}
              <button
                onClick={handleShowStorageInfo}
                className="w-full text-left px-6 py-4 mb-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-4"
              >
                <span className="text-3xl">📊</span>
                <div>
                  <div className="text-white text-lg font-semibold">存儲狀態</div>
                  <div className="text-gray-400 text-sm">查看存儲空間使用情況</div>
                </div>
              </button>

              {/* 分隔線 */}
              <div className="border-t border-white/10 my-4"></div>

              {/* 清除所有數據 */}
              <button
                onClick={handleClearData}
                className="w-full text-left px-6 py-4 mb-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors flex items-center gap-4"
              >
                <span className="text-3xl">🗑️</span>
                <div>
                  <div className="text-red-400 text-lg font-semibold">清除所有數據</div>
                  <div className="text-red-300/60 text-sm">永久刪除所有學習進度</div>
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 編碼設定頁面 */}
      {showEncodingPanel && (
        <EncodingPanel
          isOpen={showEncodingPanel}
          onClose={() => setShowEncodingPanel(false)}
        />
      )}

      {/* 記憶字編輯器頁面 */}
      {showMemoryEditor && createPortal(
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-[99999] flex flex-col">
          {/* 標題欄 */}
          <div className="flex items-center px-6 py-4 border-b border-white/10 bg-slate-800/50 backdrop-blur-xl">
            <button
              onClick={() => setShowMemoryEditor(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors mr-4"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white text-xl font-bold">記憶字編輯器</h1>
          </div>

          {/* 內容區 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              <MemoryWordEditor />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
