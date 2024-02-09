import {
  addListener,
  getEntities,
} from "@typed-assistant/connection/entityStore"
import type { EntityId } from "@typed-assistant/types"
import type { AnyOtherString } from "@typed-assistant/types/misc-types"
import type { HassEntity } from "home-assistant-js-websocket"
import { useCallback, useRef, useSyncExternalStore } from "react"
import { entitiesAreDifferent } from "./entitiesAreDifferent"

export function useEntity(
  entityId: EntityId,
  deps?: Array<keyof HassEntity | AnyOtherString>,
): HassEntity | undefined
export function useEntity(
  entityIds: EntityId[],
  deps?: Array<keyof HassEntity | AnyOtherString>,
): (HassEntity | undefined)[]
export function useEntity(
  entityId: EntityId | EntityId[],
  deps: Array<keyof HassEntity | AnyOtherString> = ["state"],
): HassEntity | undefined | (HassEntity | undefined)[] {
  const entityIds = Array.isArray(entityId) ? entityId : [entityId]
  const resultRef = useRef<(HassEntity | undefined)[]>(
    entityIds.map((entityId) => getEntities()[entityId]),
  )
  const entityIdsRef = useRef(entityIds)
  entityIdsRef.current = entityIds

  const subscribeFn = useCallback(
    (callback: () => void) => {
      return addListener((entities, prevEntities) => {
        if (
          entityIdsRef.current.some((entityId) =>
            entitiesAreDifferent(
              deps,
              entities[entityId],
              prevEntities[entityId],
            ),
          )
        )
          resultRef.current = entityIdsRef.current.map(
            (entityId) => entities[entityId],
          )
        callback()
      })
    },
    [deps, entityIdsRef],
  )

  const entities = useSyncExternalStore(subscribeFn, () => resultRef.current)

  if (Array.isArray(entityId)) {
    return Array.isArray(entities) ? entities : [entities]
  }
  return entities?.[0]
}
