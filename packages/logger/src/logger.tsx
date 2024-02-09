import pino from "pino"

type MergeObject = {
  additionalDetails?: string
  emoji?: string
}

export type LogSchema = MergeObject & {
  id: string
  level: number
  time: string
  pid: number
  hostname: string
  msg: string
}

const logFile = process.env.LOG_FILE ?? "./log.txt"

const loggerPino = pino(
  {
    level: "trace",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.transport({
    targets: [
      {
        level: "trace",
        target: "pino-pretty",
        options: {
          hideObject: true,
          messageFormat:
            "{emoji} {msg}{if additionalDetails} :: {additionalDetails}{end}",
        },
      },
      {
        level: "trace",
        target: "pino/file",
        options: { destination: logFile },
      },
    ],
  }),
)

export const logger = {
  trace: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.trace(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
  debug: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.debug(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
  info: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.info(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
  warn: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.warn(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
  error: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.error(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
  fatal: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.fatal(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
}

const quietLoggerPino = pino(
  {
    level: "trace",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.transport({
    targets: [
      {
        level: "trace",
        target: "pino/file",
        options: { destination: logFile },
      },
    ],
  }),
)

export const quietLogger = {
  trace: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.trace(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
  debug: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.debug(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
  info: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.info(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
  warn: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.warn(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
  error: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.error(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
  fatal: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.fatal(
      {
        ...(typeof mergeObject === "string" ? {} : mergeObject),
        id: crypto.randomUUID(),
      },
      typeof mergeObject === "string" ? mergeObject : message,
    ),
}
