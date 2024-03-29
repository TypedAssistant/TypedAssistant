import { act, render } from "@testing-library/react"
import {
  ONE_HOUR,
  ONE_MINUTE,
  ONE_SECOND,
} from "@typed-assistant/utils/durations"
import { expect, test, vi } from "vitest"
import { useEntity } from "./useEntity"
import { useSchedule } from "./useSchedule"

const mocks = await vi.hoisted(async () => {
  const { HaConnectionMock } = await import(
    "@typed-assistant/test-utils/HaConnectionMock"
  )

  return {
    connection: new HaConnectionMock(),
  }
})
vi.mock("@typed-assistant/connection/global", () => ({
  connection: mocks.connection,
}))
vi.mock("@typed-assistant/utils/getHassAPI", () => ({
  getHassToken: () => "token-abc-123",
  getHassUrl: () => "http://192.168.86.1:8123",
}))

const days = {
  "0": "Sunday",
  "1": "Monday",
  "2": "Tuesday",
  "3": "Wednesday",
  "4": "Thursday",
  "5": "Friday",
  "6": "Saturday",
} as Record<string, string>

test("useSchedule schedules actions at specific times", async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2021-01-01T00:00:00Z"))
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useSchedule([["01:00", onChangeCallback]])
    return null
  })

  render(<TestComponent />)

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

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "off" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR - ONE_SECOND))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(ONE_SECOND))

  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(3)
})

test("useSchedule schedules for the next day when time has already passed", async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2021-01-01T12:00:00Z"))
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useSchedule([["11:00", onChangeCallback]])
    return null
  })

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  act(() => vi.advanceTimersByTime(ONE_HOUR * 12))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  act(() => vi.advanceTimersByTime(ONE_HOUR * 12))

  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  act(() => vi.advanceTimersByTime(ONE_HOUR * 23))

  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  act(() => vi.advanceTimersByTime(ONE_HOUR * 24))

  expect(onChangeCallback).toHaveBeenCalledTimes(3)
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

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "off" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR - 1))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(1))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 24))

  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(3)
})

test("useSchedule accepts days of week", async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2021-01-01T00:00:00Z"))

  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Friday",
    "12:00:00 AM",
  ])
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useEntity("light.bedroom_lamp_bulb")
    useSchedule([
      // 25 hours from now
      ["Sunday@06:00", onChangeCallback],
    ])
    return null
  })

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "off" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 24))
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Saturday",
    "12:00:00 AM",
  ])

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 24))
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Sunday",
    "12:00:00 AM",
  ])

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 5))
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Sunday",
    "5:00:00 AM",
  ])

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(ONE_MINUTE * 59))
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Sunday",
    "5:59:00 AM",
  ])

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(ONE_MINUTE * 1))
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Sunday",
    "6:00:00 AM",
  ])

  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(3)
})

test.only("useSchedule accepts days form an entity's state", async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2021-01-01T00:00:00Z"))
  mocks.connection.setEntities({
    "sun.sun": {
      attributes: { next_rising: "2021-01-01T09:00:00.328668+00:00" },
    },
  })
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Friday",
    "12:00:00 AM",
  ])
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    const sunState = useEntity("sun.sun", ["attributes"])
    const sunRise = sunState?.attributes.next_rising as string | undefined

    useSchedule([[sunRise, onChangeCallback]])
    return null
  })

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  act(() => vi.advanceTimersByTime(ONE_HOUR * 10))
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Friday",
    "10:00:00 AM",
  ])

  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  mocks.connection.setEntities({
    "sun.sun": {
      attributes: { next_rising: "2021-01-02T08:00:00.328668+00:00" },
    },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 24))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
})
