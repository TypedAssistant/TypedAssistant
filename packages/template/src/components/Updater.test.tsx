import { render } from "@testing-library/react"
import { callService } from "@typed-assistant/utils/callService"
import { ONE_HOUR, ONE_MINUTE } from "@typed-assistant/utils/durations"
import { expect, test, vi } from "vitest"
import { Updater } from "./Updater"

vi.mock("@typed-assistant/utils/callService", () => ({ callService: vi.fn() }))

const days: Record<string, string> = {
  "0": "Sunday",
  "1": "Monday",
  "2": "Tuesday",
  "3": "Wednesday",
  "4": "Thursday",
  "5": "Friday",
  "6": "Saturday",
}

test("runs the HA core update Saturday at 05:00", async () => {
  const startDate = new Date("2021-01-01T05:00:00Z")
  vi.useFakeTimers()
  vi.setSystemTime(startDate)

  render(<Updater />)

  // Currently Friday @ 05:00
  expect(days[new Date().getDay()]).toBe("Friday")
  expect(new Date().toLocaleTimeString("en-GB")).toBe("05:00:00")
  expect(callService).not.toHaveBeenCalled()

  // Advance to Saturday @ 04:59
  vi.advanceTimersByTime(23 * ONE_HOUR + 59 * ONE_MINUTE)
  expect(days[new Date().getDay()]).toBe("Saturday")
  expect(new Date().toLocaleTimeString("en-GB")).toBe("04:59:00")
  expect(callService).not.toHaveBeenCalled()

  // Advance to Saturday @ 05:00
  vi.advanceTimersByTime(1 * ONE_MINUTE)
  expect(days[new Date().getDay()]).toBe("Saturday")
  expect(new Date().toLocaleTimeString("en-GB")).toBe("05:00:00")
  expect(callService).toHaveBeenCalledWith("update", "install", {
    entity_id: "update.home_assistant_core_update",
    backup: false,
  })
})

test("runs the HA OS update Saturday at 05:30", async () => {
  const startDate = new Date("2021-01-02T05:29:00Z")
  vi.useFakeTimers()
  vi.setSystemTime(startDate)

  render(<Updater />)

  // Currently Saturday @ 05:29
  expect(days[new Date().getDay()]).toBe("Saturday")
  expect(new Date().toLocaleTimeString("en-GB")).toBe("05:29:00")
  expect(callService).not.toHaveBeenCalled()

  // Advance to Saturday @ 05:30
  vi.advanceTimersByTime(1 * ONE_MINUTE)
  expect(days[new Date().getDay()]).toBe("Saturday")
  expect(new Date().toLocaleTimeString("en-GB")).toBe("05:30:00")
  expect(callService).toHaveBeenCalledWith("update", "install", {
    entity_id: "update.home_assistant_operating_system_update",
    backup: false,
  })
})

test("runs the HA OS supervisor Saturday at 06:30", async () => {
  const startDate = new Date("2021-01-02T06:29:00Z")
  vi.useFakeTimers()
  vi.setSystemTime(startDate)

  render(<Updater />)

  // Currently Saturday @ 06:29
  expect(days[new Date().getDay()]).toBe("Saturday")
  expect(new Date().toLocaleTimeString("en-GB")).toBe("06:29:00")
  expect(callService).not.toHaveBeenCalled()

  // Advance to Saturday @ 06:30
  vi.advanceTimersByTime(1 * ONE_MINUTE)
  expect(days[new Date().getDay()]).toBe("Saturday")
  expect(new Date().toLocaleTimeString("en-GB")).toBe("06:30:00")
  expect(callService).toHaveBeenCalledWith("update", "install", {
    entity_id: "update.home_assistant_supervisor_update",
    backup: false,
  })
})
