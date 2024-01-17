import { generateTypes } from "@typed-assistant/types/generateTypes"
import { log } from "@typed-assistant/logger"
import type { Subprocess } from "bun"
import { readFileSync, watch } from "fs"
import { join, relative } from "path"
import ignore from "ignore"
import { ONE_SECOND } from "@typed-assistant/utils/durations"
import { getHassAPI } from "@typed-assistant/utils/getHassAPI"
import { pullChanges } from "./pullChanges"

type Processes = Awaited<ReturnType<typeof buildAndStartAppProcess>>

async function buildAndStartAppProcess(
  appSourceFile?: string,
  options?: Parameters<typeof generateTypes>[0],
) {
  await generateTypes({ mdiPaths: options?.mdiPaths })
  return { app: await startApp(appSourceFile) }
}

async function startApp(appSourceFile: string = "src/entry.tsx") {
  log("🚀 Starting app...")
  const path = join(process.cwd(), appSourceFile)
  return Bun.spawn(["bun", path], { stdout: "inherit" })
}

async function kill(process: Subprocess) {
  log(`💀 Killing process: ${process.pid}`)
  process.kill()
  await process.exited
}

let settingUp = { current: false }
async function killAndRestartApp(subprocesses: Processes) {
  if (settingUp.current) return subprocesses
  log("♻️  Restarting app...")
  settingUp.current = true
  if (subprocesses.app) await kill(subprocesses.app)
  const newSubprocesses = await buildAndStartAppProcess()
  settingUp.current = false
  return newSubprocesses
}

function setupWatcherInternal(...args: Parameters<typeof watch>) {
  const [directory, callback] = args
  if (typeof directory !== "string") throw new Error("Directory must be string")

  log("👀 Watching directory:", directory)
  const watcher = watch(directory, { recursive: true }, callback)

  return watcher
}

export async function setupWatcher(
  ...args: Parameters<typeof buildAndStartAppProcess>
) {
  await setupGitSync()

  let subprocesses = await buildAndStartAppProcess(...args)

  setupWatcherInternal(
    join(process.cwd(), "src"),
    async function onFileChange(event, filename) {
      if (!filename) return
      if (shouldIgnoreFileOrFolder(filename)) return
      log(`⚠️  Change to ${filename} detected.`)
      if (filename.endsWith("process.tsx")) {
        await restartAddon()
      } else {
        subprocesses = await killAndRestartApp(subprocesses)
      }
    },
  )

  return subprocesses
}

const setupGitSync = async ({
  gitPullPollDuration,
}: {
  /** Duration in seconds */
  gitPullPollDuration?: number
} = {}) => {
  const duration = gitPullPollDuration ?? 30
  await pullChanges()
  log(`   ⏳ Pulling changes again in ${duration} seconds...`)

  setInterval(() => {
    setupGitSync({ gitPullPollDuration })
  }, duration * ONE_SECOND)
}

const ig = ignore().add(
  `${readFileSync(join(process.cwd(), ".gitignore")).toString()}\n.git`,
)
const shouldIgnoreFileOrFolder = (filename: string) =>
  ig.ignores(relative(process.cwd(), filename))

const restartAddon = async () => {
  log("♻️  Restarting addon...")
  await getHassAPI(`http://supervisor/addons/self/restart`, { method: "POST" })
}
