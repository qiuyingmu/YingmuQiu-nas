import { useEffect, useRef, useState, useCallback } from 'react'

const MAX_RECONNECT_DELAY = 16000 // 16s
const BASE_RECONNECT_DELAY = 1000 // 1s

export function useWebSocket(userId: string | null, token: string | null) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const reconnectAttemptRef = useRef(0)
  const mountedRef = useRef(true)

  const getWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws/files?userId=${userId}&token=${token}`
  }, [userId, token])

  const connect = useCallback(() => {
    if (!userId || !token || !mountedRef.current) return

    // 关闭旧连接
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.onerror = null
      wsRef.current.close()
    }

    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return }
      setConnected(true)
      reconnectAttemptRef.current = 0
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setConnected(false)
      scheduleReconnect()
    }

    ws.onerror = () => {
      if (!mountedRef.current) return
      setConnected(false)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'file_change') {
          window.dispatchEvent(new CustomEvent('file-change', { detail: msg }))
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [getWsUrl, userId, token])

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return

    const attempt = reconnectAttemptRef.current
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, attempt),
      MAX_RECONNECT_DELAY,
    )
    reconnectAttemptRef.current = attempt + 1

    console.log(`[WS] 将在 ${delay}ms 后重连 (第${attempt + 1}次)`)
    reconnectTimerRef.current = setTimeout(connect, delay)
  }, [connect])

  useEffect(() => {
    mountedRef.current = true
    connect()

    // 页面可见时立即重试
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wsRef.current?.readyState) {
        reconnectAttemptRef.current = 0
        connect()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimerRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.onerror = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return { connected }
}
