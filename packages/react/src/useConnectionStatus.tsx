import type { HaConnection } from "@typed-assistant/connection"
import type { Connection } from "home-assistant-js-websocket"
import { useEffect, useState } from "react"

type ConnectionState = {
  error?: string
  state: "idle" | "connecting" | "connected" | "disconnected" | "errored"
}

export const useConnectionStatus = (connection: HaConnection) => {
  const [state, setState] = useState<ConnectionState>({ state: "idle" })

  useEffect(() => {
    let connectionInstance: Connection | undefined
    const go = async () => {
      setState({ state: "connecting" })
      try {
        connectionInstance = await connection.getConnection()
      } catch (error) {
        setState({
          error: (error as Error).message ?? "Unknown error",
          state: "errored",
        })
        return
      }
      if (!connectionInstance) {
        setState({ state: "errored", error: "No connection" })
        return
      }
      setState({ state: "connected" })

      connectionInstance?.addEventListener("ready", () => {
        setState({ state: "connected" })
      })

      connectionInstance?.addEventListener("disconnected", () => {
        setState({ state: "disconnected" })
      })

      connectionInstance?.addEventListener("reconnect-error", () => {
        setState({ state: "errored", error: "Reconnect error" })
      })
    }

    go()
    return () => {
      connectionInstance?.close()
    }
  }, [connection])

  return state
}
