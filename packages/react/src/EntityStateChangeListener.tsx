import type { HassEntity } from "home-assistant-js-websocket"
import { useOnEntityStateChange } from "./useOnEntityStateChange"
import type { EntityId } from "@typed-assistant/types"

export const EntityStateChangeListener = ({
  /** The entity to listen to. This should not change during the lifetime of the component. */
  entityId,
  /** The callback to call when the entity state changes. This can change during the lifetime of the component and should be wrapped in useCallback. */
  onChange,
  /** Whether to call the onChange callback if the entity is already in the desired state when the component is mounted. */
  callOnStartup,
  /** The dependencies to listen to. Defaults to ["state"]. This should not change during the lifetime of the component. */
  deps,
  /** The time to wait before calling the onChange callback after the entity state changes. This can change during the lifetime of the component. */
  for: forProp,
  /** The state to have changed from for the onChange callback to be called. This should not change during the lifetime of the component. */
  from,
  /** The state to have changed to for the onChange callback to be called. This should not change during the lifetime of the component. */
  to,
}: {
  entityId: EntityId
  onChange: (entity: HassEntity) => void
} & Parameters<typeof useOnEntityStateChange>[2]) => {
  useOnEntityStateChange(entityId, onChange, {
    callOnStartup,
    deps,
    for: forProp,
    from,
    to,
  })
  return null
}
