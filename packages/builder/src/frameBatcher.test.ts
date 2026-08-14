import { afterEach, describe, expect, it, vi } from "vitest"
import { createFrameBatcher, FRAME_SETTLE_TIME_MS } from "./frameBatcher"

afterEach(() => {
  vi.useRealTimers()
})

describe("frame batcher", () => {
  it("combines stream chunks until output settles", () => {
    vi.useFakeTimers()
    const frames: string[] = []
    const batcher = createFrameBatcher((frame) => frames.push(frame))

    batcher.push("first ")
    vi.advanceTimersByTime(FRAME_SETTLE_TIME_MS - 1)
    batcher.push("frame")
    vi.advanceTimersByTime(FRAME_SETTLE_TIME_MS - 1)

    expect(frames).toEqual([])

    vi.advanceTimersByTime(1)

    expect(frames).toEqual(["first frame"])
  })

  it("emits later output as a separate frame", () => {
    vi.useFakeTimers()
    const frames: string[] = []
    const batcher = createFrameBatcher((frame) => frames.push(frame))

    batcher.push("first")
    vi.advanceTimersByTime(FRAME_SETTLE_TIME_MS)
    batcher.push("second")
    vi.advanceTimersByTime(FRAME_SETTLE_TIME_MS)

    expect(frames).toEqual(["first", "second"])
  })

  it("flushes pending output when a stream ends", () => {
    vi.useFakeTimers()
    const frames: string[] = []
    const batcher = createFrameBatcher((frame) => frames.push(frame))

    batcher.push("partial frame")
    batcher.flush()
    vi.runAllTimers()

    expect(frames).toEqual(["partial frame"])
  })
})
