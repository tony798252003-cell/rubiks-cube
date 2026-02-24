# 打亂歷史記錄功能設計

**日期：** 2026-02-24

## 需求

保留近 10 場的打亂公式記錄，讓使用者可以：
1. 點選歷史清單中的任一筆，重新套用該打亂公式繼續練習
2. 快速切換到上一個或下一個打亂公式（類似上一步/下一步）

## 方案

採用方案 A：在 CubeContext 狀態中直接加入歷史記錄欄位，隨現有 storage 機制自動持久化。

## 狀態設計

### 新增欄位（CubeState）

```ts
scrambleHistory: string[]  // 最多 10 筆，最新在尾端
historyIndex: number       // 目前瀏覽位置，-1 代表正在看最新的
```

### 新增 Actions

- `NAVIGATE_HISTORY`: `{ type: 'NAVIGATE_HISTORY'; payload: 'back' | 'forward' }`
  - 移動 historyIndex，並把對應的打亂公式套用到方塊

### SET_SCRAMBLE 行為調整

- 若 historyIndex 不在尾端，先截斷尾端後面的歷史
- 把新公式 push 進 scrambleHistory
- 若超過 10 筆，移除最舊的（shift）
- historyIndex 重設為 -1

## UI 設計

在 ControlPanel 打亂公式顯示區塊下方新增導航列：

```
← 上一個    第 3/8 筆    → 下一個
```

- 最舊時「← 上一個」disabled
- 最新時「→ 下一個」disabled
- 非最新時顯示淡色「歷史記錄」標籤提示

## 資料持久化

scrambleHistory 與 historyIndex 隨 CubeState 一起存入 storage，重啟 app 後歷史仍在。
