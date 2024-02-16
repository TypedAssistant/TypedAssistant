import { render, screen } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
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

test("useEntity provides the value of the given entity", async () => {
  const TestComponent = vi.fn(() => {
    const entity = useEntity("light.test")
    return entity == null ? "null" : JSON.stringify(entity)
  })

  render(<TestComponent />)

  expect(TestComponent).toHaveBeenCalledTimes(1)
  expect(screen.getByText("null")).not.toBeNull()

  mocks.connection.setEntities({ "light.test": { state: "on" } })

  expect(screen.getByText(JSON.stringify({ state: "on" }))).not.toBeNull()
  expect(TestComponent).toHaveBeenCalledTimes(2)

  mocks.connection.setEntities({ "light.test": { state: "off" } })

  expect(TestComponent).toHaveBeenCalledTimes(3)
  expect(screen.getByText(JSON.stringify({ state: "off" }))).not.toBeNull()
})

test("useEntity returns an initial value", async () => {
  mocks.connection.setEntities({ "light.test": { state: "on" } })

  const TestComponent = vi.fn(() => {
    const entity = useEntity("light.test")
    return entity == null ? "null" : JSON.stringify(entity)
  })

  render(<TestComponent />)

  expect(TestComponent).toHaveBeenCalledTimes(1)
  expect(screen.getByText(JSON.stringify({ state: "on" }))).not.toBeNull()
})

test("useEntity only rerenders a component when that entity updates", async () => {
  const TestComponentA = vi.fn(() => {
    const entity = useEntity("light.a")
    return "light.a: " + (entity == null ? "null" : JSON.stringify(entity))
  })
  const TestComponentB = vi.fn(() => {
    const entity = useEntity("light.b")
    return "light.b: " + (entity == null ? "null" : JSON.stringify(entity))
  })

  render(
    <>
      <TestComponentA />
      <TestComponentB />
    </>,
  )

  expect(TestComponentA).toHaveBeenCalledTimes(1)
  expect(TestComponentB).toHaveBeenCalledTimes(1)
  expect(screen.getByText(/light.a: null/)).not.toBeNull()
  expect(screen.getByText(/light.b: null/)).not.toBeNull()

  mocks.connection.setEntities({ "light.a": { state: "on" } })

  expect(
    screen.getByText("light.a: " + JSON.stringify({ state: "on" }), {
      exact: false,
    }),
  ).not.toBeNull()
  expect(screen.getByText(/light.b: null/)).not.toBeNull()
  expect(TestComponentA).toHaveBeenCalledTimes(2)
  expect(TestComponentB).toHaveBeenCalledTimes(1)

  mocks.connection.setEntities({
    "light.a": { state: "on" },
    "light.b": { state: "on" },
  })

  expect(
    screen.getByText("light.b: " + JSON.stringify({ state: "on" }), {
      exact: false,
    }),
  ).not.toBeNull()
  expect(TestComponentA).toHaveBeenCalledTimes(2)
  expect(TestComponentB).toHaveBeenCalledTimes(2)

  mocks.connection.setEntities({
    "light.a": { state: "on" },
    "light.b": { state: "off" },
  })

  expect(
    screen.getByText("light.b: " + JSON.stringify({ state: "off" }), {
      exact: false,
    }),
  ).not.toBeNull()
  expect(TestComponentA).toHaveBeenCalledTimes(2)
  expect(TestComponentB).toHaveBeenCalledTimes(3)

  mocks.connection.setEntities({
    "light.a": { state: "on" },
    "light.b": { state: "on" },
  })

  expect(
    screen.getByText("light.b: " + JSON.stringify({ state: "on" }), {
      exact: false,
    }),
  ).not.toBeNull()
  expect(TestComponentA).toHaveBeenCalledTimes(2)
  expect(TestComponentB).toHaveBeenCalledTimes(4)

  mocks.connection.setEntities({
    "light.a": { state: "off" },
    "light.b": { state: "on" },
  })

  expect(
    screen.getByText("light.a: " + JSON.stringify({ state: "off" }), {
      exact: false,
    }),
  ).not.toBeNull()
  expect(TestComponentA).toHaveBeenCalledTimes(3)
  expect(TestComponentB).toHaveBeenCalledTimes(4)
})

test("useEntity can return multiple entities", async () => {
  const TestComponent = vi.fn(() => {
    const [entityA, entityB] = useEntity(["light.a", "light.b"])
    return (
      <>
        {" "}
        {"light.a: " +
          (entityA == null ? "null" : JSON.stringify(entityA))}{" "}
        {"light.b: " + (entityB == null ? "null" : JSON.stringify(entityB))}
      </>
    )
  })

  render(<TestComponent />)

  expect(TestComponent).toHaveBeenCalledTimes(1)
  expect(screen.getByText(/light.a: null/)).not.toBeNull()
  expect(screen.getByText(/light.b: null/)).not.toBeNull()

  mocks.connection.setEntities({ "light.a": { state: "on" } })

  expect(
    screen.getByText("light.a: " + JSON.stringify({ state: "on" }), {
      exact: false,
    }),
  ).not.toBeNull()
  expect(screen.getByText(/light.b: null/)).not.toBeNull()
  expect(TestComponent).toHaveBeenCalledTimes(2)

  mocks.connection.setEntities({
    "light.a": { state: "on" },
    "light.b": { state: "on" },
  })

  expect(
    screen.getByText("light.b: " + JSON.stringify({ state: "on" }), {
      exact: false,
    }),
  ).not.toBeNull()
  expect(TestComponent).toHaveBeenCalledTimes(3)

  mocks.connection.setEntities({
    "light.a": { state: "on" },
    "light.b": { state: "off" },
  })

  expect(
    screen.getByText("light.b: " + JSON.stringify({ state: "off" }), {
      exact: false,
    }),
  ).not.toBeNull()
  expect(TestComponent).toHaveBeenCalledTimes(4)

  mocks.connection.setEntities({
    "light.a": { state: "on" },
    "light.b": { state: "on" },
  })

  expect(
    screen.getByText("light.b: " + JSON.stringify({ state: "on" }), {
      exact: false,
    }),
  ).not.toBeNull()
  expect(TestComponent).toHaveBeenCalledTimes(5)

  mocks.connection.setEntities({
    "light.a": { state: "off" },
    "light.b": { state: "on" },
  })

  expect(
    screen.getByText("light.a: " + JSON.stringify({ state: "off" }), {
      exact: false,
    }),
  ).not.toBeNull()
  expect(TestComponent).toHaveBeenCalledTimes(6)
})
