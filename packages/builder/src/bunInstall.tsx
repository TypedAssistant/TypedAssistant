import { logger } from "@typed-assistant/logger"
import { $ } from "bun"

export async function bunInstall() {
  logger.info({ emoji: "🏗️" }, "Running bun install...")
  try {
    const output =
      await $`bun install --frozen-lockfile --cache-dir=.bun-cache`.text()
    return { success: true as const, output }
  } catch (error) {
    logger.error({ emoji: "🚨" }, `Failed to run bun install: ${error}`)
    return { success: false as const }
  }
}
