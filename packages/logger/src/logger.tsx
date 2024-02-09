import pino from "pino"

type MergeObject = {
  additionalDetails?: string
  emoji?: string
}

export type LogSchema = MergeObject & {
  level: number
  time: number
  pid: number
  hostname: string
  msg: string
}

const logFile = process.env.LOG_FILE ?? "./log.txt"

export const loggerPino = pino(
  { level: "trace" },
  pino.transport({
    targets: [
      {
        level: "trace",
        target: "pino-pretty",
        options: {
          hideObject: true,
          messageFormat:
            "{pid} - {emoji} {msg}{if additionalDetails} :: {additionalDetails}{end}",
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
    loggerPino.trace(mergeObject, message),
  debug: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.debug(mergeObject, message),
  info: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.info(mergeObject, message),
  warn: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.warn(mergeObject, message),
  error: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.error(mergeObject, message),
  fatal: (mergeObject: MergeObject | string, message?: string) =>
    loggerPino.fatal(mergeObject, message),
}

export const quietLoggerPino = pino(
  { level: "trace" },
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
    quietLoggerPino.trace(mergeObject, message),
  debug: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.debug(mergeObject, message),
  info: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.info(mergeObject, message),
  warn: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.warn(mergeObject, message),
  error: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.error(mergeObject, message),
  fatal: (mergeObject: MergeObject | string, message?: string) =>
    quietLoggerPino.fatal(mergeObject, message),
}
