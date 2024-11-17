import type { HaConnection } from "@typed-assistant/connection"
import { quietLogger } from "@typed-assistant/logger"
import {
  ONE_HOUR,
  ONE_MINUTE,
  ONE_SECOND,
} from "@typed-assistant/utils/durations"
import { differenceInMilliseconds } from "date-fns"
import { Box, Text } from "ink"
import { useEffect, useState } from "react"
import { GitInfo } from "./GitInfo"
import { useConnectionStatus } from "./useConnectionStatus"

const startupTime = new Date()
const SPEED = 1
const diffIntervalMap = {
  seconds: 1000 / SPEED,
  minutes: ONE_MINUTE / SPEED,
  hours: (ONE_MINUTE * 10) / SPEED,
} as const
const Uptime = () => {
  const diffInMilliseconds =
    differenceInMilliseconds(new Date(), startupTime) * SPEED
  const mode =
    diffInMilliseconds / ONE_SECOND < 120
      ? "seconds"
      : diffInMilliseconds / ONE_MINUTE < 120
        ? "minutes"
        : "hours"
  const [, setCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((count) => count + 1)
    }, diffIntervalMap[mode])
    return () => clearInterval(interval)
  }, [mode])

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      paddingX={1}
      borderStyle="single"
    >
      <Text>
        Uptime:{" "}
        {mode === "seconds"
          ? Math.round(diffInMilliseconds / ONE_SECOND)
          : mode === "minutes"
            ? Math.round(diffInMilliseconds / ONE_MINUTE)
            : Math.round(diffInMilliseconds / ONE_HOUR)}{" "}
        {mode}
      </Text>
    </Box>
  )
}

export const Status = ({
  connection,
  latestCommitId,
}: {
  connection: HaConnection
  latestCommitId?: string
}) => {
  const state = useConnectionStatus(connection)

  useEffect(() => {
    quietLogger.info({ emoji: "🧦" }, `WSConnection: ${state.state}`)
  }, [state.state])

  return (
    <>
      <Box gap={0} display="flex" flexDirection="row">
        <Box
          display="flex"
          flexDirection="column"
          flexGrow={1}
          alignItems="center"
          gap={1}
          paddingX={1}
          borderColor={connectionStateColourMap[state.state]}
          borderStyle="single"
        >
          <Text>{state.state.toUpperCase()}</Text>
          {state.error ? (
            <Box>
              <Text>{state.error}</Text>
            </Box>
          ) : null}
        </Box>
        <Uptime />
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          paddingX={1}
          borderStyle="single"
        >
          <Text>PID: {process.pid}</Text>
        </Box>
        <GitInfo latestCommitId={latestCommitId} />
      </Box>
    </>
  )
}

const connectionStateColourMap = {
  connecting: "yellow",
  connected: "green",
  disconnected: "red",
  idle: "grey",
  errored: "red",
} as const
