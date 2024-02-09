import type { HassEntity } from "home-assistant-js-websocket"
import { equals } from "lodash/fp"
import React, { useEffect, useRef } from "react"
import type { AnyOtherString } from "@typed-assistant/types/misc-types"
import useDeepCompareEffect from "use-deep-compare-effect"
import type { EntityId } from "@typed-assistant/types"
import { EntitiesSubscriptionContext } from "./entities"

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
  const [entities, setEntitiesToSubscribe] = React.useContext(
    EntitiesSubscriptionContext,
  )
  const entityIds = Array.isArray(entityId) ? entityId : [entityId]

  useDeepCompareEffect(() => {
    entityIds.forEach((id) => {
      setEntitiesToSubscribe((prev) => [...prev, [id, deps]])
    })
    return () => {
      entityIds.forEach((id) => {
        setEntitiesToSubscribe((prev) =>
          prev.filter(([id2, deps2]) => !(id2 === id && equals(deps, deps2))),
        )
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityIds, setEntitiesToSubscribe])

  if (Array.isArray(entityId)) {
    return entityId.map((id) => entities[id])
  }

  return entities[entityId as string]
}

export const useEntityRef = (
  entityId: EntityId,
  deps?: Array<keyof HassEntity>,
) => {
  const entity = useEntity(entityId, deps)
  const entityRef = useRef(entity)
  useEffect(() => {
    entityRef.current = entity
  }, [entity])
  return entityRef
}
