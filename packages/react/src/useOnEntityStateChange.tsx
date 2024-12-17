import { addListener } from "@typed-assistant/connection/entityStore"
import { quietLogger } from "@typed-assistant/logger"
import type { EntityId } from "@typed-assistant/types"
import { ONE_MINUTE } from "@typed-assistant/utils/durations"
import type { HassEntity } from "home-assistant-js-websocket"
import { useEffect, useRef, useState } from "react"
import { entitiesAreDifferent } from "./entitiesAreDifferent"
import type { useEntity } from "./useEntity"

export const useOnEntityStateChange = (
  /** The entity to listen to. This should not change during the lifetime of the hook. */
  entityId: EntityId,
  /** The callback to call when the entity state changes. This can change during the lifetime of the hook and should be wrapped in useCallback. */
  onChange: (
    entity: HassEntity,
    previousEntity: HassEntity | undefined,
  ) => void,
  options: {
    /** Whether to call the onChange callback if the entity is already in the desired state when the hook is mounted. */
    callOnStartup?: boolean
    /** The time to wait before calling the onChange callback after the entity state changes. This can change during the lifetime of the hook. */
    for?: number
    /** The state to have changed from for the onChange callback to be called. This should not change during the lifetime of the hook. */
    from?: string
    /** The state to have changed to for the onChange callback to be called. This should not change during the lifetime of the hook. */
    to?: string
    /** The dependencies to listen to. Defaults to ["state"]. This should not change during the lifetime of the hook. */
    deps?: Parameters<typeof useEntity>[1]
  } = {},
) => {
  const depsRef = useRef<NonNullable<typeof options.deps>>(["state"])
  depsRef.current = options.deps ?? depsRef.current
  const isFirstUpdateRef = useRef(true)
  const { callOnStartup, for: forProp, from, to } = options
  const [pendingChange, setPendingChange] = useState<
    | {
        entity: HassEntity
        previousEntity: HassEntity | undefined
        changedAt: number
      }
    | undefined
  >()

  /* if forProp is given and a pending change is set, we need to call the onChange callback after the timeout */
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined

    const go = () => {
      if (!pendingChange || !forProp) return
      const timeToCall = pendingChange.changedAt + forProp
      const timeHasPassed = Date.now() >= timeToCall
      if (timeHasPassed) {
        onChange(pendingChange.entity, pendingChange.previousEntity)
        setPendingChange(undefined)
      } else {
        timeout = setTimeout(go, timeToCall - Date.now())
      }
    }

    go()

    return () => {
      clearTimeout(timeout)
    }
  }, [forProp, onChange, pendingChange])

  useEffect(() => {
    const removeListener = addListener((entities, prevEntities) => {
      const entity = entities[entityId]
      const previousEntity = prevEntities[entityId]
      if (!entity) return

      /* if the entity has not changed, we don't need to do anything */
      if (!entitiesAreDifferent(depsRef.current, previousEntity, entity)) return

      /* if this is the first update, we don't need to do anything unless callOnStartup is true */
      if (isFirstUpdateRef.current) {
        isFirstUpdateRef.current = false
        if (!callOnStartup) return
      }

      /* if from is given but the entity is not in that state, we don't need to do anything */
      if (from && previousEntity?.state !== from) {
        setPendingChange(undefined)
        return
      }

      /* if to is given but the entity is not in that state, we don't need to do anything */
      if (to && entity?.state !== to) {
        setPendingChange(undefined)
        return
      }

      /* if forProp is given, we set a pending change and stop there */
      if (forProp) {
        quietLogger.debug(
          { emoji: "⏱️" },
          `${entityId} is now "${entity?.state}". Waiting for ${forProp / ONE_MINUTE}mins`,
        )
        setPendingChange({ entity, previousEntity, changedAt: Date.now() })
        return
      }

      quietLogger.debug(
        { emoji: "🤸‍♀️" },
        `${entityId} is now "${entity?.state}"`,
      )
      /* if we've made it here, we need to call the onChange callback */
      onChange(entity, previousEntity)
    })

    return () => {
      removeListener()
    }
  }, [callOnStartup, entityId, forProp, from, onChange, to])
}
