import { logger } from "@typed-assistant/logger"
import { ONE_SECOND } from "@typed-assistant/utils/durations"
import { pullChanges } from "./pullChanges"

export const setupGitPoller = async ({
  gitPullPollDuration,
}: {
  /** Duration in seconds */
  gitPullPollDuration?: number
} = {}) => {
  const duration = gitPullPollDuration ?? 30
  await pullChanges()
  logger.debug(
    { emoji: "⬇️⏳" },
    `Pulling changes again in ${duration} seconds...`,
  )

  setTimeout(() => {
    setupGitPoller({ gitPullPollDuration })
  }, duration * ONE_SECOND)
}
