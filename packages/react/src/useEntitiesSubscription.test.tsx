import { act, render } from "@testing-library/react"
import type { HassEntities, HassEntity } from "home-assistant-js-websocket"
import { expect, test, vi } from "vitest"
import React, { useCallback } from "react"
import type { HaConnection } from "./HaConnection"
import { useEntitiesSubscription } from "./useEntitiesSubscription"

vi.mock("./HaConnection", () => ({ HaConnection: HaConnectionMock }))

let getHassEntitiesCallbacks: ((newEntities: HassEntities) => void)[] = []
const getHassEntitiesUnsubscribe = vi.fn(() => {})
function HaConnectionMock() {
  return {
    connection: true,
    getHassEntities: vi.fn((callback: (newEntities: HassEntities) => void) => {
      getHassEntitiesCallbacks.push(callback)
      return getHassEntitiesUnsubscribe
    }),
    tryConnect: () => {},
  } as unknown as HaConnection
}

function updateAllCallbacks(newEntities: HassEntities) {
  getHassEntitiesCallbacks.forEach((getHassEntitiesCallback) => {
    act(() => getHassEntitiesCallback(newEntities))
  })
}

test("useEntitiesSubscription calls back with updated entities", async () => {
  vi.useFakeTimers()
  const unmountCallback = vi.fn(() => {})
  const callback = vi.fn(() => unmountCallback)
  const TestComponent = ({ counter }: { counter: number }) => {
    useEntitiesSubscription(
      useCallback(
        (...args) => {
          // @ts-ignore
          callback(...args, counter)
          return () => {
            unmountCallback()
          }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [counter]
      )
    )
    return null
  }

  const { rerender, unmount } = render(<TestComponent counter={0} />)

  expect(callback).not.toHaveBeenCalled()

  const newEntities = {
    "switch.living_room_switch": { state: "off" } as HassEntity,
  }
  updateAllCallbacks(newEntities)

  expect(callback).toHaveBeenCalledWith(newEntities, 0)
  expect(callback).toHaveBeenCalledTimes(1)

  act(() => vi.advanceTimersByTime(100))
  const newEntities2 = {
    "switch.living_room_switch": { state: "on" } as HassEntity,
  }
  updateAllCallbacks(newEntities2)

  expect(callback).toHaveBeenCalledWith(newEntities2, 0)
  expect(callback).toHaveBeenCalledTimes(2)

  getHassEntitiesCallbacks = []
  rerender(<TestComponent counter={1} />)

  expect(unmountCallback).toHaveBeenCalledTimes(1)

  act(() => vi.advanceTimersByTime(100))
  const newEntities3 = {
    "switch.living_room_switch": { state: "on" } as HassEntity,
  }
  updateAllCallbacks(newEntities3)

  expect(callback).toHaveBeenCalledWith(newEntities3, 1)
  expect(callback).toHaveBeenCalledTimes(3)

  unmount()

  expect(unmountCallback).toHaveBeenCalledTimes(2)
})
