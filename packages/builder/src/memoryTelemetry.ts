import { logger } from "@typed-assistant/logger"
import { ONE_MINUTE } from "@typed-assistant/utils/durations"
import type { Subprocess } from "bun"
import { readFile } from "fs/promises"

const CGROUP_PATH = "/sys/fs/cgroup"
const MAX_RECENT_SAMPLES = 60
const REPORT_RECENT_SAMPLES = 15
const LOG_EVERY_SAMPLES = 10

export type MemorySample = {
  timestamp: string
  pid: number
  rssBytes?: number
  anonymousRssBytes?: number
  fileRssBytes?: number
  swapBytes?: number
  cgroupCurrentBytes?: number
  cgroupPeakBytes?: number
  cgroupOomKills?: number
}

const readText = async (path: string) => {
  try {
    return await readFile(path, "utf8")
  } catch {
    return undefined
  }
}

const readNumber = async (path: string) => {
  const value = (await readText(path))?.trim()
  if (!value || value === "max") return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

export const parseProcStatus = (status: string) => {
  const values = new Map(
    status.split("\n").flatMap((line) => {
      const match = /^(\w+):\s+(\d+)\s+kB$/.exec(line)
      return match ? [[match[1], Number(match[2]) * 1024] as const] : []
    }),
  )

  return {
    rssBytes: values.get("VmRSS"),
    anonymousRssBytes: values.get("RssAnon"),
    fileRssBytes: values.get("RssFile"),
    swapBytes: values.get("VmSwap"),
  }
}

export const parseMemoryEvents = (events: string) =>
  Object.fromEntries(
    events.split("\n").flatMap((line) => {
      const match = /^(\w+)\s+(\d+)$/.exec(line)
      return match ? [[match[1], Number(match[2])] as const] : []
    }),
  ) as Record<string, number>

export const collectMemorySample = async (
  pid: number,
): Promise<MemorySample> => {
  const [procStatus, cgroupCurrentBytes, cgroupPeakBytes, memoryEvents] =
    await Promise.all([
      readText(`/proc/${pid}/status`),
      readNumber(`${CGROUP_PATH}/memory.current`),
      readNumber(`${CGROUP_PATH}/memory.peak`),
      readText(`${CGROUP_PATH}/memory.events`),
    ])

  return {
    timestamp: new Date().toISOString(),
    pid,
    ...(procStatus ? parseProcStatus(procStatus) : {}),
    cgroupCurrentBytes,
    cgroupPeakBytes,
    cgroupOomKills: memoryEvents
      ? parseMemoryEvents(memoryEvents).oom_kill
      : undefined,
  }
}

const formatBytes = (bytes: number | undefined) =>
  bytes === undefined
    ? "unavailable"
    : `${(bytes / 1024 / 1024).toFixed(1)} MiB`

export const formatMemorySample = (sample: MemorySample) =>
  [
    sample.timestamp,
    `pid=${sample.pid}`,
    `rss=${formatBytes(sample.rssBytes)}`,
    `anon=${formatBytes(sample.anonymousRssBytes)}`,
    `file=${formatBytes(sample.fileRssBytes)}`,
    `swap=${formatBytes(sample.swapBytes)}`,
    `cgroup=${formatBytes(sample.cgroupCurrentBytes)}`,
    `cgroupPeak=${formatBytes(sample.cgroupPeakBytes)}`,
    `oomKills=${sample.cgroupOomKills ?? "unavailable"}`,
  ].join(" ")

export const startMemoryTelemetry = (getApp: () => Pick<Subprocess, "pid">) => {
  let stopped = false
  let timeout: ReturnType<typeof setTimeout>
  let currentPid: number | undefined
  let firstSample: MemorySample | undefined
  let recentSamples: MemorySample[] = []
  let sampleCount = 0

  const sample = async () => {
    try {
      const pid = getApp().pid
      if (pid !== currentPid) {
        currentPid = pid
        firstSample = undefined
        recentSamples = []
        sampleCount = 0
      }

      const memorySample = await collectMemorySample(pid)
      firstSample ??= memorySample
      recentSamples.push(memorySample)
      recentSamples = recentSamples.slice(-MAX_RECENT_SAMPLES)
      sampleCount++

      if (sampleCount === 1 || sampleCount % LOG_EVERY_SAMPLES === 0) {
        logger.info(
          {
            additionalDetails: formatMemorySample(memorySample),
            emoji: "📈",
          },
          "App memory usage",
        )
      }
    } catch (error) {
      logger.debug(
        {
          additionalDetails:
            error instanceof Error ? error.message : `${error}`,
          emoji: "📈",
        },
        "Failed to sample app memory usage",
      )
    } finally {
      if (!stopped) timeout = setTimeout(sample, ONE_MINUTE)
    }
  }

  void sample()

  return {
    getReport: (pid: number) => {
      if (pid !== currentPid || !firstSample) {
        return "Memory telemetry unavailable for this process."
      }

      const samples = recentSamples.slice(-REPORT_RECENT_SAMPLES)
      if (samples[0] !== firstSample) samples.unshift(firstSample)

      return [
        "Memory telemetry (first sample and up to 15 most recent one-minute samples):",
        ...samples.map(formatMemorySample),
      ].join("\n")
    },
    stop: () => {
      stopped = true
      clearTimeout(timeout)
    },
  }
}
