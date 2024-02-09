// This is an example of a third-party store
// that you might need to integrate with React.

import type { LogSchema } from "@typed-assistant/logger"
import type { levels } from "@typed-assistant/logger/levels"
import { app } from "./api"
import type { EdenTreaty } from "@elysiajs/eden/treaty"
import { useMemo, useState, useSyncExternalStore } from "react"

let listeners: (() => void)[] = []
let logStore = {
  logs: [] as LogSchema[],
  ws: undefined as ReturnType<(typeof app.logsws)["subscribe"]> | undefined,
}
export const getLogStore = ({
  level,
  limit,
  offset,
}: {
  level: keyof typeof levels
  limit: string
  offset: string
}) => ({
  subscribe: (listener: () => void) => {
    listeners = [...listeners, listener]
    const ws = app.logsws.subscribe({ $query: { level, limit, offset } })
    logStore = {
      logs: [],
      ws,
    }
    emitChange()

    ws.on("open", () => {
      logStore = {
        logs: logStore.logs,
        ws: logStore.ws,
      }
      emitChange()
    })

    ws.on("message", (event) => {
      logStore = {
        logs: (event as EdenTreaty.OnMessage<{ logs: LogSchema[] }>).data.logs,
        ws,
      }
      emitChange()
    })

    return () => {
      logStore.ws?.close()
      listeners = listeners.filter((l) => l !== listener)
    }
  },

  getSnapshot: () => logStore,
})

function emitChange() {
  for (let listener of listeners) {
    listener()
  }
}

export const useLogStore = () => {
  const [limit, setLimit] = useState(200)
  const [level, setLevel] = useState<
    "trace" | "debug" | "info" | "warn" | "error" | "fatal"
  >("info")
  const [offset, setOffset] = useState(0)
  const logStore = useMemo(
    () =>
      getLogStore({
        level,
        limit: limit.toString(),
        offset: offset.toString(),
      }),
    [level, limit, offset],
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
    ws,
  }
}
