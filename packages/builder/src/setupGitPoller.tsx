import { logger } from "@typed-assistant/logger"
import { ONE_SECOND } from "@typed-assistant/utils/durations"
import { pullChanges } from "./pullChanges"

export const setupGitPoller = async ({
  gitPullPollDuration,
  onChangesPulled,
}: {
  /** Duration in seconds */
  gitPullPollDuration?: number
  onChangesPulled: () => void
}) => {
  const duration = gitPullPollDuration ?? 30
  await pullChanges({ onChangesPulled })
  logger.debug(
    { emoji: "⬇️⏳" },
    `Pulling changes again in ${duration} seconds...`,
  )

  setTimeout(() => {
    setupGitPoller({ gitPullPollDuration, onChangesPulled })
  }, duration * ONE_SECOND)
}
