import { logger } from "@typed-assistant/logger"
import { ONE_SECOND } from "@typed-assistant/utils/durations"
import { generateTypes } from "@typed-assistant/utils/generateTypes"
import type { Subprocess } from "bun"
import { $ } from "bun"
import debounce from "debounce"
import { readFileSync, watch } from "fs"
import ignore from "ignore"
import { join, relative } from "path"
import { getAddonInfo as getAddonInfoAPI } from "./getAddonInfo"
import {
  addKillListener,
  callKillListeners,
  callSoftKillListeners,
  killSubprocess,
  terminateSubprocess,
} from "./killProcess"
import { restartAddon } from "./restartAddon"
import { setupGitPoller } from "./setupGitPoller"
import { startWebappServer } from "./setupWebserver"

export async function setup({
  entryFile,
  mdiPaths,
  onProcessError,
}: {
  entryFile: string
  onProcessError: (message: string, addonUrl: string) => void
} & Parameters<typeof generateTypes>[0]) {
  const addonInfo = await getAddonInfo()
  const basePath = addonInfo?.data.ingress_entry ?? ""
  const slug = addonInfo?.data.slug ?? ""
  const directoryToWatch = join(process.cwd(), "./src")
  const addonUrl = `${slug}/ingress`

  let subprocesses = await buildAndStartAppProcess(entryFile, {
    mdiPaths: mdiPaths,
  })

  addKillListener(async () => {
    await terminateSubprocess(subprocesses.app)
  })

  await startWebappServer({
    basePath,
    getSubprocesses: () => subprocesses,
    onRestartAppRequest: async () => {
      subprocesses = await killAndRestartApp(
        entryFile,
        { mdiPaths },
        subprocesses,
      )
    },
  })
  setupWatcher({
    directoryToWatch,
    entryFile,
    mdiPaths,
    onSubprocessChange: (newSubprocesses) => {
      subprocesses = newSubprocesses
    },
    getSubprocesses: () => subprocesses,
  })

  checkProcesses(entryFile, () => subprocesses, {
    onMultiProcessError: async (ps) => {
      const message = `Multiple processes detected. Restarting addon...`
      logger.fatal({ additionalDetails: ps, emoji: "🚨" }, message)
      onProcessError?.(message, addonUrl)
      await restartAddon()
    },
    onNoProcessError: async (processDetails) => {
      const message = `App process exited. Restarting app...`
      logger.fatal({ additionalDetails: processDetails, emoji: "🚨" }, message)
      onProcessError?.(message, addonUrl)
      subprocesses = await killAndRestartApp(
        entryFile,
        { mdiPaths },
        subprocesses,
      )
    },
  })

  await setupGitSync({
    onChangesPulled: async () => {
      subprocesses = await killAndRestartApp(
        entryFile,
        { mdiPaths },
        subprocesses,
      )
    },
  })

  return subprocesses
}

type Processes = Awaited<ReturnType<typeof buildAndStartAppProcess>>

async function buildAndStartAppProcess(
  appSourceFile: string,
  options: Parameters<typeof generateTypes>[0],
) {
  await generateTypes({ mdiPaths: options?.mdiPaths })
  return { app: await startApp(appSourceFile) }
}

async function startApp(appSourceFile: string) {
  logger.info({ emoji: "🚀" }, "Starting app...")
  const path = join(process.cwd(), appSourceFile)
  return Bun.spawn(["bun", "--bun", path], {
    stderr: "pipe",
    env: { ...process.env, FORCE_COLOR: "1", NODE_ENV: "production" },
  })
}

let settingUp = { current: false }
let restartQueued = false
async function killAndRestartApp(
  entryFile: string,
  options: Parameters<typeof buildAndStartAppProcess>[1],
  subprocesses: Processes,
) {
  if (settingUp.current) {
    // Re-run once the in-flight restart finishes so this request isn't lost
    restartQueued = true
    logger.info({ emoji: "♻️" }, "Restart already in progress. Queuing...")
    return subprocesses
  }
  settingUp.current = true
  let currentSubprocesses = subprocesses
  try {
    do {
      restartQueued = false
      logger.fatal({ emoji: "♻️" }, "Restarting app...")
      try {
        if (currentSubprocesses.app)
          await killSubprocess(currentSubprocesses.app)
        currentSubprocesses = await buildAndStartAppProcess(entryFile, options)
      } catch (error) {
        logger.error(
          {
            additionalDetails:
              error instanceof Error ? error.message : `${error}`,
            emoji: "🚨",
          },
          "Failed to restart app",
        )
      }
    } while (restartQueued)
    return currentSubprocesses
  } finally {
    settingUp.current = false
  }
}

let multipleProcessesErrorCount = 0
let noProcessesErrorCount = 0
const checkProcesses = (
  entryFile: string,
  getSubprocesses: () => Processes,
  {
    onMultiProcessError,
    onNoProcessError,
  }: {
    onMultiProcessError?: (psOutput: string) => void | Promise<void>
    onNoProcessError?: (psOutput: string) => void | Promise<void>
  },
) => {
  let stopped = false
  let timeout: ReturnType<typeof setTimeout>

  const check = async () => {
    try {
      await checkOnce()
    } catch (error) {
      logger.error(
        {
          additionalDetails:
            error instanceof Error ? error.message : `${error}`,
          emoji: "🚨",
        },
        "Process check failed",
      )
    } finally {
      if (!stopped) timeout = setTimeout(check, 10000)
    }
  }

  timeout = setTimeout(check, 10000)

  async function checkOnce() {
    const ps = await $`ps -f`.text()
    logger.debug({ emoji: "🔍" }, `Checking processes...\n${ps}`)
    const escapedEntryFile = entryFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const matches =
      ps.match(new RegExp(`bun .+${escapedEntryFile}`, "gmi")) ?? []

    if (matches.length > 1) {
      multipleProcessesErrorCount++
      if (multipleProcessesErrorCount > 5) {
        // Reset so a failed recovery gets a fresh window instead of refiring every tick
        multipleProcessesErrorCount = 0
        await onMultiProcessError?.(ps)
        return
      }
    } else {
      multipleProcessesErrorCount = 0
    }

    const app = getSubprocesses().app
    const appExited = app.exitCode !== null || app.signalCode !== null

    if (appExited) {
      noProcessesErrorCount++
      if (noProcessesErrorCount > 5) {
        noProcessesErrorCount = 0
        const resourceUsage = app.resourceUsage()
        await onNoProcessError?.(
          [
            `Tracked app process ${app.pid} exited.`,
            `Exit code: ${app.exitCode ?? "none"}`,
            `Signal: ${app.signalCode ?? "none"}`,
            `Resource usage: ${resourceUsage ? JSON.stringify(resourceUsage) : "unavailable"}`,
            `Process table at detection:\n${ps}`,
          ].join("\n"),
        )
        return
      }
    } else {
      noProcessesErrorCount = 0
    }
  }

  return {
    stop: () => {
      stopped = true
      clearTimeout(timeout)
    },
  }
}

const getAddonInfo = async () => {
  logger.debug({ emoji: "🔍" }, "Getting addon info...")

  const { data, error } = await getAddonInfoAPI()

  if (error) logger.error({ emoji: "🚨" }, `Failed to get addon info: ${error}`)

  return data
}

const setupGitSync = async ({
  onChangesPulled,
}: {
  onChangesPulled: () => void
}) => {
  if (
    !process.env.GITHUB_TOKEN ||
    !process.env.GITHUB_USERNAME ||
    !process.env.GITHUB_REPO
  ) {
    logger.warn(
      { emoji: "⚠️" },
      "Cannot sync with Github without Github token, username, and repo details. Add these in the add-on configuration.",
    )
    return { error: {} }
  }

  logger.warn({ emoji: "⬇️" }, "Setting up git poller...")
  return setupGitPoller({ onChangesPulled })
}

let gitignoreContent = ".git"
try {
  gitignoreContent = `${readFileSync(join(process.cwd(), ".gitignore")).toString()}\n.git`
} catch {
  logger.warn({ emoji: "⚠️" }, "No .gitignore found, watching all files")
}
const ig = ignore().add(gitignoreContent)
const shouldIgnoreFileOrFolder = (filename: string) =>
  ig.ignores(relative(process.cwd(), filename))

function setupWatcher({
  directoryToWatch,
  entryFile,
  mdiPaths,
  onSubprocessChange,
  getSubprocesses,
}: {
  directoryToWatch: string
  onSubprocessChange: (newSubprosses: {
    app: Subprocess<"ignore", "pipe", "pipe">
  }) => void
  entryFile: string
  mdiPaths: string[] | undefined
  getSubprocesses: () => {
    app: Subprocess<"ignore", "pipe", "pipe">
  }
}) {
  logger.debug({ emoji: "👀" }, `Watching directory: ${directoryToWatch}`)
  const watcher = watch(
    directoryToWatch,
    { recursive: true },
    debounce(async function onFileChange(event, filename) {
      if (!filename) return
      if (shouldIgnoreFileOrFolder(filename)) return
      logger.info({ emoji: "⚠️" }, `Change to ${filename} detected.`)
      if (filename.endsWith("process.tsx")) {
        await killSubprocess(getSubprocesses().app)
        await restartAddon()
      } else {
        onSubprocessChange(
          await killAndRestartApp(entryFile, { mdiPaths }, getSubprocesses()),
        )
      }
    }, 200),
  )

  addKillListener(() => {
    if (watcher) watcher.close()
  })

  return watcher
}

let shuttingDown = false
async function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  logger.fatal({ emoji: "👋" }, "Exiting...")
  setTimeout(() => {
    logger.error({ emoji: "🚨" }, "Cleanup timed out. Forcing exit...")
    process.exit(1)
  }, 15 * ONE_SECOND)
  await callSoftKillListeners()
  await callKillListeners()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
