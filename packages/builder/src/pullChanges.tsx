import { logger } from "@typed-assistant/logger"
import { $ } from "bun"
import { bunInstall } from "./bunInstall"

let installPending = false

export const pullChanges = async ({
  onChangesPulled,
}: {
  onChangesPulled: () => void | Promise<void>
}) => {
  logger.debug({ emoji: "⬇️" }, "Pulling changes...")
  const { exitCode, stderr, stdout } = await $`git pull`.nothrow().quiet()
  if (exitCode) {
    logger.error(
      { additionalDetails: stderr.toString().trim(), emoji: "⬇️🚨" },
      `Failed to pull changes.`,
    )
    return
  }
  const gitPullText = stdout.toString()
  const packageJSONUpdated = /package.json/.test(gitPullText)
  const nothingNew = /Already up to date./.test(gitPullText)
  if (nothingNew && !installPending) {
    logger.debug({ emoji: "⬇️👌" }, "No new changes.")
    return {}
  }
  if (packageJSONUpdated || installPending) {
    logger.info({ emoji: "⬇️📦" }, "package.json updated. Installing...")
    const { success } = await bunInstall()
    if (!success) {
      // Don't restart the app against a stale or half-written node_modules
      installPending = true
      logger.error(
        { emoji: "⬇️🚨" },
        "Skipping app restart because bun install failed. Retrying on next poll.",
      )
      return {}
    }
    installPending = false
  }
  logger.info({ emoji: "⬇️🆕" }, "Changes pulled.")
  await onChangesPulled()
  return {}
}
