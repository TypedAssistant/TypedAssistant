import { render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { App } from "./app"

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

test("Renders the correct sun state", async () => {
  render(<App />)

  expect(screen.getByText("The sun is currently: Loading..."))
  mocks.connection.setEntities({ "sun.sun": { state: "above_horizon" } })
  expect(screen.getByText("The sun is currently: Above Horizon"))
})
