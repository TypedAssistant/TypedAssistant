import type { HaConnection } from "@typed-assistant/connection"
import type { HassEntities } from "home-assistant-js-websocket"
import { useEffect, useState } from "react"

export const useEntitiesSubscription = (
  connection: HaConnection,
  callback: (entities: HassEntities) => void | (() => void),
) => {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    if (!connection.connection) {
      setTimeout(() => {
        setCounter((n) => n + 1)
      }, 1000)
      return
    }

    let unmount: ReturnType<typeof callback> | undefined
    const unsubscribe = connection.getHassEntities((x) => {
      unmount = callback(x)
    })

    return () => {
      unmount?.()
      unsubscribe?.()
    }
  }, [callback, connection, counter])
}
