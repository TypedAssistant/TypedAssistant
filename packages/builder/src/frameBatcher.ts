export const FRAME_SETTLE_TIME_MS = 20

export const createFrameBatcher = (
  onFrame: (frame: string) => void,
  settleTime = FRAME_SETTLE_TIME_MS,
) => {
  let frame = ""
  let timeout: ReturnType<typeof setTimeout> | undefined

  const flush = () => {
    if (timeout) clearTimeout(timeout)
    timeout = undefined

    if (frame === "") return

    const completedFrame = frame
    frame = ""
    onFrame(completedFrame)
  }

  return {
    push(chunk: string) {
      if (chunk === "") return

      frame += chunk
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(flush, settleTime)
    },
    flush,
  }
}
