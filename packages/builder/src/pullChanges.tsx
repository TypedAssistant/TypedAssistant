import { logger } from "@typed-assistant/logger"
import { $ } from "bun"
import { bunInstall } from "./bunInstall"

export const pullChanges = async () => {
  logger.debug({ emoji: "⬇️" }, "Pulling changes...")
  const { stderr, stdout } = await $`git pull`.quiet()
  if (stderr.length > 0) {
    logger.error(
      { emoji: "⬇️🚨" },
      `Failed to pull changes.\n  (${stderr.toString().trim()})`,
    )
  }
  const gitPullText = stdout.toString()
  const packageJSONUpdated = /package.json/.test(gitPullText)
  const nothingNew = /Already up to date./.test(gitPullText)
  if (nothingNew) {
    logger.debug({ emoji: "⬇️👌" }, "No new changes.")
    return {}
  } else {
    logger.info({ emoji: "⬇️🆕" }, "Changes pulled.")
  }
  if (packageJSONUpdated) {
    logger.info({ emoji: "⬇️📦" }, "package.json updated.")
    await bunInstall()
  }
  return {}
}
