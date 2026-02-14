// IndexedDB 封裝 - 提供更穩定的存儲方案
// 相比 localStorage：容量更大、更穩定、手機上不容易被清除

const DB_NAME = 'CubeTrainerDB'
const DB_VERSION = 1
const STORE_NAME = 'appState'
const STATE_KEY = 'cubeTrainerState'

export interface StorageError {
  type: 'not_supported' | 'quota_exceeded' | 'unknown'
  message: string
  originalError?: any
}

/**
 * 檢查 IndexedDB 是否可用
 */
export function isIndexedDBSupported(): boolean {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}

/**
 * 打開 IndexedDB 連接
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      reject({
        type: 'not_supported',
        message: 'IndexedDB is not supported in this browser'
      } as StorageError)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject({
        type: 'unknown',
        message: 'Failed to open IndexedDB',
        originalError: request.error
      } as StorageError)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 創建 object store（如果不存在）
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * 保存數據到 IndexedDB
 */
export async function saveToIndexedDB(data: any): Promise<void> {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const serializedData = {
        version: '2.0.0',
        data,
        lastUpdated: new Date().toISOString(),
        savedAt: Date.now()
      }

      const request = store.put(serializedData, STATE_KEY)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject({
          type: 'unknown',
          message: 'Failed to save to IndexedDB',
          originalError: request.error
        } as StorageError)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error: any) {
    // 如果是配額超過錯誤
    if (error.name === 'QuotaExceededError') {
      throw {
        type: 'quota_exceeded',
        message: 'Storage quota exceeded',
        originalError: error
      } as StorageError
    }
    throw error
  }
}

/**
 * 從 IndexedDB 讀取數據
 */
export async function loadFromIndexedDB(): Promise<any | null> {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(STATE_KEY)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.data : null)
      }

      request.onerror = () => {
        reject({
          type: 'unknown',
          message: 'Failed to load from IndexedDB',
          originalError: request.error
        } as StorageError)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('Failed to load from IndexedDB:', error)
    return null
  }
}

/**
 * 清除 IndexedDB 中的所有數據
 */
export async function clearIndexedDB(): Promise<void> {
  try {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject({
          type: 'unknown',
          message: 'Failed to clear IndexedDB',
          originalError: request.error
        } as StorageError)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error)
    throw error
  }
}

/**
 * 刪除整個 IndexedDB 資料庫
 */
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      resolve()
      return
    }

    const request = indexedDB.deleteDatabase(DB_NAME)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject({
        type: 'unknown',
        message: 'Failed to delete database',
        originalError: request.error
      } as StorageError)
    }
  })
}

/**
 * 獲取存儲使用情況（如果瀏覽器支持）
 */
export async function getStorageEstimate(): Promise<{
  usage: number
  quota: number
  percentage: number
} | null> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return null
  }

  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const percentage = quota > 0 ? (usage / quota) * 100 : 0

    return {
      usage,
      quota,
      percentage
    }
  } catch {
    return null
  }
}

/**
 * 格式化位元組大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 測試 IndexedDB 讀寫權限
 */
export async function testIndexedDB(): Promise<boolean> {
  try {
    const testData = { test: 'data', timestamp: Date.now() }
    await saveToIndexedDB(testData)
    const loaded = await loadFromIndexedDB()
    return loaded !== null && loaded.test === 'data'
  } catch {
    return false
  }
}
