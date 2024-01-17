import { act, render } from "@testing-library/react"
import type { HassEntities, HassEntity } from "home-assistant-js-websocket"
import { expect, test, vi } from "vitest"
import type { HaConnection } from "./HaConnection"
import { EntitiesProvider, useEntity } from "./entities"
import { useSchedule } from "./useSchedule"
import { ONE_HOUR, ONE_MINUTE, ONE_SECOND } from "../durations"

vi.mock("./HaConnection", () => ({ HaConnection: HaConnectionMock }))

const getHassEntitiesCallbacks: ((newEntities: HassEntities) => void)[] = []
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

test("useSchedule schedules actions at specific times", async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2021-01-01T00:00:00Z"))
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useSchedule([["01:00", onChangeCallback]])
    return null
  })

  render(
    <EntitiesProvider>
      <TestComponent />
    </EntitiesProvider>
  )

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  act(() => vi.advanceTimersByTime(ONE_HOUR - 1))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  act(() => vi.advanceTimersByTime(1))

  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useSchedule reschedules the task when the component rerenders", async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2021-01-01T00:00:00Z"))
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useEntity("light.bedroom_lamp_bulb")
    useSchedule([
      [
        "01:00",
        () => {
          onChangeCallback()
        },
      ],
    ])
    return null
  })

  render(
    <EntitiesProvider>
      <TestComponent />
    </EntitiesProvider>
  )

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  updateAllCallbacks({
    "light.bedroom_lamp_bulb": { state: "off" } as HassEntity,
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR - ONE_SECOND))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  updateAllCallbacks({
    "light.bedroom_lamp_bulb": { state: "on" } as HassEntity,
  })

  act(() => vi.advanceTimersByTime(ONE_SECOND))

  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  // expect(TestComponent).toHaveBeenCalledTimes(3)
})

test("useSchedule schedules for the next day when time has already passed", async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2021-01-01T12:00:00Z"))
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useSchedule([["11:00", onChangeCallback]])
    return null
  })

  render(
    <EntitiesProvider>
      <TestComponent />
    </EntitiesProvider>
  )

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  act(() => vi.advanceTimersByTime(ONE_HOUR * 12))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  act(() => vi.advanceTimersByTime(ONE_HOUR * 12))

  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useSchedule accepts dateTimes", async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2021-01-01T00:00:00Z"))
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useEntity("light.bedroom_lamp_bulb")
    useSchedule([
      // 25 hours from now
      [new Date("2021-01-02T01:00:00Z").toISOString(), onChangeCallback],
    ])
    return null
  })

  render(
    <EntitiesProvider>
      <TestComponent />
    </EntitiesProvider>
  )

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  updateAllCallbacks({
    "light.bedroom_lamp_bulb": { state: "off" } as HassEntity,
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR - 1))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  updateAllCallbacks({
    "light.bedroom_lamp_bulb": { state: "on" } as HassEntity,
  })

  act(() => vi.advanceTimersByTime(1))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  updateAllCallbacks({
    "light.bedroom_lamp_bulb": { state: "on" } as HassEntity,
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 24))

  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(3)
})

test("useSchedule accepts days of week", async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2021-01-01T00:00:00Z"))
  const days = {
    "0": "Sunday",
    "1": "Monday",
    "2": "Tuesday",
    "3": "Wednesday",
    "4": "Thursday",
    "5": "Friday",
    "6": "Saturday",
  } as Record<string, string>
  console.log(days[new Date().getDay()], new Date().toLocaleTimeString())
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useEntity("light.bedroom_lamp_bulb")
    useSchedule([
      // 25 hours from now
      ["Sunday@06:00", onChangeCallback],
    ])
    return null
  })

  render(
    <EntitiesProvider>
      <TestComponent />
    </EntitiesProvider>
  )

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  updateAllCallbacks({
    "light.bedroom_lamp_bulb": { state: "off" } as HassEntity,
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 24))
  console.log(days[new Date().getDay()], new Date().toLocaleTimeString())

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  updateAllCallbacks({
    "light.bedroom_lamp_bulb": { state: "on" } as HassEntity,
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 24))
  console.log(days[new Date().getDay()], new Date().toLocaleTimeString())

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  updateAllCallbacks({
    "light.bedroom_lamp_bulb": { state: "on" } as HassEntity,
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 5))
  console.log(days[new Date().getDay()], new Date().toLocaleTimeString())

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  updateAllCallbacks({
    "light.bedroom_lamp_bulb": { state: "on" } as HassEntity,
  })

  act(() => vi.advanceTimersByTime(ONE_MINUTE * 59))
  console.log(days[new Date().getDay()], new Date().toLocaleTimeString())

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  updateAllCallbacks({
    "light.bedroom_lamp_bulb": { state: "on" } as HassEntity,
  })

  act(() => vi.advanceTimersByTime(ONE_MINUTE * 1))
  console.log(days[new Date().getDay()], new Date().toLocaleTimeString())

  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(3)
})
