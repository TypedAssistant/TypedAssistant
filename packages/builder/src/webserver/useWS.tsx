import { useEffect, useState } from "react"
import type { app } from "./api"

export function useWS({
  onMessage,
  subscribe,
}: {
  onMessage: (event: MessageEvent) => void
  subscribe: () => ReturnType<(typeof app.ws | typeof app.logsws)["subscribe"]>
}) {
  const [ws, setWS] = useState(subscribe)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    let retryCount = 0

    ws.ws.onopen = function () {
      retryCount = 0
    }

    ws.ws.onclose = function () {
      const delay = Math.min(1000 * 2 ** retryCount, 30000)
      retryCount++
      timeout = setTimeout(() => {
        if (ws.ws.readyState === WebSocket.OPEN) return
        setWS(subscribe)
      }, delay)
    }

    ws.ws.onmessage = function (event) {
      onMessage(event)
    }

    return () => {
      clearTimeout(timeout)
      ws.ws.close()
    }
  }, [ws, onMessage, subscribe])

  return ws
}
