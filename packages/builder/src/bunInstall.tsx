import { log } from "@typed-assistant/logger"

export async function bunInstall() {
  log("🏗️ Running bun install...")
  const proc = Bun.spawn([
    "bun",
    "install",
    "--frozen-lockfile",
    "--cache-dir=.bun-cache",
  ])
  await proc.exited
  const bunInstallText = await Bun.readableStreamToText(proc.stdout)
  if (proc.exitCode === 0) return { error: null }
  return {
    error: {
      signalCode: proc.signalCode,
      exitCode: proc.exitCode,
      text: bunInstallText,
    },
  }
}
