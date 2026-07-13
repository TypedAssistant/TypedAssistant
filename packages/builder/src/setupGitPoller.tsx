import { logger } from "@typed-assistant/logger"
import { ONE_SECOND } from "@typed-assistant/utils/durations"
import { pullChanges } from "./pullChanges"

export const setupGitPoller = async ({
  gitPullPollDuration,
  onChangesPulled,
}: {
  /** Duration in seconds */
  gitPullPollDuration?: number
  onChangesPulled: () => void | Promise<void>
}) => {
  const duration = gitPullPollDuration ?? 30
  const delay = duration * ONE_SECOND
  let stopped = false
  let timeout: ReturnType<typeof setTimeout>

  const poll = async () => {
    try {
      await pullChanges({ onChangesPulled })
    } catch (error) {
      logger.error(
        {
          additionalDetails:
            error instanceof Error ? error.message : `${error}`,
          emoji: "⬇️🚨",
        },
        "Git poll failed",
      )
    } finally {
      if (!stopped) {
        logger.debug(
          { emoji: "⬇️⏳" },
          `Pulling changes again in ${duration} seconds...`,
        )
        timeout = setTimeout(poll, delay)
      }
    }
  }

  timeout = setTimeout(poll, delay)

  return {
    stop: () => {
      stopped = true
      clearTimeout(timeout)
    },
  }
}
