import { logger } from "@typed-assistant/logger"
import { ONE_SECOND } from "@typed-assistant/utils/durations"
import type { Subprocess } from "bun"

const killListeners: (() => void | Promise<void>)[] = []
const softKillListeners: (() => void | Promise<void>)[] = []

export const addKillListener = (listener: () => void | Promise<void>) => {
  killListeners.push(listener)
}
export const addSoftKillListener = (listener: () => void | Promise<void>) => {
  softKillListeners.push(listener)
}

export async function callKillListeners() {
  await Promise.all(killListeners.map((listener) => listener()))
}

export async function callSoftKillListeners() {
  await Promise.all(softKillListeners.map((listener) => listener()))
}

export async function terminateSubprocess(subprocess: Subprocess) {
  logger.fatal({ emoji: "💀" }, `Killing process: ${subprocess.pid}`)
  subprocess.kill()
  const sigkillTimeout = setTimeout(() => {
    logger.warn(
      { emoji: "💀" },
      `Process ${subprocess.pid} did not exit after SIGTERM. Sending SIGKILL...`,
    )
    subprocess.kill("SIGKILL")
  }, 10 * ONE_SECOND)
  await subprocess.exited
  clearTimeout(sigkillTimeout)
}

export async function killSubprocess(subprocess: Subprocess) {
  await callSoftKillListeners()
  await terminateSubprocess(subprocess)
}
