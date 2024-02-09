import { act, render } from "@testing-library/react"
import type { HassEntityAttributeBase } from "home-assistant-js-websocket"
import { beforeEach, expect, test, vi } from "vitest"
import { useEntity } from "./useEntity"
import { useOnEntityStateChange } from "./useOnEntityStateChange"

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

test("useOnEntityStateChange updates when the state changes on startup", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      callOnStartup: true,
    })
    return null
  })

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useOnEntityStateChange updates when the state changes", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback)
    return null
  })

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useOnEntityStateChange updates only when the from option is correct", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      from: "on",
    })
    return null
  })

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useOnEntityStateChange updates only when the to option is correct", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      to: "off",
    })
    return null
  })

  render(<TestComponent />)

  expect(TestComponent).toHaveBeenCalledTimes(1)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  const newEntities0 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities0)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useOnEntityStateChange updates only when the to and from options are correct", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      from: "on",
      to: "off",
    })
    return null
  })

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

  const newEntities5 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "other",
    },
  }
  mocks.connection.setEntities(newEntities5)
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useOnEntityStateChange updates when the for time has passed", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      to: "off",
      for: 1000,
    })
    return null
  })

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useOnEntityStateChange does not update when the for time has not passed", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      to: "off",
      for: 1000,
    })
    return null
  })

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities2)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities3)

  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  const newEntities4 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  }
  mocks.connection.setEntities(newEntities4)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  const newEntities5 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  }
  mocks.connection.setEntities(newEntities5)
  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useOnEntityStateChange does not take into account state that's already there first time", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      to: "off",
      for: 1000,
    })
    return null
  })
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
  expect(TestComponent).toHaveBeenCalledTimes(0)

  rerender(<Component showComponent={true} />)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    },
  })

  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useOnEntityStateChange by default only updates when the state changes", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      to: "off",
      for: 1000,
    })
    return null
  })

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useOnEntityStateChange updates when the passed deps change", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      to: "off",
      for: 1000,
      deps: ["state", "attributes.changed"],
    })
    return null
  })

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    },
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  mocks.connection.setEntities({
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: false } as HassEntityAttributeBase,
    },
  })
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

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
  expect(TestComponent).toHaveBeenCalledTimes(1)
})

test("useOnEntityStateChange still updates at the correct timeout when onChangeCallback changes", async () => {
  vi.useFakeTimers()
  const onChangeCallback = vi.fn(
    (washingMachineIsOn: boolean) => washingMachineIsOn,
  )
  const TestComponent = vi.fn(() => {
    const washingMachineState = useEntity("switch.washing_machine")?.state
    const washingMachineIsOn = washingMachineState === "on"

    useOnEntityStateChange(
      "sensor.washing_machine_is_running",
      () => {
        onChangeCallback(washingMachineIsOn)
      },
      { for: 1000, to: "off" },
    )
    return null
  })

  render(<TestComponent />)

  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(1)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "on" },
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  })
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenLastCalledWith(true)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "on" },
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities4 = {
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  }
  mocks.connection.setEntities(newEntities4)
  act(() => vi.advanceTimersByTime(997))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "off" },
    "sensor.washing_machine_is_running": { state: "off" },
  })
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  })
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "off" },
    "sensor.washing_machine_is_running": { state: "off" },
  })
  act(() => vi.advanceTimersByTime(1))

  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(onChangeCallback).toHaveBeenLastCalledWith(false)
  expect(TestComponent).toHaveBeenCalledTimes(5)

  // Ensure timeout is not called when "to" changes
  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "on" },
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  })
  act(() => vi.advanceTimersByTime(997))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "off" },
    "sensor.washing_machine_is_running": { state: "off" },
  })
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  })
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "off" },
    "sensor.washing_machine_is_running": { state: "on" },
  })
  act(() => vi.advanceTimersByTime(1))

  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(onChangeCallback).toHaveBeenLastCalledWith(false)
  expect(TestComponent).toHaveBeenCalledTimes(9)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "off" },
    "sensor.washing_machine_is_running": { state: "off" },
  })
  act(() => vi.advanceTimersByTime(1000))

  expect(onChangeCallback).toHaveBeenCalledTimes(3)
  expect(onChangeCallback).toHaveBeenLastCalledWith(false)
  expect(TestComponent).toHaveBeenCalledTimes(9)

  mocks.connection.setEntities({
    "switch.washing_machine": { state: "on" },
    "sensor.washing_machine_is_running": { state: "off" },
  })
  act(() => vi.advanceTimersByTime(1000))

  expect(onChangeCallback).toHaveBeenCalledTimes(3)
  expect(onChangeCallback).toHaveBeenLastCalledWith(false)
  expect(TestComponent).toHaveBeenCalledTimes(10)
})
