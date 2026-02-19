// Google Sheets 同步工具
import type { MemoryWordDict } from '../types/memoryWord'

/**
 * 從 Google Sheets URL 提取 Sheet ID 和 GID
 */
export function extractSheetInfo(url: string): { sheetId: string; gid: string; isPublished: boolean } | null {
  try {
    // 支援三種格式：
    // 1. 一般分享：https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={GID}
    // 2. 一般分享：https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit?usp=sharing
    // 3. 發布為網頁：https://docs.google.com/spreadsheets/d/e/{PUBLISH_ID}/pubhtml

    // 檢查是否為發布為網頁的格式
    const publishMatch = url.match(/\/d\/e\/([a-zA-Z0-9-_]+)\/pub/)
    if (publishMatch) {
      const gidMatch = url.match(/[#&]gid=([0-9]+)/)
      return {
        sheetId: publishMatch[1],
        gid: gidMatch ? gidMatch[1] : '0',
        isPublished: true
      }
    }

    // 一般分享格式
    const sheetIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
    const gidMatch = url.match(/[#&]gid=([0-9]+)/)

    if (!sheetIdMatch) return null

    return {
      sheetId: sheetIdMatch[1],
      gid: gidMatch ? gidMatch[1] : '0',
      isPublished: false
    }
  } catch (e) {
    console.error('Failed to extract sheet info:', e)
    return null
  }
}

/**
 * 將 Google Sheets URL 轉換為 CSV 匯出 URL
 */
export function getCSVExportURL(url: string): string | null {
  const info = extractSheetInfo(url)
  if (!info) return null

  // 如果是發布為網頁的格式，使用 pub 端點
  if (info.isPublished) {
    return `https://docs.google.com/spreadsheets/d/e/${info.sheetId}/pub?output=csv&gid=${info.gid}`
  }

  // 標準 Google Sheets，使用 export 端點
  return `https://docs.google.com/spreadsheets/d/${info.sheetId}/export?format=csv&gid=${info.gid}`
}

/**
 * 解析 CSV/TSV 資料為記憶字典
 * 格式：第一列是第一個編碼，第一欄是第二個編碼
 */
export function parseCSVToMemoryWords(csvText: string, delimiter: string = ','): MemoryWordDict {
  const lines = csvText.trim().split('\n').filter(line => line.trim())
  const dict: MemoryWordDict = {}

  if (lines.length < 2) {
    throw new Error('資料格式錯誤：資料不足')
  }

  // 自動偵測分隔符（如果是 tab，可能是 TSV）
  const firstLine = lines[0]
  const actualDelimiter = firstLine.includes('\t') ? '\t' : delimiter

  // 第一列：第一個編碼（橫向）
  const header = lines[0].split(actualDelimiter).map(s => s.trim().replace(/^"|"$/g, ''))
  const codes1 = header.slice(1) // 跳過第一個空格

  console.log('📊 Header codes:', codes1)

  // 從第二列開始：每一列代表一個第二編碼
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(actualDelimiter).map(s => s.trim().replace(/^"|"$/g, ''))
    const code2 = cells[0] // 第一欄是第二個編碼

    if (!code2) continue // 跳過空行

    // 處理每個單字
    for (let j = 1; j < cells.length && j - 1 < codes1.length; j++) {
      const code1 = codes1[j - 1]
      const word = cells[j]

      if (code1 && code2 && word && word !== '未定' && word !== '') {
        const key = `${code1}${code2}`
        dict[key] = word
      }
    }
  }

  console.log(`✅ 解析完成：${Object.keys(dict).length} 個記憶字`)
  return dict
}

/**
 * 從 Google Sheets 同步記憶字典
 * 支援兩種格式：
 * 1. Google Apps Script URL（直接返回 JSON）
 * 2. Google Sheets URL（需要轉換為 CSV）
 */
export async function syncFromGoogleSheets(url: string, useCorsProxy: boolean = true): Promise<MemoryWordDict> {
  try {
    // 檢查是否為 Google Apps Script URL
    if (url.includes('script.google.com')) {
      // 直接請求 Google Apps Script，返回 JSON
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      return json as MemoryWordDict
    }

    // 否則處理為 Google Sheets URL
    const csvURL = getCSVExportURL(url)

    if (!csvURL) {
      throw new Error('無效的 Google Sheets URL')
    }

    // 使用 CORS 代理來繞過限制
    const finalURL = useCorsProxy
      ? `https://corsproxy.io/?${encodeURIComponent(csvURL)}`
      : csvURL

    const response = await fetch(finalURL)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const csvText = await response.text()
    return parseCSVToMemoryWords(csvText)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`同步失敗: ${error.message}`)
    }
    throw new Error('同步失敗：未知錯誤')
  }
}

/**
 * 檢查網路連線
 */
export function isOnline(): boolean {
  return navigator.onLine
}
