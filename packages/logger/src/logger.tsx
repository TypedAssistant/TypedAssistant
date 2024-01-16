import fs from "fs"
import { join } from "path"

const originalConsoleLog = console.log

const logFile = process.env.LOG_FILE ?? "log.txt"

export const quietLog = (...messages: unknown[]) => {
  if (process.env.NODE_ENV === "test") return
  const now = new Date()
  const timestamp = now.toLocaleString()
  const filePath = join(process.cwd(), logFile)

  const message = `[${timestamp}] ${messages}\n`
  fs.appendFileSync(filePath, message)

  const stats = fs.statSync(filePath)
  const fileSizeInBytes = stats.size
  const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024)

  const MAX_SIZE_MEGABYTES = 10
  if (fileSizeInMegabytes > MAX_SIZE_MEGABYTES) {
    const data = fs.readFileSync(filePath, "utf8")
    const lines = data.split("\n")
    const numLinesToRemove = lines.length - 10000 // 10MB / 1KB per line = 10000 lines
    const truncatedData = lines.slice(numLinesToRemove).join("\n")
    fs.writeFileSync(filePath, truncatedData)
  }

  return message
}

/** Logs to the console, as well as log.txt */
export const log = (...messages: unknown[]) => {
  if (process.env.NODE_ENV === "test") return
  quietLog(...messages)
  originalConsoleLog(...messages)
}
