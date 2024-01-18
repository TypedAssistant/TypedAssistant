import { act, render } from "@testing-library/react"
import { HaConnectionMock } from "@typed-assistant/test-utils/HaConnectionMock"
import {
  ONE_HOUR,
  ONE_MINUTE,
  ONE_SECOND,
} from "@typed-assistant/utils/durations"
import { expect, test, vi } from "vitest"
import { EntitiesProvider } from "./entities"
import { useEntity } from "./useEntity"
import { useSchedule } from "./useSchedule"

const connection = new HaConnectionMock()

test("useSchedule schedules actions at specific times", async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2021-01-01T00:00:00Z"))
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useSchedule([["01:00", onChangeCallback]])
    return null
  })

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
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
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "off" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR - ONE_SECOND))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
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
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
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
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "off" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR - 1))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(1))

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
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

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "off" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 24))
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Saturday",
    "12:00:00 AM",
  ])

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 24))
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Sunday",
    "12:00:00 AM",
  ])

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(ONE_HOUR * 5))
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Sunday",
    "5:00:00 AM",
  ])

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  connection.setEntities({
    "light.bedroom_lamp_bulb": { state: "on" },
  })

  act(() => vi.advanceTimersByTime(ONE_MINUTE * 59))
  expect([days[new Date().getDay()], new Date().toLocaleTimeString()]).toEqual([
    "Sunday",
    "5:59:00 AM",
  ])

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  connection.setEntities({
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
