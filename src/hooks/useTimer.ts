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

  const updateDisplay = useCallback(() => {
    if (!storageKey) return
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    const data = JSON.parse(raw)
    const elapsed = Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000)
    setState(prev => ({ ...prev, elapsedSeconds: elapsed }))
  }, [storageKey])

  const start = useCallback(() => {
    if (!storageKey) return
    const data = { startedAt: new Date().toISOString(), employeeId }
    localStorage.setItem(storageKey, JSON.stringify(data))
    setState({ status: 'running', elapsedSeconds: 0, resultMinutes: null })
  }, [storageKey, employeeId])

  const stop = useCallback(() => {
    if (!storageKey) return
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    const data = JSON.parse(raw)
    const elapsed = Date.now() - new Date(data.startedAt).getTime()
    const minutes = Math.max(1, Math.ceil(elapsed / 60000))
    localStorage.removeItem(storageKey)
    clearTimerInterval()
    setState({ status: 'stopped', elapsedSeconds: 0, resultMinutes: minutes })
  }, [storageKey, clearTimerInterval])

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
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      setState({ status: 'running', elapsedSeconds: 0, resultMinutes: null })
    } else {
      setState({ status: 'idle', elapsedSeconds: 0, resultMinutes: null })
    }
  }, [storageKey, clearTimerInterval])

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
