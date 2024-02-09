import { logger } from "@typed-assistant/logger"
import { generateTypes } from "@typed-assistant/types/generateTypes"
import type { Subprocess } from "bun"
import { $ } from "bun"
import { readFileSync, watch } from "fs"
import ignore from "ignore"
import { join, relative } from "path"
import {
  addKillListener,
  callKillListeners,
  callSoftKillListeners,
  killSubprocess,
} from "./killProcess"
import { setupGitPoller } from "./setupGitPoller"
import { setupWebhook } from "./setupWebhook"
import { startWebappServer } from "./setupWebserver"
import { restartAddon } from "./restartAddon"
import { getAddonInfo as getAddonInfoAPI } from "./getAddonInfo"
import debounce from "debounce"

export async function setup({
  entryFile,
  mdiPaths,
  onProcessError,
}: {
  entryFile: string
} & Parameters<typeof generateTypes>[0] &
  Pick<Parameters<typeof checkProcesses>[1], "onProcessError">) {
  const addonInfo = await getAddonInfo()
  const basePath = addonInfo?.data.ingress_entry ?? ""
  const slug = addonInfo?.data.slug ?? ""
  const directoryToWatch = join(process.cwd(), "./src")
  const addonUrl = `${slug}/ingress`
  const webhookUrl = `${process.env.HASS_EXTERNAL_URL}${basePath}/webhook`

  let subprocesses = await buildAndStartAppProcess(entryFile, {
    mdiPaths: mdiPaths,
  })

  startWebappServer({
    basePath,
    getSubprocesses: () => subprocesses,
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

  checkProcesses(entryFile, { addonUrl, onProcessError })
  await setupGitSync(webhookUrl)

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
  return Bun.spawn(["bun", path], {
    stderr: "pipe",
    env: { ...process.env, FORCE_COLOR: "1" },
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
    addonUrl,
    onProcessError,
  }: {
    addonUrl: string
    onProcessError?: (message: string, addonUrl: string) => void
  },
) => {
  const ps = await $`ps -f`.text()
  const matches = ps.match(new RegExp(`bun .+${entryFile}`, "gmi")) ?? []

  if (matches.length > 1) {
    multipleProcessesErrorCount++
    if (multipleProcessesErrorCount > 5) {
      const message = `Multiple processes detected. Check the logs...`
      logger.fatal({ additionalDetails: ps, emoji: "🚨" }, message)
      onProcessError?.(message, addonUrl)
      return
    }
  } else {
    multipleProcessesErrorCount = 0
  }

  if (matches.length === 0) {
    noProcessesErrorCount++
    if (noProcessesErrorCount > 5) {
      const message = `No processes detected. Check the logs...`
      logger.fatal({ additionalDetails: ps, emoji: "🚨" }, message)
      onProcessError?.(message, addonUrl)
      return
    }
  } else {
    noProcessesErrorCount = 0
  }

  setTimeout(
    () => checkProcesses(entryFile, { addonUrl, onProcessError }),
    5000,
  )
}

const getAddonInfo = async () => {
  logger.debug({ emoji: "🔍" }, "Getting addon info...")

  const { data, error } = await getAddonInfoAPI()

  if (error) logger.error({ emoji: "🚨" }, `Failed to get addon info: ${error}`)

  return data
}

const setupGitSync = async (webhookUrl: string) => {
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
  if (process.env.HASS_EXTERNAL_URL) {
    await setupWebhook(webhookUrl)
    return
  }
  logger.warn(
    { emoji: "⚠️" },
    "No HASS_EXTERNAL_URL found. Setting up git poller...",
  )
  await setupGitPoller()
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
  logger.debug({ emoji: "👀" }, "Watching directory: ${directoryToWatch}")
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
