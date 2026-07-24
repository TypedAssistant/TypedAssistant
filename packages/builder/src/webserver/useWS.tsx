import { useEffect, useRef, useState } from "react"
import type { app } from "./api"

export function useWS({
  onMessage,
  subscribe,
}: {
  onMessage: (event: MessageEvent) => void
  subscribe: () => ReturnType<(typeof app.ws | typeof app.logsws)["subscribe"]>
}) {
  const [ws, setWS] = useState(subscribe)
  const retryCount = useRef(0)
  const [, renderConnectionState] = useState(0)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    let active = true

    ws.ws.onopen = function () {
      retryCount.current = 0
      renderConnectionState((revision) => revision + 1)
    }

    ws.ws.onclose = function () {
      if (!active) return

      renderConnectionState((revision) => revision + 1)
      const delay = Math.min(1000 * 2 ** retryCount.current, 30000)
      retryCount.current++
      timeout = setTimeout(() => {
        if (!active || ws.ws.readyState === WebSocket.OPEN) return
        setWS(subscribe)
      }, delay)
    }

    ws.ws.onerror = function () {
      renderConnectionState((revision) => revision + 1)
      ws.ws.close()
    }

    ws.ws.onmessage = function (event) {
      onMessage(event)
    }

    return () => {
      active = false
      clearTimeout(timeout)
      ws.ws.onopen = null
      ws.ws.onclose = null
      ws.ws.onerror = null
      ws.ws.onmessage = null
      ws.ws.close()
    }
  }, [ws, onMessage, subscribe])

  return ws
}
