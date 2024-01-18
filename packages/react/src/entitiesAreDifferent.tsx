import type { HassEntity } from "home-assistant-js-websocket"
import { equals, get } from "lodash/fp"
import type { AnyOtherString } from "@typed-assistant/types/misc-types"

export function entitiesAreDifferent(
  deps: Array<keyof HassEntity | AnyOtherString>,
  entityA?: HassEntity,
  entityB?: HassEntity,
) {
  return deps.some((dep) => !equals(get(dep, entityA), get(dep, entityB)))
}
