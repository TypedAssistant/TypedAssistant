// This is an example of a third-party store
// that you might need to integrate with React.

import type { EdenTreaty } from "@elysiajs/eden/treaty"
import { useMemo, useState, useSyncExternalStore } from "react"
import type { LogSchema } from "@typed-assistant/logger"
import type { levels } from "@typed-assistant/logger/levels"
import { app } from "./api"

export const getLogStore = ({
  level,
  limit,
  offset,
  filter,
}: {
  level: keyof typeof levels
  limit: string
  offset: string
  filter: string
}) => {
  let listeners: (() => void)[] = []
  let reconnectTimeout: ReturnType<typeof setTimeout>
  let retryCount = 0
  let active = false
  let logStore = {
    logs: [] as LogSchema[],
    ws: undefined as ReturnType<(typeof app.logsws)["subscribe"]> | undefined,
  }

  const emitChange = () => {
    for (const listener of listeners) listener()
  }

  const connect = () => {
    if (!active) return

    const ws = app.logsws.subscribe({
      $query: { level, limit, offset, filter },
    })
    logStore = { logs: logStore.logs, ws }
    emitChange()

    ws.on("open", () => {
      if (!active || logStore.ws !== ws) return
      retryCount = 0
      logStore = { ...logStore }
      emitChange()
    })

    ws.on("message", (event) => {
      if (!active || logStore.ws !== ws) return
      logStore = {
        logs: (event as EdenTreaty.OnMessage<{ logs: LogSchema[] }>).data.logs,
        ws,
      }
      emitChange()
    })

    ws.on("error", () => {
      if (active && logStore.ws === ws) ws.close()
    })

    ws.on("close", () => {
      if (!active || logStore.ws !== ws) return
      logStore = { ...logStore }
      emitChange()

      const delay = Math.min(1000 * 2 ** retryCount, 30000)
      retryCount++
      reconnectTimeout = setTimeout(connect, delay)
    })
  }

  return {
    subscribe: (listener: () => void) => {
      listeners = [...listeners, listener]
      active = true
      connect()

      return () => {
        active = false
        clearTimeout(reconnectTimeout)
        logStore.ws?.close()
        listeners = listeners.filter((candidate) => candidate !== listener)
      }
    },
    getSnapshot: () => logStore,
  }
}

export const useLogStore = () => {
  const [limit, setLimit] = useState(200)
  const [level, setLevel] = useState<
    "trace" | "debug" | "info" | "warn" | "error" | "fatal"
  >("info")
  const [offset, setOffset] = useState(0)
  const [filter, setFilter] = useState("")
  const logStore = useMemo(
    () =>
      getLogStore({
        level,
        limit: limit.toString(),
        offset: offset.toString(),
        filter,
      }),
    [level, limit, offset, filter],
  )
  const { logs, ws } = useSyncExternalStore(
    logStore.subscribe,
    logStore.getSnapshot,
  )

  return {
    limit,
    setLimit,
    level,
    setLevel,
    logs,
    offset,
    setOffset,
    filter,
    setFilter,
    ws,
  }
}
