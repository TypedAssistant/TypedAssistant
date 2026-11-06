import { describe, expect, it } from "vitest"
import { inferArrayExampleType } from "./inferArrayExampleType"

describe("array service example inference", () => {
  it("falls back to unknown for the PiPup buttons example", () => {
    expect(
      inferArrayExampleType("[{id: unlock, label: Voordeur openen}]"),
    ).toBe("unknown")
  })

  it("falls back to unknown for truncated JSON", () => {
    expect(inferArrayExampleType('["unlock",')).toBe("unknown")
  })

  it("preserves tuple inference for valid mixed-type arrays", () => {
    expect(inferArrayExampleType('["unlock", 1, true, null, {}, []]')).toBe(
      "[string,number,boolean,object,object,object]",
    )
  })

  it("preserves empty tuples for empty arrays", () => {
    expect(inferArrayExampleType("[]")).toBe("[]")
  })

  it.each(['{"id":"unlock"}', '"unlock"', "42", "true", "null"])(
    "falls back to unknown for non-array JSON: %s",
    (example) => {
      expect(inferArrayExampleType(example)).toBe("unknown")
    },
  )
})
