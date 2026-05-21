import { useEffect, useState } from 'react'

export function useWebSocket(userId: string | null, token: string | null) {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!userId || !token) return

    const wsUrl = `ws://localhost:8080/ws/files?userId=${userId}&token=${token}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'file_change') {
          // 触发文件列表刷新的事件
          window.dispatchEvent(new CustomEvent('file-change', { detail: msg }))
        }
      } catch {
        // ignore parse errors
      }
    }

    return () => {
      ws.close()
    }
  }, [userId, token])

  return { connected }
}
