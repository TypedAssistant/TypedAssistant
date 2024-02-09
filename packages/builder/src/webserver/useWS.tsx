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
    let timeout: NodeJS.Timeout

    ws.ws.onclose = function () {
      timeout = setTimeout(() => {
        if (ws.ws.readyState === WebSocket.OPEN) return
        setWS(subscribe)
      }, 1000)
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
