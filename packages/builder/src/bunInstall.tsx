import { logger } from "@typed-assistant/logger"
import { $ } from "bun"

export async function bunInstall() {
  logger.info({ emoji: "🏗️" }, "Running bun install...")
  return $`bun install --frozen-lockfile --cache-dir=.bun-cache`
    .text()
    .catch((error) => {
      logger.error({ emoji: "🚨" }, `Failed to run bun install: ${error}`)
    })
}
