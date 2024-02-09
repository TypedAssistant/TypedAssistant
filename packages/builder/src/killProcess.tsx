import { logger } from "@typed-assistant/logger"
import type { Subprocess } from "bun"
import { $ } from "bun"

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

export async function killSubprocess(subprocess: Subprocess) {
  logger.fatal({ emoji: "💀" }, `Killing process: ${subprocess.pid}`)
  await callSoftKillListeners()
  subprocess.kill()
  await subprocess.exited
}
