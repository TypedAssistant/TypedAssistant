import { describe, expect, test } from "vitest"
import {
  formatMemorySample,
  parseMemoryEvents,
  parseProcStatus,
} from "./memoryTelemetry"

describe("memory telemetry", () => {
  test("parses process status memory values as bytes", () => {
    expect(
      parseProcStatus(`
Name: bun
VmRSS:      2048 kB
RssAnon:    1536 kB
RssFile:     512 kB
VmSwap:       64 kB
`),
    ).toEqual({
      rssBytes: 2 * 1024 * 1024,
      anonymousRssBytes: 1536 * 1024,
      fileRssBytes: 512 * 1024,
      swapBytes: 64 * 1024,
    })
  })

  test("parses cgroup OOM events", () => {
    expect(
      parseMemoryEvents(`low 0
high 0
max 0
oom 0
oom_kill 2
oom_group_kill 0
`),
    ).toMatchObject({ oom: 0, oom_kill: 2 })
  })

  test("formats unavailable and measured values", () => {
    const formatted = formatMemorySample({
      timestamp: "2026-07-27T10:57:00.000Z",
      pid: 217768,
      rssBytes: 2 * 1024 * 1024,
      cgroupOomKills: 2,
    })

    expect(formatted).toContain("pid=217768 rss=2.0 MiB anon=unavailable")
    expect(formatted).toContain("oomKills=2")
  })
})
