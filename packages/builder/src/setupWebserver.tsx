import type { LogSchema } from "@typed-assistant/logger"
import { logger } from "@typed-assistant/logger"
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
import { levels } from "@typed-assistant/logger/levels"
import { getSupervisorAPI } from "@typed-assistant/utils/getHassAPI"
import { withErrorHandling } from "@typed-assistant/utils/withErrorHandling"
import { ONE_SECOND } from "@typed-assistant/utils/durations"

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
}: {
  basePath: string
  getSubprocesses: () => {
    app: Subprocess<"ignore", "pipe", "pipe">
  }
  onRestartAppRequest: () => void
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
        return getLogsFromFile({ level: "trace", limit: query.limit })
      },
      {
        query: t.Object({
          limit: t.Optional(t.String()),
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
      }),

      async open(ws) {
        ws.send(
          await getLogsFromFile({
            level: ws.data.query.level,
            limit: ws.data.query.limit,
            offset: ws.data.query.offset,
          }),
        )
        logSubscribers.set(ws.id, async () => {
          ws.send(
            await getLogsFromFile({
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

  getStats()

  addKillListener(async () => {
    watcher.close()
    await server.stop()
  })

  // eslint-disable-next-line no-constant-condition
  while (true) {
    getSubprocesses().app.exitCode
    const stdoutReader = getReader("stdout", getSubprocesses().app.stdout)
    const stderrReader = getReader("stderr", getSubprocesses().app.stderr)
    const { value } = await stdoutReader.read()
    const { value: stderrValue } = value
      ? { value: undefined }
      : await stderrReader.read()

    const decodedString = stderrValue
      ? decoder.decode(stderrValue)
      : decoder.decode(value)
    const convertedMessage = convert.toHtml(decodedString)
    if (convertedMessage !== "") {
      lastMessage = convertedMessage
    }
    if (convertedMessage === "") {
      subscribers.forEach((send) =>
        send(
          "Process is returning an empty string. This was the last non-empty message:\n\n" +
            lastMessage,
        ),
      )
      logger.fatal(
        {
          emoji: "💀",
          additionalDetails: JSON.stringify({
            exitCode: getSubprocesses().app.exitCode,
          }),
        },
        "Process is returning an empty string",
      )
      await new Promise((resolve) => setTimeout(resolve, 1000))
      continue
    }
    subscribers.forEach((send) => send(convertedMessage))
  }

  return server
}

export type WebServer = Awaited<ReturnType<typeof startWebappServer>>

const getLogsFromFile = async ({
  level,
  limit: limitProp,
  offset: offsetProp = "0",
}: {
  level: keyof typeof levels
  limit?: string
  offset?: string
}) => {
  try {
    const limit = Number(limitProp)
    const offset = Number(offsetProp)
    const lines = (await Bun.file("./log.txt").text())
      .split("\n")
      .map(
        (line) =>
          (line
            ? JSON.parse(line)
            : { msg: "Empty line", level: levels.fatal }) as LogSchema,
      )
      .filter((log) => log.level >= levels[level])

    const logFile = limit
      ? lines.slice(
          lines.length - 1 - limit * (offset + 1),
          lines.length - 1 - limit * offset,
        )
      : lines

    return { logs: logFile }
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

const getBaseName = <const TString extends string>(path: TString) => {
  return basename(path) as List.Last<String.Split<TString, "/">>
}
