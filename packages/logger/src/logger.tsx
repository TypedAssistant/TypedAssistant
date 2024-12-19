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

const formatMessage = (
  mergeObject: MergeObject | string,
  message?: string,
  emoji: string = "🔍",
): string => {
  const details =
    typeof mergeObject === "string" ? undefined : mergeObject.additionalDetails
  const msg = typeof mergeObject === "string" ? mergeObject : message
  const msgEmoji =
    typeof mergeObject === "string" ? emoji : mergeObject.emoji || emoji

  return `${msgEmoji} ${msg}${details ? ` :: ${details}` : ""}`
}

export const logger = {
  trace: (mergeObject: MergeObject | string, message?: string) => {
    console.log(formatMessage(mergeObject, message))
    return quietLoggerPino.trace(mergeObject, message)
  },
  debug: (mergeObject: MergeObject | string, message?: string) => {
    console.log(formatMessage(mergeObject, message))
    return quietLoggerPino.debug(mergeObject, message)
  },
  info: (mergeObject: MergeObject | string, message?: string) => {
    console.log(formatMessage(mergeObject, message))
    return quietLoggerPino.info(mergeObject, message)
  },
  warn: (mergeObject: MergeObject | string, message?: string) => {
    console.log(formatMessage(mergeObject, message))
    return quietLoggerPino.warn(mergeObject, message)
  },
  error: (mergeObject: MergeObject | string, message?: string) => {
    console.log(formatMessage(mergeObject, message))
    return quietLoggerPino.error(mergeObject, message)
  },
  fatal: (mergeObject: MergeObject | string, message?: string) => {
    console.log(formatMessage(mergeObject, message))
    return quietLoggerPino.fatal(mergeObject, message)
  },
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
