import { differenceInMilliseconds } from "date-fns"
import type { Connection } from "home-assistant-js-websocket"
import { Box, Text } from "ink"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import {
  ONE_HOUR,
  ONE_MINUTE,
  ONE_SECOND,
} from "@typed-assistant/utils/durations"
import { EntitiesProvider } from "./entities"
import { quietLog } from "@typed-assistant/logger"
import { GitInfo } from "./GitInfo"
import type { HaConnection } from "@typed-assistant/connection"

const startupTime = new Date()
const SPEED = 1
const diffIntervalMap = {
  seconds: 5000 / SPEED,
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
      gap={1}
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

export const WSConnection = ({
  children,
  connection,
  latestCommitId,
}: {
  children?: ReactNode
  connection: HaConnection
  latestCommitId?: string
}) => {
  const [state, setState] = useState<{
    error?: string
    state: "idle" | "connecting" | "connected" | "disconnected" | "errored"
  }>({ state: "idle" })

  useEffect(() => {
    quietLog(`Connection: ${state.state}`)
  }, [state.state])

  useEffect(() => {
    let connectionInstance: Connection | undefined
    const go = async () => {
      setState({ state: "connecting" })
      try {
        connectionInstance = await connection.tryConnect()
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
  }, [])

  return (
    <>
      <Box>
        <Box
          display="flex"
          flexDirection="column"
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

        <GitInfo latestCommitId={latestCommitId} />
      </Box>

      <EntitiesProvider connection={connection}>{children}</EntitiesProvider>
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
