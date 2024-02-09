import { act, render } from "@testing-library/react"
import type {
  HassEntity,
  HassEntityAttributeBase,
} from "home-assistant-js-websocket"
import { useCallback } from "react"
import { expect, test, vi } from "vitest"
import { EntitiesProvider } from "./entities"
import { useEntity } from "./useEntity"
import { useOnEntityStateChange } from "./useOnEntityStateChange"
import { HaConnectionMock } from "@typed-assistant/test-utils/HaConnectionMock"

const connection = new HaConnectionMock()

test("useOnEntityStateChange updates when the state changes on startup", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      callOnStartup: true,
    })
    return null
  })

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).not.toHaveBeenCalled()

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities["light.bedroom_lamp_bulb"],
    undefined,
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities2)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities3["light.bedroom_lamp_bulb"],
    newEntities2["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(TestComponent).toHaveBeenCalledTimes(3)
})

test("useOnEntityStateChange updates when the state changes", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback)
    return null
  })

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).not.toHaveBeenCalled()

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities2)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
    "light.living_room_light": {
      entity_id: "light.living_room_light",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities3["light.bedroom_lamp_bulb"],
    newEntities2["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(3)
})

test("useOnEntityStateChange updates only when the from option is correct", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      from: "on",
    })
    return null
  })

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).not.toHaveBeenCalled()

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities2)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities2["light.bedroom_lamp_bulb"],
    newEntities["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(3)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(4)

  const newEntities4 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities4)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities4["light.bedroom_lamp_bulb"],
    newEntities3["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(TestComponent).toHaveBeenCalledTimes(5)
})

test("useOnEntityStateChange updates only when the to option is correct", async () => {
  const onChangeCallback = vi.fn(() => {})
  const TestComponent = vi.fn(() => {
    useOnEntityStateChange("light.bedroom_lamp_bulb", onChangeCallback, {
      to: "off",
    })
    return null
  })

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).not.toHaveBeenCalled()

  const newEntities0 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities0)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(3)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities2)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities2["light.bedroom_lamp_bulb"],
    newEntities["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(4)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(5)

  const newEntities4 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities4)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities4["light.bedroom_lamp_bulb"],
    newEntities3["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(TestComponent).toHaveBeenCalledTimes(6)
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

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).not.toHaveBeenCalled()

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities2)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities2["light.bedroom_lamp_bulb"],
    newEntities["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(3)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(4)

  const newEntities4 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities4)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities4["light.bedroom_lamp_bulb"],
    newEntities3["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(TestComponent).toHaveBeenCalledTimes(5)

  const newEntities5 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "other",
    } as HassEntity,
  }
  connection.setEntities(newEntities5)
  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(TestComponent).toHaveBeenCalledTimes(6)
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

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).not.toHaveBeenCalled()

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities2)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
    "light.unrelated_update": {
      entity_id: "light.unrelated_update",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities3)
  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities2["light.bedroom_lamp_bulb"],
    newEntities["light.bedroom_lamp_bulb"],
  )
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(3)
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

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).not.toHaveBeenCalled()

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities2)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).not.toHaveBeenCalled()
  expect(TestComponent).toHaveBeenCalledTimes(3)

  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities3)

  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(4)

  const newEntities4 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities4)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).not.toHaveBeenCalled()
  expect(TestComponent).toHaveBeenCalledTimes(5)

  const newEntities5 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities5)
  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(6)

  const newEntities6 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities6)
  act(() => vi.advanceTimersByTime(1000))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities6["light.bedroom_lamp_bulb"],
    newEntities5["light.bedroom_lamp_bulb"],
  )
  expect(TestComponent).toHaveBeenCalledTimes(7)
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
    <EntitiesProvider connection={connection}>
      {showComponent ? <TestComponent /> : null}
    </EntitiesProvider>
  )
  const { rerender } = render(<Component showComponent={false} />)

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(TestComponent).toHaveBeenCalledTimes(0)

  rerender(<Component showComponent={true} />)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
    } as HassEntity,
  }
  connection.setEntities(newEntities2)

  act(() => vi.advanceTimersByTime(1001))
  expect(onChangeCallback).not.toHaveBeenCalled()
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

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).not.toHaveBeenCalled()

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: false } as HassEntityAttributeBase,
    } as HassEntity,
  }
  connection.setEntities(newEntities2)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).not.toHaveBeenCalled()
  expect(TestComponent).toHaveBeenCalledTimes(3)

  // Not affected by this updated
  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: true } as HassEntityAttributeBase,
    } as HassEntity,
  }
  connection.setEntities(newEntities3)

  // Still calls callback after the 1000ms
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities2["light.bedroom_lamp_bulb"],
    newEntities["light.bedroom_lamp_bulb"],
  )
  expect(TestComponent).toHaveBeenCalledTimes(3)
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

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).not.toHaveBeenCalled()

  const newEntities = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "on",
    } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities2 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: false } as HassEntityAttributeBase,
    } as HassEntity,
  }
  connection.setEntities(newEntities2)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).not.toHaveBeenCalled()
  expect(TestComponent).toHaveBeenCalledTimes(3)

  // Is affected by this updated
  const newEntities3 = {
    "light.bedroom_lamp_bulb": {
      entity_id: "light.bedroom_lamp_bulb",
      state: "off",
      attributes: { changed: true } as HassEntityAttributeBase,
    } as HassEntity,
  }
  connection.setEntities(newEntities3)

  // timeout reset by above update
  act(() => vi.advanceTimersByTime(1))
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  act(() => vi.advanceTimersByTime(999))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(onChangeCallback).toHaveBeenCalledWith(
    newEntities3["light.bedroom_lamp_bulb"],
    newEntities2["light.bedroom_lamp_bulb"],
  )
  expect(TestComponent).toHaveBeenCalledTimes(4)
})

test("useOnEntityStateChange still updates at the correct timeout when onChangeCallback changes", async () => {
  vi.useFakeTimers()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onChangeCallback = vi.fn((washingMachineIsOn: boolean) => {})
  const TestComponent = vi.fn(() => {
    const washingMachineState = useEntity("switch.washing_machine")?.state
    const washingMachineIsOn = washingMachineState === "on"
    const callback = useCallback(() => {
      onChangeCallback(washingMachineIsOn)
    }, [washingMachineIsOn])

    useOnEntityStateChange("sensor.washing_machine_is_running", callback, {
      for: 1000,
      to: "off",
    })
    return null
  })

  render(
    <EntitiesProvider connection={connection}>
      <TestComponent />
    </EntitiesProvider>,
  )

  expect(onChangeCallback).not.toHaveBeenCalled()

  const newEntities = {
    "switch.washing_machine": { state: "on" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "on" } as HassEntity,
  }
  connection.setEntities(newEntities)
  expect(onChangeCallback).toHaveBeenCalledTimes(0)
  expect(TestComponent).toHaveBeenCalledTimes(2)

  const newEntities2 = {
    "switch.washing_machine": { state: "on" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "off" } as HassEntity,
  }
  connection.setEntities(newEntities2)
  act(() => vi.advanceTimersByTime(500))
  expect(onChangeCallback).not.toHaveBeenCalled()
  expect(TestComponent).toHaveBeenCalledTimes(3)

  act(() => vi.advanceTimersByTime(500))
  expect(onChangeCallback).toHaveBeenCalledWith(true)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(3)

  // Ensure timeout is still called when callback deps change
  // "to" stays the same
  const newEntities3 = {
    "switch.washing_machine": { state: "on" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "on" } as HassEntity,
  }
  connection.setEntities(newEntities3)
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(4)

  const newEntities4 = {
    "switch.washing_machine": { state: "on" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "off" } as HassEntity,
  }
  connection.setEntities(newEntities4)
  act(() => vi.advanceTimersByTime(500))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)
  expect(TestComponent).toHaveBeenCalledTimes(5)

  const newEntities5 = {
    "switch.washing_machine": { state: "off" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "off" } as HassEntity,
  }
  connection.setEntities(newEntities5)
  act(() => vi.advanceTimersByTime(100))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  const newEntities6 = {
    "switch.washing_machine": { state: "on" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "off" } as HassEntity,
  }
  connection.setEntities(newEntities6)
  act(() => vi.advanceTimersByTime(100))
  expect(onChangeCallback).toHaveBeenCalledTimes(1)

  const newEntities7 = {
    "switch.washing_machine": { state: "off" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "off" } as HassEntity,
  }
  connection.setEntities(newEntities7)
  act(() => vi.advanceTimersByTime(300))

  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(onChangeCallback).toHaveBeenCalledWith(false)
  expect(TestComponent).toHaveBeenCalledTimes(8)

  // Ensure timeout is not called when "to" changes
  connection.setEntities({
    "switch.washing_machine": { state: "on" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "on" } as HassEntity,
  })
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  connection.setEntities({
    "switch.washing_machine": { state: "on" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "off" } as HassEntity,
  })
  act(() => vi.advanceTimersByTime(500))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  connection.setEntities({
    "switch.washing_machine": { state: "off" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "off" } as HassEntity,
  })
  act(() => vi.advanceTimersByTime(100))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  connection.setEntities({
    "switch.washing_machine": { state: "on" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "off" } as HassEntity,
  })
  act(() => vi.advanceTimersByTime(100))
  expect(onChangeCallback).toHaveBeenCalledTimes(2)

  connection.setEntities({
    "switch.washing_machine": { state: "off" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "on" } as HassEntity,
  })
  act(() => vi.advanceTimersByTime(300))

  expect(onChangeCallback).toHaveBeenCalledTimes(2)
  expect(onChangeCallback).toHaveBeenCalledWith(false)
  expect(TestComponent).toHaveBeenCalledTimes(13)

  connection.setEntities({
    "switch.washing_machine": { state: "off" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "off" } as HassEntity,
  })
  act(() => vi.advanceTimersByTime(1000))

  expect(onChangeCallback).toHaveBeenCalledTimes(3)
  expect(onChangeCallback).toHaveBeenCalledWith(false)
  expect(TestComponent).toHaveBeenCalledTimes(14)

  connection.setEntities({
    "switch.washing_machine": { state: "on" } as HassEntity,
    "sensor.washing_machine_is_running": { state: "off" } as HassEntity,
  })
  act(() => vi.advanceTimersByTime(1000))

  expect(onChangeCallback).toHaveBeenCalledTimes(3)
  expect(onChangeCallback).toHaveBeenCalledWith(false)
  expect(TestComponent).toHaveBeenCalledTimes(15)
})
