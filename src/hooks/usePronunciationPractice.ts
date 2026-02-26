import { useState, useRef, useCallback, useEffect } from 'react'
import type { MemoryWordDict } from '../types/memoryWord'

export const ZHUYIN_SYMBOLS = [
  'ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ',
  'ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ',
  'ㄕ','ㄖ','ㄗ','ㄘ','ㄙ','1'
]

export interface PronunciationPair {
  key: string
  symbol1: string
  symbol2: string
}

export function buildShuffledPairs(): PronunciationPair[] {
  const pairs: PronunciationPair[] = []
  for (const a of ZHUYIN_SYMBOLS) {
    for (const b of ZHUYIN_SYMBOLS) {
      pairs.push({ key: `${a}${b}`, symbol1: a, symbol2: b })
    }
  }
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}

export interface PronunciationState {
  isPlaying: boolean
  currentPair: PronunciationPair | null
  showAnswer: boolean
  progress: number
  questionDelay: number
  answerDelay: number
}

export function usePronunciationPractice(memoryWords: MemoryWordDict) {
  const [state, setState] = useState<PronunciationState>({
    isPlaying: false,
    currentPair: null,
    showAnswer: false,
    progress: 0,
    questionDelay: 3,
    answerDelay: 2,
  })

  const queueRef = useRef<PronunciationPair[]>([])
  const indexRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPlayingRef = useRef(false)
  const questionDelayRef = useRef(3)
  const answerDelayRef = useRef(2)
  const memoryWordsRef = useRef(memoryWords)

  useEffect(() => {
    memoryWordsRef.current = memoryWords
  }, [memoryWords])

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, 10000)
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'zh-TW'
      utter.rate = 0.9
      utter.onend = () => { clearTimeout(timeout); resolve() }
      utter.onerror = () => { clearTimeout(timeout); resolve() }
      window.speechSynthesis.speak(utter)
    })
  }, [])

  const playNext = useCallback(async () => {
    if (!isPlayingRef.current) return

    if (indexRef.current >= queueRef.current.length) {
      queueRef.current = buildShuffledPairs()
      indexRef.current = 0
    }

    const pair = queueRef.current[indexRef.current]
    indexRef.current++

    const memoryWord = memoryWordsRef.current[pair.key] || '未定'

    setState(prev => ({
      ...prev,
      currentPair: pair,
      showAnswer: false,
      progress: indexRef.current,
    }))

    const displaySymbol1 = pair.symbol1 === '1' ? '一' : pair.symbol1
    const displaySymbol2 = pair.symbol2 === '1' ? '一' : pair.symbol2
    await speak(`${displaySymbol1}，${displaySymbol2}`)

    if (!isPlayingRef.current) return

    await new Promise<void>(resolve => {
      timeoutRef.current = setTimeout(resolve, questionDelayRef.current * 1000)
    })

    if (!isPlayingRef.current) return

    setState(prev => ({ ...prev, showAnswer: true }))
    await speak(memoryWord)

    if (!isPlayingRef.current) return

    await new Promise<void>(resolve => {
      timeoutRef.current = setTimeout(resolve, answerDelayRef.current * 1000)
    })

    if (isPlayingRef.current) {
      void playNext()
    }
  }, [speak])

  const start = useCallback(() => {
    if (queueRef.current.length === 0) {
      queueRef.current = buildShuffledPairs()
      indexRef.current = 0
    }
    isPlayingRef.current = true
    setState(prev => ({ ...prev, isPlaying: true }))
    playNext()
  }, [playNext])

  const pause = useCallback(() => {
    isPlayingRef.current = false
    window.speechSynthesis.cancel()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setState(prev => ({ ...prev, isPlaying: false }))
  }, [])

  const setQuestionDelay = useCallback((v: number) => {
    questionDelayRef.current = v
    setState(prev => ({ ...prev, questionDelay: v }))
  }, [])

  const setAnswerDelay = useCallback((v: number) => {
    answerDelayRef.current = v
    setState(prev => ({ ...prev, answerDelay: v }))
  }, [])

  useEffect(() => {
    return () => {
      isPlayingRef.current = false
      window.speechSynthesis.cancel()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { state, start, pause, setQuestionDelay, setAnswerDelay }
}
