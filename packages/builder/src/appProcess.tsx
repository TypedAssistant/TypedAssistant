import { logger } from "@typed-assistant/logger"
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

  startWebappServer({
    basePath,
    getSubprocesses: () => subprocesses,
    onRestartAppRequest: async () => {
      subprocesses = await killAndRestartApp(
        entryFile,
        { mdiPaths },
        subprocesses,
      )
    },
    onProcessError: async (message) => {
      const messageAll = `${message}. Restarting app...`
      logger.fatal({  emoji: "🚨" }, messageAll)
      onProcessError?.(messageAll, addonUrl)
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

  checkProcesses(entryFile, {
    onMultiProcessError: (ps) => {
      const message = `Multiple processes detected. Restarting addon...`
      logger.fatal({ additionalDetails: ps, emoji: "🚨" }, message)
      onProcessError?.(message, addonUrl)
      restartAddon()
    },
    onNoProcessError: async (ps) => {
      const message = `No processes detected. Restarting app...`
      logger.fatal({ additionalDetails: ps, emoji: "🚨" }, message)
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
async function killAndRestartApp(
  entryFile: string,
  options: Parameters<typeof buildAndStartAppProcess>[1],
  subprocesses: Processes,
) {
  if (settingUp.current) return subprocesses
  logger.fatal({ emoji: "♻️" }, "Restarting app...")
  settingUp.current = true
  if (subprocesses.app) await killSubprocess(subprocesses.app)
  const newSubprocesses = await buildAndStartAppProcess(entryFile, options)
  settingUp.current = false
  return newSubprocesses
}

let multipleProcessesErrorCount = 0
let noProcessesErrorCount = 0
const checkProcesses = async (
  entryFile: string,
  {
    onMultiProcessError,
    onNoProcessError,
  }: {
    onMultiProcessError?: (psOutput: string) => void | Promise<void>
    onNoProcessError?: (psOutput: string) => void | Promise<void>
  },
) => {
  const ps = await $`ps -f`.text()
  const matches = ps.match(new RegExp(`bun .+${entryFile}`, "gmi")) ?? []

  if (matches.length > 1) {
    multipleProcessesErrorCount++
    if (multipleProcessesErrorCount > 5) {
      await onMultiProcessError?.(ps)
      return
    }
  } else {
    multipleProcessesErrorCount = 0
  }

  if (matches.length === 0) {
    noProcessesErrorCount++
    if (noProcessesErrorCount > 5) {
      await onNoProcessError?.(ps)
      return
    }
  } else {
    noProcessesErrorCount = 0
  }

  setTimeout(
    () => checkProcesses(entryFile, { onMultiProcessError, onNoProcessError }),
    5000,
  )
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
  await setupGitPoller({ onChangesPulled })
}

const ig = ignore().add(
  `${readFileSync(join(process.cwd(), ".gitignore")).toString()}\n.git`,
)
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

process.on("SIGINT", async () => {
  logger.fatal({ emoji: "👋" }, "Exiting...")
  await callSoftKillListeners()
  await callKillListeners()
  process.exit(0)
})
process.on("SIGTERM", async () => {
  logger.fatal({ emoji: "👋" }, "Exiting...")
  await callSoftKillListeners()
  await callKillListeners()
  process.exit(0)
})
