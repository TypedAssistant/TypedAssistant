import { levels } from "@typed-assistant/logger/levels"
import { getPrettyTimestamp } from "@typed-assistant/utils/getPrettyTimestamp"
import { useState } from "react"
import { AppSection } from "./AppSection"
import { WSIndicator } from "./WSIndicator"
import { useLogStore } from "./logStore"
import { buttonStyle } from "./styles"

export const Logs = ({ basePath }: { basePath: string }) => {
  const [dateTimeVisibility, setDateTimeVisibility] = useState<
    "hidden" | "timeOnly" | "visible"
  >("timeOnly")
  const { level, setLevel, logs, offset, setOffset, ws, filter, setFilter } =
    useLogStore()

  return (
    <>
      <AppSection
        renderHeader={() => (
          <>
            <h2 className="mb-2 text-2xl flex items-baseline gap-3">
              Logs <WSIndicator ws={ws?.ws} />
            </h2>

            <div className="flex gap-2 mb-2">
              <a className={buttonStyle} href={`${basePath}/log.txt?limit=500`}>
                View raw log.txt
              </a>
              <input
                type="search"
                placeholder="Filter logs..."
                className="border border-gray-300 rounded-md text-slate-800 px-2 flex-grow placeholder:text-slate-700"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-between w-full items-end">
              <div className="flex flex-wrap gap-2">
                <div className="">
                  <label className="block mb-1" htmlFor="dateTimeVisibility">
                    Date/Time
                  </label>
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
                <div className="">
                  <label className="block mb-1" htmlFor="level">
                    Level
                  </label>
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
              </div>

              <div className="flex gap-2">
                {offset > 0 && (
                  <button
                    className={buttonStyle}
                    onClick={() => setOffset((offset) => offset - 1)}
                  >
                    Previous
                  </button>
                )}
                <button
                  className={buttonStyle}
                  onClick={() => setOffset((offset) => offset + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      >
        <pre>
          <ul>
            {logs
              .filter((log) => log.level >= (levels[level] ?? 0))
              .sort(
                (a, b) =>
                  new Date(b.time).getTime() - new Date(a.time).getTime(),
              )
              .map((log) => {
                return (
                  <li key={log.id} className="flex gap-1">
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
    </>
  )
}
