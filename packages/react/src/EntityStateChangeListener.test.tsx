import { act, render } from "@testing-library/react"
import { ONE_MINUTE, ONE_SECOND } from "@typed-assistant/utils/durations"
import type { HassEntityAttributeBase } from "home-assistant-js-websocket"
import { useCallback } from "react"
import { beforeEach, expect, test, vi } from "vitest"
import { EntityStateChangeListener } from "./EntityStateChangeListener"
import { useEntity } from "./useEntity"

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

beforeEach(() => {
  mocks.connection.setEntities({})
})

test("EntityStateChangeListener updates when the state changes on startup", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => (
    <EntityStateChangeListener
      entityId="light.bedroom_lamp_bulb"
      onChange={onChangeCallback}
      callOnStartup
    />
  ))

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities["light.bedroom_lamp_bulb"],
    undefined,
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities2)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities3["light.bedroom_lamp_bulb"],
    newEntities2["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
})

test("EntityStateChangeListener updates when the state changes", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => (
    <EntityStateChangeListener
      entityId="light.bedroom_lamp_bulb"
      onChange={onChangeCallback}
    />
  ))

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities2)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities3["light.bedroom_lamp_bulb"],
    newEntities2["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
})

test("EntityStateChangeListener updates only when the from option is correct", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => (
    <EntityStateChangeListener
      entityId="light.bedroom_lamp_bulb"
      onChange={onChangeCallback}
      from="on"
    />
  ))

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities2)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities2["light.bedroom_lamp_bulb"],
    newEntities["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  const newEntities4 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities4)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities4["light.bedroom_lamp_bulb"],
    newEntities3["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
})

test("EntityStateChangeListener updates only when the to option is correct", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => (
    <EntityStateChangeListener
      entityId="light.bedroom_lamp_bulb"
      onChange={onChangeCallback}
      to="off"
    />
  ))

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities0 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities0)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities2)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities2["light.bedroom_lamp_bulb"],
    newEntities["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  const newEntities4 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities4)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities4["light.bedroom_lamp_bulb"],
    newEntities3["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
})

test("EntityStateChangeListener updates only when the to and from options are correct", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => (
    <EntityStateChangeListener
      entityId="light.bedroom_lamp_bulb"
      onChange={onChangeCallback}
      from="on"
      to="off"
    />
  ))

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities2)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities2["light.bedroom_lamp_bulb"],
    newEntities["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  const newEntities4 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities4)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities4["light.bedroom_lamp_bulb"],
    newEntities3["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  const newEntities5 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "other",
    },
  }
  mocks.connection.setEntities(newEntities5)
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
})

test("EntityStateChangeListener updates when the for time has passed", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => (
    <EntityStateChangeListener
      entityId="light.bedroom_lamp_bulb"
      onChange={onChangeCallback}
      to="off"
      for={1000}
    />
  ))

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities2)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
    "light.unrelated_update": {
      entity_id: "light.unrelated_update",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities3)
  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities2["light.bedroom_lamp_bulb"],
    newEntities["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
})

test("EntityStateChangeListener does not update when the for time has not passed", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => (
    <EntityStateChangeListener
      entityId="light.bedroom_lamp_bulb"
      onChange={onChangeCallback}
      to="off"
      for={1000}
    />
  ))

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities2)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities3)

  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities4 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities4)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities5 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities5)
  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities6 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities6)
  act(() => vi.advanceTimersByTime(1000))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities6["light.bedroom_lamp_bulb"],
    newEntities5["light.bedroom_lamp_bulb"],
  )
})

test("EntityStateChangeListener does not take into account state that's already there first time", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => (
    <EntityStateChangeListener
      entityId="light.bedroom_lamp_bulb"
      onChange={onChangeCallback}
      to="off"
      for={1000}
    />
  ))
  const Component = ({ showComponent }: { showComponent: boolean }) => (
    <>{showComponent ? <TestComponent /> : null}</>
  )
  const { rerender } = render(<Component showComponent={false} />)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  })

  rerender(<Component showComponent={true} />)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  })

  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
})

test("EntityStateChangeListener by default only updates when the state changes", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => (
    <EntityStateChangeListener
      entityId="light.bedroom_lamp_bulb"
      onChange={onChangeCallback}
      to="off"
      for={1000}
    />
  ))

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: false } as HassEntityAttributeBase,
    },
  }
  mocks.connection.setEntities(newEntities2)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // Not affected by this updated
  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: true } as HassEntityAttributeBase,
    },
  }
  mocks.connection.setEntities(newEntities3)

  // Still calls callback after the 1000ms
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    newEntities2["light.bedroom_lamp_bulb"],
    newEntities["light.bedroom_lamp_bulb"],
  )
})

test("EntityStateChangeListener updates when the passed deps change", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => (
    <EntityStateChangeListener
      entityId="light.bedroom_lamp_bulb"
      onChange={onChangeCallback}
      to="off"
      for={1000}
      deps={["state", "attributes.changed"]}
    />
  ))

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: false } as HassEntityAttributeBase,
    },
  })
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // Is affected by this updated
  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: true } as HassEntityAttributeBase,
    },
  })

  // timeout reset by above update
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(onChangeCallback).toHaveBeenLastCalledWith(
    {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: true } as HassEntityAttributeBase,
    },
    {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: false } as HassEntityAttributeBase,
    },
  )
})

test("EntityStateChangeListener still updates at the correct timeout when onChangeCallback changes", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(
    (washingMachineIsOn: boolean) => washingMachineIsOn,
  )
  const TestComponent = vi.fn(() => {
    const washingMachineState = useEntity("switch.washing_machine")?.state
    const washingMachineIsOn = washingMachineState === "on"

    return (
      <EntityStateChangeListener
        entityId="sensor.washing_machine_is_running"
        onChange={useCallback(() => {
          onChangeCallback(washingMachineIsOn)
        }, [washingMachineIsOn])}
        to="off"
        for={1000}
      />
    )
  })

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // Set the initial state to on
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "on" },
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // Set the state to off and begin the timeout
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  })

  // advance time to the cusp of calling onChange
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // advance time to the timeout
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenLastCalledWith(true)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  // Set the state to on again
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "on" },
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  // Set the state to off and begin the timeout again
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  })

  // advance time to the cusp of calling onChange again
  act(() => vi.advanceTimersByTime(997))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  // Change the onChangeCallback by updating state it relies on
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "off" },
    "sensor.washing_machine_is_running": { state: "off" },
  })

  // inch closer to the timeout
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  // Change the onChangeCallback again by updating state it relies on
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  })

  // closer...
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  // Change the onChangeCallback again by updating state it relies on
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "off" },
    "sensor.washing_machine_is_running": { state: "off" },
  })

  // advance time to the timeout
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(onChangeCallback).toHaveBeenLastCalledWith(false)

  // Set the state to on again
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "on" },
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  // Set the state to off and begin the timeout again
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  })

  // advance time to the cusp of calling onChange again
  act(() => vi.advanceTimersByTime(997))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  // Change the onChangeCallback by updating state it relies on
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "off" },
    "sensor.washing_machine_is_running": { state: "off" },
  })

  // inch closer to the timeout
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  // Change the onChangeCallback by updating state it relies on
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  })

  // closer...
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  // cancel timeout by setting the state to on
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "off" },
    "sensor.washing_machine_is_running": { state: "on" },
  })

  // advance well into the future
  act(() => vi.advanceTimersByTime(10 * ONE_MINUTE))

  // timeout was successfully cancelled
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
})

test("EntityStateChangeListener still updates at the correct timeout when the for prop increases", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    const delayTime = Number(
      useEntity("sensor.delay_time")?.state ?? ONE_MINUTE,
    )

    return (
      <EntityStateChangeListener
        entityId="binary_sensor.bedroom_motion_sensor_occupancy"
        onChange={useCallback(() => {
          onChangeCallback()
        }, [])}
        to="on"
        for={delayTime}
      />
    )
  })

  render(<TestComponent />)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // Set the initial state to off
  mocks.connection.setEntities({
    "binary_sensor.bedroom_motion_sensor_occupancy": {
      state: "off",
    },
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // Set the state to on and begin the timeout
  mocks.connection.setEntities({
    "binary_sensor.bedroom_motion_sensor_occupancy": {
      state: "on",
    },
  })

  // advance time to the cusp of calling onChange
  act(() => vi.advanceTimersByTime(ONE_MINUTE - 1))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // Set the delay time to 3 minutes
  mocks.connection.setEntities({
    "sensor.delay_time": {
      state: `${3 * ONE_MINUTE}`,
    },
  })

  // advance time to the original for value
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // advance time to the cusp of calling onChange again
  act(() => vi.advanceTimersByTime(ONE_MINUTE * 2 - 1))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // advance time to the new for value
  act(() => vi.advanceTimersByTime(1))

  expect(onChangeCallback).toHaveBeenCalledTimes(1)
})

test("EntityStateChangeListener still updates at the correct timeout when the for prop decreases", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    const delayTime = Number(
      useEntity("sensor.delay_time")?.state ?? ONE_MINUTE,
    )

    return (
      <EntityStateChangeListener
        entityId="binary_sensor.bedroom_motion_sensor_occupancy"
        onChange={useCallback(() => {
          onChangeCallback()
        }, [])}
        to="on"
        for={delayTime}
      />
    )
  })

  render(<TestComponent />)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // Set the initial state to off
  mocks.connection.setEntities({
    "binary_sensor.bedroom_motion_sensor_occupancy": {
      state: "off",
    },
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // Set the state to on and begin the timeout
  mocks.connection.setEntities({
    "binary_sensor.bedroom_motion_sensor_occupancy": {
      state: "on",
    },
  })

  // advance time to the cusp of calling onChange
  act(() => vi.advanceTimersByTime(ONE_MINUTE - 1))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  // Set the delay time to 30 seconds
  mocks.connection.setEntities({
    "sensor.delay_time": {
      state: `${30 * ONE_SECOND}`,
    },
  })

  expect(onChangeCallback).toHaveBeenCalledTimes(1)
})
