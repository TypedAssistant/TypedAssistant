import type { HassEntities, HassEntity } from "home-assistant-js-websocket"
import { connection } from "./global"
import type { EntityId } from "@typed-assistant/types"

let listeners = new Set<
  (entities: HassEntities, prevEntities: HassEntities) => void
>()
let entities: HassEntities = {}

function emitChange(newEntities: HassEntities) {
  const oldEntities = entities
  entities = newEntities
  for (const listener of listeners) {
    listener(newEntities, oldEntities)
  }
}

const addListener = (
  listener: (entities: HassEntities, prevEntities: HassEntities) => void,
) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const stop = connection.getHassEntities((newEntities) => {
  emitChange(newEntities)
})

const getEntities = () => entities as Record<EntityId, HassEntity | undefined>
export { addListener, getEntities, stop }
