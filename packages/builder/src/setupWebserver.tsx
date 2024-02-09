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

export const startWebappServer = async ({
  basePath,
  getSubprocesses,
}: {
  basePath: string
  getSubprocesses: () => {
    app: Subprocess<"ignore", "pipe", "pipe">
  }
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
    .get("/restart-addon", async () => {
      await killSubprocess(getSubprocesses().app)
      restartAddon()
      return { message: "Restarting addon..." }
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
    .get(
      "/log.txt",
      async ({ query }) => {
        return getLogsFromFile(query.limit)
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
      }),
      response: t.Object({ logs: t.Array(t.String()) }),
      async open(ws) {
        ws.send(await getLogsFromFile(ws.data.query.limit))
        logSubscribers.set(ws.id, async () => {
          ws.send(await getLogsFromFile(ws.data.query.limit))
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

  addKillListener(async () => {
    watcher.close()
    await server.stop()
  })

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const stdoutReader = getReader("stdout", getSubprocesses().app.stdout)
    const stderrReader = getReader("stderr", getSubprocesses().app.stderr)
    const { value } = await stdoutReader.read()
    const { value: stderrValue } = value
      ? { value: undefined }
      : await stderrReader.read()

    const decodedString = decoder.decode(value ?? stderrValue)
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
      await new Promise((resolve) => setTimeout(resolve, 1000))
      continue
    }
    subscribers.forEach((send) => send(convertedMessage))
  }

  return server
}

export type WebServer = Awaited<ReturnType<typeof startWebappServer>>

const getLogsFromFile = async (limit?: string) => {
  try {
    const lines = (await Bun.file("./log.txt").text()).split("\n")
    const logFile = limit
      ? lines.slice(lines.length - 1 - Number(limit), lines.length - 1)
      : lines
    return { logs: logFile }
  } catch (e) {
    return { logs: ["Error reading log.txt file"] }
  }
}

const getBaseName = <const TString extends string>(path: TString) => {
  return basename(path) as List.Last<String.Split<TString, "/">>
}
