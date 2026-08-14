import { Writable } from "node:stream"
import { describe, expect, it, vi } from "vitest"
import {
  createInkFrameParser,
  createInkStdout,
  INK_FRAME_END,
  INK_FRAME_START,
} from "./inkOutput"

describe("Ink frame parser", () => {
  it("round-trips one Ink stdout write as one frame", async () => {
    let streamedOutput = ""
    const output = new Writable({
      write(chunk, _encoding, callback) {
        streamedOutput += chunk.toString()
        callback()
      },
    }) as unknown as NodeJS.WriteStream
    const stdout = createInkStdout(output)

    await new Promise<void>((resolve) =>
      stdout.write("complete frame", () => resolve()),
    )

    const onFrame = vi.fn()
    const parser = createInkFrameParser({
      onFrame,
      onUnframedOutput: vi.fn(),
    })
    parser.push(streamedOutput)

    expect(onFrame).toHaveBeenCalledWith("complete frame")
    expect(onFrame).toHaveBeenCalledTimes(1)
  })

  it("reassembles a frame split across any number of stream chunks", () => {
    const onFrame = vi.fn()
    const onUnframedOutput = vi.fn()
    const parser = createInkFrameParser({ onFrame, onUnframedOutput })
    const output = `${INK_FRAME_START}a tall\nInk frame${INK_FRAME_END}`

    for (const character of output) parser.push(character)

    expect(onFrame).toHaveBeenCalledWith("a tall\nInk frame")
    expect(onFrame).toHaveBeenCalledTimes(1)
    expect(onUnframedOutput).not.toHaveBeenCalled()
  })

  it("does not limit tall frames split across pipe-sized chunks", () => {
    const frame = Array.from(
      { length: 25_000 },
      (_, index) => `Ink output line ${index}`,
    ).join("\n")
    const output = `${INK_FRAME_START}${frame}${INK_FRAME_END}`
    const onFrame = vi.fn()
    const parser = createInkFrameParser({
      onFrame,
      onUnframedOutput: vi.fn(),
    })

    for (let offset = 0; offset < output.length; offset += 64 * 1024) {
      parser.push(output.slice(offset, offset + 64 * 1024))
    }

    expect(onFrame).toHaveBeenCalledWith(frame)
    expect(onFrame).toHaveBeenCalledTimes(1)
  })

  it("emits adjacent writes as separate frames", () => {
    const frames: string[] = []
    const parser = createInkFrameParser({
      onFrame: (frame) => frames.push(frame),
      onUnframedOutput: vi.fn(),
    })

    parser.push(
      `${INK_FRAME_START}first${INK_FRAME_END}${INK_FRAME_START}second${INK_FRAME_END}`,
    )

    expect(frames).toEqual(["first", "second"])
  })

  it("passes output without frame markers to the fallback", () => {
    const onFrame = vi.fn()
    const onUnframedOutput = vi.fn()
    const parser = createInkFrameParser({ onFrame, onUnframedOutput })

    parser.push("legacy output")
    parser.flush()

    expect(onFrame).not.toHaveBeenCalled()
    expect(onUnframedOutput).toHaveBeenCalledWith("legacy output")
  })
})
