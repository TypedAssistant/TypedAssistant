import process from "node:process"
import { Writable } from "node:stream"

export const INK_FRAME_START = "\u001eTYPED_ASSISTANT_INK_FRAME_START\u001f"
export const INK_FRAME_END = "\u001eTYPED_ASSISTANT_INK_FRAME_END\u001f"

export const createInkStdout = (
  output: NodeJS.WriteStream = process.stdout,
): NodeJS.WriteStream => {
  const framedOutput = new Writable({
    write(chunk, _encoding, callback) {
      const frame = Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk)

      output.write(INK_FRAME_START + frame + INK_FRAME_END, () => callback())
    },
  })

  Object.defineProperties(framedOutput, {
    columns: { get: () => output.columns },
    rows: { get: () => output.rows },
    isTTY: { get: () => output.isTTY },
  })

  return framedOutput as unknown as NodeJS.WriteStream
}

export const createInkFrameParser = ({
  onFrame,
  onUnframedOutput,
}: {
  onFrame: (frame: string) => void
  onUnframedOutput: (output: string) => void
}) => {
  let buffer = ""

  const getPartialStartLength = () => {
    const maxLength = Math.min(buffer.length, INK_FRAME_START.length - 1)
    for (let length = maxLength; length > 0; length--) {
      if (INK_FRAME_START.startsWith(buffer.slice(-length))) return length
    }
    return 0
  }

  const parse = () => {
    while (buffer !== "") {
      const startIndex = buffer.indexOf(INK_FRAME_START)
      if (startIndex === -1) {
        const partialStartLength = getPartialStartLength()
        const unframedOutput = buffer.slice(
          0,
          buffer.length - partialStartLength,
        )
        buffer = buffer.slice(buffer.length - partialStartLength)
        if (unframedOutput !== "") onUnframedOutput(unframedOutput)
        return
      }

      if (startIndex > 0) {
        onUnframedOutput(buffer.slice(0, startIndex))
        buffer = buffer.slice(startIndex)
      }

      const endIndex = buffer.indexOf(INK_FRAME_END, INK_FRAME_START.length)
      if (endIndex === -1) return

      onFrame(buffer.slice(INK_FRAME_START.length, endIndex))
      buffer = buffer.slice(endIndex + INK_FRAME_END.length)
    }
  }

  return {
    push(chunk: string) {
      buffer += chunk
      parse()
    },
    flush() {
      if (buffer !== "") onUnframedOutput(buffer)
      buffer = ""
    },
  }
}
