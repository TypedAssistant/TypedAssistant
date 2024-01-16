import { log } from "@typed-assistant/logger"
import { getSpawnText } from "./getSpawnText"
import { bunInstall } from "./bunInstall"

export const pullChanges = async () => {
  if (
    !process.env.GITHUB_TOKEN ||
    !process.env.GITHUB_USERNAME ||
    !process.env.GITHUB_REPO
  ) {
    log(
      "⚠️  Cannot pull changes without GITHUB_TOKEN, GITHUB_USERNAME, and GITHUB_REPO environment variables.",
    )
    return
  }
  log("⬇️  Pulling changes...")
  const gitPullText = await getSpawnText(["git", "pull"])
  const packageJSONUpdated = /package.json/.test(gitPullText)
  const nothingNew = /Already up to date./.test(gitPullText)
  if (nothingNew) {
    log("   👌 No new changes.")
    return
  } else {
    log("   👍 Changes pulled.")
  }
  if (packageJSONUpdated) {
    log("   📦 package.json updated.")
    const { error } = await bunInstall()
    if (error) throw new Error(error.text)
  }
}
