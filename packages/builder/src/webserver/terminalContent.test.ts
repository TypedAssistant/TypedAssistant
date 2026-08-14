import { describe, expect, it } from "vitest"
import { updateTerminalContent } from "./terminalContent"

describe("terminal content", () => {
  it("does not truncate a tall frame when output is appended", () => {
    const frame = `frame start\n${"x".repeat(250_000)}`

    const content = updateTerminalContent(frame, {
      type: "append",
      content: "\ndiagnostic",
    })

    expect(content).toBe(`${frame}\ndiagnostic`)
    expect(content.startsWith("frame start")).toBe(true)
  })

  it.each(["frame", "snapshot"] as const)(
    "replaces existing content for a %s message",
    (type) => {
      expect(
        updateTerminalContent("old content", {
          type,
          content: "new content",
        }),
      ).toBe("new content")
    },
  )
})
