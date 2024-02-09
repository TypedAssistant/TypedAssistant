import { logger } from "@typed-assistant/logger"
import { $ } from "bun"
import { bunInstall } from "./bunInstall"

export const pullChanges = async ({
  onChangesPulled,
}: {
  onChangesPulled: () => void
}) => {
  logger.debug({ emoji: "⬇️" }, "Pulling changes...")
  const { exitCode, stderr, stdout } = await $`git pull`.quiet()
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
  if (nothingNew) {
    logger.debug({ emoji: "⬇️👌" }, "No new changes.")
    return {}
  } else {
    if (packageJSONUpdated) {
      logger.info({ emoji: "⬇️📦" }, "package.json updated.")
      await bunInstall()
    }
    logger.info({ emoji: "⬇️🆕" }, "Changes pulled.")
    onChangesPulled()
  }
  return {}
}
