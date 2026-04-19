import { useState, useEffect, useCallback, useRef } from 'react'

interface TimerState {
  status: 'idle' | 'running' | 'stopped'
  elapsedSeconds: number
  resultMinutes: number | null
}

export function useTimer(employeeId: string) {
  const [state, setState] = useState<TimerState>({ status: 'idle', elapsedSeconds: 0, resultMinutes: null })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const storageKey = employeeId ? `timer_${employeeId}` : null

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Reads + validates the persisted timer. Returns null if missing, malformed,
  // or holds an unusable startedAt — and removes the bad entry so a stale value
  // can't keep the UI in 'running' forever.
  const readStartedAt = useCallback((key: string): number | null => {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    try {
      const data = JSON.parse(raw) as { startedAt?: unknown }
      const ts = typeof data.startedAt === 'string' ? Date.parse(data.startedAt) : NaN
      if (!Number.isFinite(ts)) {
        localStorage.removeItem(key)
        return null
      }
      return ts
    } catch {
      localStorage.removeItem(key)
      return null
    }
  }, [])

  const updateDisplay = useCallback(() => {
    if (!storageKey) return
    const startedAt = readStartedAt(storageKey)
    if (startedAt == null) {
      clearTimerInterval()
      setState({ status: 'idle', elapsedSeconds: 0, resultMinutes: null })
      return
    }
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
    setState(prev => ({ ...prev, elapsedSeconds: elapsed }))
  }, [storageKey, readStartedAt, clearTimerInterval])

  const start = useCallback(() => {
    if (!storageKey) return
    const data = { startedAt: new Date().toISOString(), employeeId }
    try {
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch {
      // localStorage full or disabled (private mode) — abort start so we don't
      // show 'running' UI without persistence backing it.
      return
    }
    setState({ status: 'running', elapsedSeconds: 0, resultMinutes: null })
  }, [storageKey, employeeId])

  const stop = useCallback(() => {
    if (!storageKey) return
    const startedAt = readStartedAt(storageKey)
    localStorage.removeItem(storageKey)
    clearTimerInterval()
    if (startedAt == null) {
      // Corrupt entry was removed by readStartedAt. No usable duration —
      // bail to idle rather than persist a bogus value.
      setState({ status: 'idle', elapsedSeconds: 0, resultMinutes: null })
      return
    }
    const elapsedMs = Date.now() - startedAt
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
      setState({ status: 'idle', elapsedSeconds: 0, resultMinutes: null })
      return
    }
    const minutes = Math.max(1, Math.ceil(elapsedMs / 60000))
    setState({ status: 'stopped', elapsedSeconds: 0, resultMinutes: minutes })
  }, [storageKey, readStartedAt, clearTimerInterval])

  const reset = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey)
    clearTimerInterval()
    setState({ status: 'idle', elapsedSeconds: 0, resultMinutes: null })
  }, [storageKey, clearTimerInterval])

  // Restore timer on mount or employee change
  useEffect(() => {
    clearTimerInterval()
    if (!storageKey) {
      setState({ status: 'idle', elapsedSeconds: 0, resultMinutes: null })
      return
    }
    const startedAt = readStartedAt(storageKey)
    setState({
      status: startedAt != null ? 'running' : 'idle',
      elapsedSeconds: 0,
      resultMinutes: null,
    })
  }, [storageKey, clearTimerInterval, readStartedAt])

  // Tick interval when running
  useEffect(() => {
    if (state.status === 'running') {
      updateDisplay()
      intervalRef.current = setInterval(updateDisplay, 1000)
    } else {
      clearTimerInterval()
    }
    return clearTimerInterval
  }, [state.status, updateDisplay, clearTimerInterval])

  const formatTime = (seconds: number) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  return {
    ...state,
    displayTime: formatTime(state.elapsedSeconds),
    start,
    stop,
    reset,
  }
}
