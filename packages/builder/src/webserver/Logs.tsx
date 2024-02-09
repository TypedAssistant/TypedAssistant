import { useCallback, useState } from "react"
import { z } from "zod"
import { AppSection } from "./AppSection"
import { WSIndicator } from "./WSIndicator"
import { app } from "./api"
import { useWS } from "./useWS"
import { getPrettyTimestamp } from "@typed-assistant/utils/getPrettyTimestamp"
import { levels } from "@typed-assistant/logger/levels"
import type { LogSchema } from "@typed-assistant/logger"

export const Logs = () => {
  const [limit, setLimit] = useState(200)
  const [level, setLevel] = useState<
    "trace" | "debug" | "info" | "warn" | "error" | "fatal"
  >("info")
  const [dateTimeVisibility, setDateTimeVisibility] = useState<
    "hidden" | "timeOnly" | "visible"
  >("timeOnly")
  const [logs, setLogs] = useState<LogSchema[]>([])

  const ws = useWS({
    subscribe: useCallback(
      () => app.logsws.subscribe({ $query: { limit: limit.toString() } }),
      [limit],
    ),
    onMessage: useCallback((event) => {
      setLogs(
        (JSON.parse(event.data).logs as string[]).map((log: string) =>
          JSON.parse(log),
        ),
      )
    }, []),
  })

  return (
    <AppSection
      renderHeader={() => (
        <>
          <h2 className="mb-2 text-2xl flex items-baseline gap-3">
            Logs <WSIndicator ws={ws.ws} />
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <label htmlFor="dateTimeVisibility">Date/Time</label>
              <select
                className="border border-gray-300 rounded-md text-slate-800 px-2"
                id="dateTimeVisibility"
                onChange={(e) =>
                  setDateTimeVisibility(
                    e.target.value as typeof dateTimeVisibility,
                  )
                }
                value={dateTimeVisibility}
              >
                <option value="hidden">Hidden</option>
                <option value="timeOnly">Time only</option>
                <option value="visible">Visible</option>
              </select>
            </div>
            <div className="flex gap-2">
              <label htmlFor="dateTimeVisibility">Level</label>
              <select
                className="border border-gray-300 rounded-md text-slate-800 px-2"
                id="level"
                onChange={(e) => setLevel(e.target.value as typeof level)}
                value={level}
              >
                <option value="trace">Trace</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
                <option value="fatal">Fatal</option>
              </select>
            </div>
            {/* <div className="flex gap-2">
              <label htmlFor="limit">Limit</label>
              <input
                className="border border-gray-300 rounded-md text-slate-800 px-2"
                id="limit"
                onChange={(e) => setLimit(Number(e.target.value))}
                size={8}
                value={limit}
              />
            </div> */}
          </div>
        </>
      )}
    >
      <pre>
        <ul>
          {logs
            .filter((log) => log.level >= (levels[level] ?? 0))
            .sort((a, b) => b.time - a.time)
            .map((log, index) => {
              return (
                <li key={index + JSON.stringify(log)} className="flex gap-1">
                  <span className="text-slate-400 mr-2">
                    {dateTimeVisibility === "hidden"
                      ? null
                      : dateTimeVisibility === "timeOnly"
                        ? new Date(log.time).toLocaleTimeString("en-GB")
                        : getPrettyTimestamp(log.time)}
                  </span>
                  <div className="flex">
                    {log.emoji}{" "}
                    {log.additionalDetails ? (
                      <details>
                        <summary>{log.msg}</summary>
                        <pre>{log.additionalDetails}</pre>
                      </details>
                    ) : (
                      log.msg
                    )}
                  </div>
                </li>
              )
            })}
        </ul>
      </pre>
    </AppSection>
  )
}
