import { addListener } from "@typed-assistant/connection/entityStore"
import { quietLogger } from "@typed-assistant/logger"
import type { EntityId } from "@typed-assistant/types"
import { ONE_MINUTE } from "@typed-assistant/utils/durations"
import type { HassEntity } from "home-assistant-js-websocket"
import { useEffect, useRef } from "react"
import { entitiesAreDifferent } from "./entitiesAreDifferent"
import type { useEntity } from "./useEntity"

export const useOnEntityStateChange = (
  entityId: EntityId,
  onChangeCallback: (
    entity: HassEntity,
    previousEntity: HassEntity | undefined,
  ) => void | (() => void),
  options: {
    callOnStartup?: boolean
    for?: number
    from?: string
    to?: string
    deps?: Parameters<typeof useEntity>[1]
  } = {},
) => {
  const depsRef = useRef<NonNullable<typeof options.deps>>(["state"])
  depsRef.current = options.deps ?? depsRef.current
  const onChangeCallbackRef = useRef(onChangeCallback)
  onChangeCallbackRef.current = onChangeCallback
  const isFirstUpdateRef = useRef(true)
  const { callOnStartup, for: forProp, from, to } = options

  useEffect(() => {
    let unmount: ReturnType<typeof onChangeCallbackRef.current> | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined
    const removeListener = addListener((entities, prevEntities) => {
      const entity = entities[entityId]
      const previousEntity = prevEntities[entityId]
      if (!entity) return
      if (!entitiesAreDifferent(depsRef.current, previousEntity, entity)) return

      clearTimeout(timeout)
      unmount?.()

      if (isFirstUpdateRef.current) {
        isFirstUpdateRef.current = false
        if (!callOnStartup) return
      }

      if (from && previousEntity?.state !== from) return
      if (to && entity?.state !== to) return

      if (!forProp) {
        quietLogger.debug(
          { emoji: "🤸‍♀️" },
          `${entityId} is now "${entity?.state}"`,
        )
        unmount = onChangeCallbackRef.current(entity, previousEntity)
        return
      }

      quietLogger.debug(
        { emoji: "⏱️" },
        `${entityId} is now "${entity?.state}". Waiting for ${forProp / ONE_MINUTE}mins`,
      )
      timeout = setTimeout(() => {
        quietLogger.debug(
          { emoji: "🤸‍♀️" },
          `${entityId} has been "${entity?.state}" for ${forProp / ONE_MINUTE}mins`,
        )
        unmount = onChangeCallbackRef.current(entity, previousEntity)
      }, forProp)
    })
    return () => {
      removeListener()
      clearTimeout(timeout)
      unmount?.()
    }
  }, [callOnStartup, entityId, forProp, from, to])
}
