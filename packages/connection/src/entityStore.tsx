import type { HassEntities, HassEntity } from "home-assistant-js-websocket"
import { connection } from "./global"
import type { EntityId } from "@typed-assistant/types"

let listeners: ((
  entities: HassEntities,
  prevEntities: HassEntities,
) => void)[] = []
let entities: HassEntities = {}

function emitChange(newEntities: HassEntities) {
  const oldEntities = entities
  entities = newEntities
  for (let listener of listeners) {
    listener(newEntities, oldEntities)
  }
}

const addListener = (
  listener: (entities: HassEntities, prevEntities: HassEntities) => void,
) => {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

const stop = connection.getHassEntities((newEntities) => {
  emitChange(newEntities)
})

const getEntities = () => entities as Record<EntityId, HassEntity | undefined>
export { addListener, getEntities, stop }
