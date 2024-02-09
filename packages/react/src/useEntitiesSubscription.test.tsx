import { act, render } from "@testing-library/react"
import { HaConnectionMock } from "@typed-assistant/test-utils/HaConnectionMock"
import { useCallback } from "react"
import { expect, test, vi } from "vitest"
import { useEntitiesSubscription } from "./useEntitiesSubscription"

const connection = new HaConnectionMock()

test("useEntitiesSubscription calls back with updated entities", async () => {
  vi.useFakeTimers()
  const unmountCallback = vi.fn(() => {})
  const callback = vi.fn(() => unmountCallback)
  const TestComponent = ({ counter }: { counter: number }) => {
    useEntitiesSubscription(
      connection,
      useCallback(
        (...args) => {
          // @ts-ignore
          callback(...args, counter)
          return () => {
            unmountCallback()
          }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [counter],
      ),
    )
    return null
  }

  const { rerender, unmount } = render(<TestComponent counter={0} />)

  expect(callback).not.toHaveBeenCalled()

  const newEntities = {
    "switch.living_room_switch": { state: "off" },
  }
  connection.setEntities(newEntities)

  expect(callback).toHaveBeenCalledWith(newEntities, 0)
  expect(callback).toHaveBeenCalledTimes(1)

  act(() => vi.advanceTimersByTime(100))
  const newEntities2 = {
    "switch.living_room_switch": { state: "on" },
  }
  connection.setEntities(newEntities2)

  expect(callback).toHaveBeenCalledWith(newEntities2, 0)
  expect(callback).toHaveBeenCalledTimes(2)

  connection.clearHassEntitiesCallbacks()
  rerender(<TestComponent counter={1} />)

  expect(unmountCallback).toHaveBeenCalledTimes(1)

  act(() => vi.advanceTimersByTime(100))
  const newEntities3 = {
    "switch.living_room_switch": { state: "on" },
  }
  connection.setEntities(newEntities3)

  expect(callback).toHaveBeenCalledWith(newEntities3, 1)
  expect(callback).toHaveBeenCalledTimes(3)

  unmount()

  expect(unmountCallback).toHaveBeenCalledTimes(2)
})
