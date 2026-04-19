import { useCallback, useEffect, useRef, useState } from 'react'

export type FlashKind = 'success' | 'error'
export interface FlashMessage {
  kind: FlashKind
  text: string
}

const DEFAULT_TIMEOUT_MS = 4000

export function useFlash(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const [flash, setFlash] = useState<FlashMessage | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const show = useCallback((kind: FlashKind, text: string) => {
    clearTimer()
    setFlash({ kind, text })
    timerRef.current = setTimeout(() => setFlash(null), timeoutMs)
  }, [clearTimer, timeoutMs])

  const dismiss = useCallback(() => {
    clearTimer()
    setFlash(null)
  }, [clearTimer])

  useEffect(() => clearTimer, [clearTimer])

  return { flash, show, dismiss }
}
