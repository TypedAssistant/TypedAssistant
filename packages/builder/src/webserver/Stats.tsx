import { useEffect, useState } from "react"
import { app } from "./api"
import { AppSection } from "./AppSection"
import { ONE_SECOND } from "@typed-assistant/utils/durations"

export const Stats = () => {
  const [counter, setCounter] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [stats, setStats] =
    useState<Awaited<ReturnType<typeof app.stats.get>>["data"]>(null)

  useEffect(() => {
    app.stats.get().then((stats) => {
      setLastUpdated(Date.now())
      if (stats.error) {
        setError(stats.error.message)
        return
      }
      setStats(stats.data)

      const timeout = setTimeout(() => {
        setCounter((c) => c + 1)
      }, 10 * ONE_SECOND)
      return () => clearTimeout(timeout)
    })
  }, [counter])

  return (
    <AppSection className="pb-0" fullHeight={false} scrollable={false}>
      {error ? (
        <>Error: {error}</>
      ) : stats ? (
        <>
          <div className="mb-3">
            <div className="mb-1">
              Memory:{" "}
              {stats.memory_usage
                ? `${bytesToMegaBytes(stats.memory_usage ?? 0)} / ${bytesToMegaBytes(stats.memory_limit ?? 0)}MB`
                : "Loading..."}
            </div>
            <ProgressBar value={stats.memory_percent ?? 0} />
          </div>
          <div className="mb-3">
            <div className="mb-1">
              CPU: {stats.cpu_percent ? `${stats.cpu_percent}%` : "Loading..."}
            </div>
            <ProgressBar value={stats.cpu_percent ?? 0} />
          </div>
          <div className=" text-slate-400">
            Max memory usage: {bytesToMegaBytes(stats.max_memory_usage)}MB. Last
            updated:{" "}
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Never"}
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </AppSection>
  )
}
const ProgressBar = ({ value }: { value: number }) => {
  return (
    <div className="relative w-full h-2 bg-slate-800 rounded-md overflow-hidden">
      <div
        className="absolute h-full bg-slate-600"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  )
}
const bytesToMegaBytes = (bytes: number) =>
  Math.round((bytes / 1024 / 1024) * 100) / 100
