import type { EntityId } from "@typed-assistant/types"
import type { HassEntity } from "home-assistant-js-websocket"
import React, { useEffect, useRef } from "react"
import { useEntity } from "./useEntity"
import { quietLogger } from "@typed-assistant/logger"
import { ONE_MINUTE } from "@typed-assistant/utils/durations"
import { entitiesAreDifferent } from "./entitiesAreDifferent"

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
  const depsRef = useRef<typeof options.deps>(options.deps ?? ["state"])
  const previousEntityStateRef = React.useRef<HassEntity | undefined>(undefined)
  const previousOnChangeCallbackRef = useRef(onChangeCallback)
  const isFirstUpdateRef = useRef(true)
  const { callOnStartup, for: forProp, from, to } = options
  const entity = useEntity(entityId, depsRef.current)
  const timeoutStartRef = useRef<number | undefined>()

  useEffect(() => {
    if (!entity) return

    let unmount: ReturnType<typeof onChangeCallback> | undefined
    const previousOnChangeCallback = previousOnChangeCallbackRef.current
    const previousEntity = previousEntityStateRef.current
    previousOnChangeCallbackRef.current = onChangeCallback
    previousEntityStateRef.current = entity

    if (isFirstUpdateRef.current) {
      isFirstUpdateRef.current = false
      if (!callOnStartup) return
    }

    if (from && previousEntity?.state !== from) return
    if (to && entity?.state !== to) return

    if (
      previousOnChangeCallback !== onChangeCallback &&
      timeoutStartRef.current &&
      forProp
    ) {
      const newFor = forProp - (Date.now() - timeoutStartRef.current)
      if (newFor < 0) return
      const timeout = setTimeout(() => {
        quietLogger.debug(
          { emoji: "🤸‍♀️" },
          `${entityId} has been "${entity?.state}" for ${
            forProp / ONE_MINUTE
          }mins`,
        )
        timeoutStartRef.current = undefined
        unmount = onChangeCallback(entity, previousEntity)
      }, newFor)
      return () => {
        clearTimeout(timeout)
        unmount?.()
      }
    }
    if (
      !entitiesAreDifferent(
        depsRef.current ?? ["state"],
        previousEntity,
        entity,
      )
    )
      return

    if (!forProp) {
      quietLogger.debug(
        { emoji: "🤸‍♀️" },
        `${entityId} is now "${entity?.state}"`,
      )
      unmount = onChangeCallback(entity, previousEntity)
      return () => {
        unmount?.()
      }
    }

    quietLogger.debug(
      { emoji: "⏱️" },
      `${entityId} is now "${entity?.state}". Waiting for ${
        forProp / ONE_MINUTE
      }mins`,
    )
    timeoutStartRef.current = Date.now()
    const timeout = setTimeout(() => {
      quietLogger.debug(
        { emoji: "🤸‍♀️" },
        `${entityId} has been "${entity?.state}" for ${
          forProp / ONE_MINUTE
        }mins`,
      )
      timeoutStartRef.current = undefined
      unmount = onChangeCallback(entity, previousEntity)
    }, forProp)
    return () => {
      clearTimeout(timeout)
      unmount?.()
    }
  }, [callOnStartup, entity, entityId, forProp, from, onChangeCallback, to])
}
