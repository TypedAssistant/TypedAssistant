import type { HaConnection } from "@typed-assistant/connection"
import {
  ONE_HOUR,
  ONE_MINUTE,
  ONE_SECOND,
} from "@typed-assistant/utils/durations"
import { quietLogger } from "@typed-assistant/logger"
import { differenceInMilliseconds } from "date-fns"
import type { Connection } from "home-assistant-js-websocket"
import { Box, Text } from "ink"
import { useEffect, useState } from "react"
import { GitInfo } from "./GitInfo"

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
  const [state, setState] = useState<{
    error?: string
    state: "idle" | "connecting" | "connected" | "disconnected" | "errored"
  }>({ state: "idle" })

  useEffect(() => {
    quietLogger.info({ emoji: "🧦" }, `WSConnection: ${state.state}`)
  }, [state.state])

  useEffect(() => {
    let connectionInstance: Connection | undefined
    const go = async () => {
      setState({ state: "connecting" })
      try {
        connectionInstance = await connection.getConnection()
      } catch (error) {
        setState({
          error: (error as Error).message ?? "Unknown error",
          state: "errored",
        })
        return
      }
      if (!connectionInstance) {
        setState({ state: "errored", error: "No connection" })
        return
      }
      setState({ state: "connected" })

      connectionInstance?.addEventListener("ready", () => {
        setState({ state: "connected" })
      })

      connectionInstance?.addEventListener("disconnected", () => {
        setState({ state: "disconnected" })
      })

      connectionInstance?.addEventListener("reconnect-error", () => {
        setState({ state: "errored", error: "Reconnect error" })
      })
    }

    go()
    return () => {
      connectionInstance?.close()
    }
  }, [connection])

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
