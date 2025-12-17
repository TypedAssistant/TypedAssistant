import type { LogSchema } from "@typed-assistant/logger"
import { logger } from "@typed-assistant/logger"
import { levels } from "@typed-assistant/logger/levels"
import { ONE_MINUTE, ONE_SECOND } from "@typed-assistant/utils/durations"
import { getSupervisorAPI } from "@typed-assistant/utils/getHassAPI"
import { withErrorHandling } from "@typed-assistant/utils/withErrorHandling"
import Convert from "ansi-to-html"
import type { Subprocess } from "bun"
import { $ } from "bun"
import { Elysia, t } from "elysia"
import { watch } from "fs"
import { basename, join } from "path"
import type { List, String } from "ts-toolbelt"
import { getAddonInfo } from "./getAddonInfo"
import { addKillListener, killSubprocess } from "./killProcess"
import { restartAddon } from "./restartAddon"

const indexHtmlFilePath = `${import.meta.dir}/webserver/index.html` as const
const cssFile = `${import.meta.dir}/webserver/input.css` as const
const tsEntryPoint = `${import.meta.dir}/webserver/index.tsx` as const
const tailwindConfig =
  `${import.meta.dir}/webserver/tailwind.config.js` as const
const cssOutputFile = join(
  process.cwd(),
  `./build/output.css`,
) as `${string}/output.css`

const convert = new Convert()
const decoder = new TextDecoder()

const readers = {
  stdout: new Map<
    ReadableStream<Uint8Array>,
    ReadableStreamDefaultReader<Uint8Array>
  >(),
  stderr: new Map<
    ReadableStream<Uint8Array>,
    ReadableStreamDefaultReader<Uint8Array>
  >(),
}

const getReader = (
  type: "stdout" | "stderr",
  stream: ReadableStream<Uint8Array>,
) => {
  const cachedReader = readers[type].get(stream)
  if (!cachedReader) {
    readers[type].forEach((_reader, cachedStream) => {
      readers[type].delete(cachedStream)
    })
  }
  const reader = cachedReader ?? stream.getReader()
  readers[type].set(stream, reader)
  return reader
}

const subscribers = new Map<string, (message: string) => void>()
const logSubscribers = new Map<string, () => void>()

let lastMessage = ""
let stats = {
  cpu_percent: null as number | null,
  memory_usage: null as number | null,
  memory_limit: null as number | null,
  memory_percent: null as number | null,
  max_memory_usage: 0,
}
const getStats = async () => {
  const { data, error } = await withErrorHandling(
    getSupervisorAPI<{
      data: {
        error?: never
        cpu_percent: number
        memory_usage: number
        memory_limit: number
        memory_percent: number
        max_memory_usage: number
      }
    }>,
  )("/addons/self/stats")

  if (error) {
    logger.error(
      { additionalDetails: error.message, emoji: "❌" },
      "Error getting stats",
    )
  } else {
    stats = {
      ...data.data,
      max_memory_usage:
        data.data.memory_usage > stats.max_memory_usage
          ? data.data.memory_usage
          : stats.max_memory_usage,
    }
  }

  setTimeout(getStats, 10 * ONE_SECOND)
}

export const startWebappServer = async ({
  basePath,
  getSubprocesses,
  onRestartAppRequest,
  onProcessError,
}: {
  basePath: string
  getSubprocesses: () => {
    app: Subprocess<"ignore", "pipe", "pipe">
  }
  onRestartAppRequest: () => void
  onProcessError: (message: string) => void
}) => {
  const buildResult = await Bun.build({
    entrypoints: [tsEntryPoint],
    outdir: "./build",
    define: {
      "process.env.BASE_PATH": `"${basePath}"`,
    },
  })
  if (!buildResult.success) {
    for (const message of buildResult.logs) {
      // Bun will pretty print the message object
      console.error(message)
    }
    throw new Error("Build failed")
  }
  logger.debug({ emoji: "🛠️" }, "Web server built successfully")

  await $`bunx tailwindcss -c ${tailwindConfig} -i ${cssFile} -o ${cssOutputFile}`.quiet()
  logger.debug({ emoji: "💄" }, "Tailwind built successfully")

  const indexHtml = (await Bun.file(indexHtmlFilePath).text())
    .replace(
      "{{ STYLESHEET }}",
      `${basePath}/assets/${getBaseName(cssOutputFile)}`,
    )
    .replace(
      "{{ SCRIPTS }}",
      buildResult.outputs
        .map(
          (output) =>
            `<script type="module" src="${basePath}/assets/${getBaseName(output.path)}"></script>`,
        )
        .join("\n"),
    )

  const server = new Elysia()
    .get(
      "/",
      () =>
        new Response(indexHtml, {
          headers: { "content-type": "text/html" },
        }),
    )
    .get("/restart-app", async () => {
      onRestartAppRequest()
      return { message: "Restarting app..." }
    })
    .get("/restart-addon", async () => {
      await killSubprocess(getSubprocesses().app)
      restartAddon()
      return { message: "Restarting addon..." }
    })
    .get("/force-sync-with-github", async () => {
      const { exitCode, stderr } =
        await $`git reset --hard origin/${process.env.GITHUB_BRANCH}`.quiet()
      if (exitCode) {
        logger.error(
          {
            additionalDetails: stderr.toString().trim(),
            emoji: "🔄🚨",
          },
          "Failed to reset to origin",
        )
        return {
          message: "Failed to reset to origin",
        }
      }
      logger.info({ emoji: "🔄" }, "Reset to origin")
      return { message: "Reset to origin" }
    })
    .get(
      "/webhook",
      async ({ query }) => {
        if (query.check === "true") return { message: "Set up successfully" }
        return { message: "Restarting addon..." }
      },
      {
        query: t.Object({
          check: t.Optional(t.Literal("true")),
        }),
      },
    )
    .get("/addon-info", async () => {
      const { data, error } = await getAddonInfo()

      if (error) return error
      return {
        ...data.data,
        options: "HIDDEN",
        schema: "HIDDEN",
        translations: "HIDDEN",
      }
    })
    .get("/stats", async () => stats)
    .get(
      "/log.txt",
      async ({ query }) => {
        return getLogsFromFile({
          level: "trace",
          limit: query.limit,
          filter: query.filter,
        })
      },
      {
        query: t.Object({
          limit: t.Optional(t.String()),
          filter: t.Optional(t.String()),
        }),
      },
    )
    .ws("/logsws", {
      query: t.Object({
        limit: t.Optional(t.String()),
        level: t.Union([
          t.Literal("trace"),
          t.Literal("debug"),
          t.Literal("info"),
          t.Literal("warn"),
          t.Literal("error"),
          t.Literal("fatal"),
        ]),
        offset: t.Optional(t.String()),
        filter: t.Optional(t.String()),
      }),

      async open(ws) {
        ws.send(
          await getLogsFromFile({
            filter: ws.data.query.filter,
            level: ws.data.query.level,
            limit: ws.data.query.limit,
            offset: ws.data.query.offset,
          }),
        )
        logSubscribers.set(ws.id, async () => {
          ws.send(
            await getLogsFromFile({
              filter: ws.data.query.filter,
              level: ws.data.query.level,
              limit: ws.data.query.limit,
              offset: ws.data.query.offset,
            }),
          )
        })
      },
      close(ws) {
        logSubscribers.delete(ws.id)
      },
    })
    .ws("/ws", {
      response: t.String(),
      async open(ws) {
        ws.send(lastMessage || "Connected successfully. Awaiting messages...")
        subscribers.set(ws.id, (message) => {
          ws.send(message)
        })
      },
      close(ws) {
        subscribers.delete(ws.id)
      },
    })
    .get(
      `/assets/${getBaseName(cssOutputFile)}`,
      () =>
        new Response(Bun.file(cssOutputFile), {
          headers: { "content-type": "text/css" },
        }),
    )
  buildResult.outputs.forEach((output) => {
    server.get(
      `/assets/${getBaseName(output.path)}`,
      () =>
        new Response(Bun.file(output.path), {
          headers: { "content-type": "text/javascript" },
        }),
    )
  })

  server.listen(8099)
  logger.info({ emoji: "🌐" }, "Web server listening on port 8099")

  const directory = join(process.cwd(), ".")
  logger.debug({ emoji: "👀" }, "Watching log.txt")
  const watcher = watch(directory, function onFileChange(_event, filename) {
    if (filename === "log.txt") {
      logSubscribers.forEach((send) => send())
    }
  })

  const watchLogFileSize = async () => {
    const logFileSize = Bun.file("./log.txt").size
    const limit = 3 * ONE_MEGABYTE

    logger.debug(
      { emoji: "🗒️" },
      `log.txt size: ${logFileSize}. Limit is ${limit}.`,
    )

    if (logFileSize > limit) {
      logger.debug(
        { emoji: "🗑️" },
        "log.txt is too big, deleting old log.txt and renaming new log.txt to old log.txt",
      )
      await $`rm -f ./log.txt.old`.quiet().catch((e) => {
        logger.error(
          { emoji: "🚨", additionalDetails: e.message },
          "Failed to delete old log.txt",
        )
      })

      await $`cp ./log.txt ./log.txt.old`.catch((e) => {
        logger.error(
          { emoji: "🚨", additionalDetails: e.message },
          "Failed copying log.txt to log.txt.old",
        )
      })

      await $`cat /dev/null > ./log.txt`.catch((e) => {
        logger.error(
          { emoji: "🚨", additionalDetails: e.message },
          "Failed to empty log.txt",
        )
      })
    }

    setTimeout(watchLogFileSize, 10 * ONE_MINUTE)
  }

  watchLogFileSize()

  getStats()

  addKillListener(async () => {
    watcher.close()
    await server.stop()
  })

  let emptyStringCount = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const app = getSubprocesses().app
    const stdoutReader = getReader("stdout", app.stdout)
    const stderrReader = getReader("stderr", app.stderr)
    const stdoutResult = await stdoutReader.read()
    const stderrResult =
      stdoutResult.value === undefined
        ? await stderrReader.read()
        : ({
            value: undefined,
            done: true,
          } satisfies ReadableStreamDefaultReadDoneResult)

    const streamEnded =
      stdoutResult.done &&
      (stderrResult.done || stderrResult.value === undefined)
    if (streamEnded) {
      logger.warn(
        {
          emoji: "😴",
          additionalDetails: JSON.stringify({ exitCode: app.exitCode }),
        },
        "Subprocess output streams ended; waiting for restart or new output",
      )
      await new Promise((resolve) => setTimeout(resolve, 1000))
      continue
    }

    const chunk = stdoutResult.value ?? stderrResult.value
    const decodedString = chunk ? decoder.decode(chunk) : ""
    const convertedMessage = convert.toHtml(decodedString)
    if (convertedMessage !== "") {
      lastMessage = convertedMessage
    }
    if (convertedMessage === "") {
      emptyStringCount += 1
      const emptyStringMessage =
        "Process is returning an empty string"
      if (emptyStringCount === 10) {
        onProcessError(emptyStringMessage)
      }
      subscribers.forEach((send) =>
        send("Process is returning an empty string. This was the last non-empty message:\n\n" +
        lastMessage),
      )
      logger.fatal(
        {
          emoji: "💀",
          additionalDetails: JSON.stringify({
            exitCode: getSubprocesses().app.exitCode,
          }),
        },
        emptyStringMessage,
      )
      await new Promise((resolve) => setTimeout(resolve, 1000))
      continue
    }
    emptyStringCount = 0
    subscribers.forEach((send) => send(convertedMessage))
  }

  return server
}

export type WebServer = Awaited<ReturnType<typeof startWebappServer>>

const getLogsFromFile = async ({
  level,
  limit: limitProp,
  offset: offsetProp = "0",
  filter,
}: {
  level: keyof typeof levels
  limit?: string
  offset?: string
  filter?: string
}) => {
  try {
    const parsedLimit = Number(limitProp)
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? parsedLimit
      : undefined
    const parsedOffset = Number(offsetProp)
    const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0
      ? parsedOffset
      : 0

    const normalizedFilter = filter?.toLowerCase().trim()

    const parsedLogs = (await Bun.file("./log.txt").text())
      .split("\n")
      .reduce((result, line) => {
        if (!line) return result

        try {
          const log = JSON.parse(line) as LogSchema
          return result.concat(log)
        } catch (e) {
          return result.concat({
            msg: e instanceof Error ? e.message : "Unknown parse error",
            level: levels.fatal,
          })
        }
      }, [] as LogSchema[])

    const filteredLogs = parsedLogs.filter((log) => {
      if (log.level < levels[level]) return false

      if (normalizedFilter) {
        const haystack = JSON.stringify(log).toLowerCase()
        if (!haystack.includes(normalizedFilter)) return false
      }

      return true
    })

    const paginatedLogs = limit
      ? filteredLogs.slice(
          Math.max(filteredLogs.length - limit * (offset + 1), 0),
          filteredLogs.length - limit * offset || filteredLogs.length,
        )
      : filteredLogs

    return { logs: paginatedLogs }
  } catch (e) {
    return {
      logs: [
        {
          msg: "Error reading log.txt file",
          level: levels.fatal,
        },
        {
          msg: e instanceof Error ? e.message : e,
          level: levels.fatal,
        },
      ] as LogSchema[],
    }
  }
}
const ONE_MEGABYTE = 1024 * 1024

const getBaseName = <const TString extends string>(path: TString) => {
  return basename(path) as List.Last<String.Split<TString, "/">>
}
