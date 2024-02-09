import { logger } from "@typed-assistant/logger"
import type { Auth } from "home-assistant-js-websocket"

const MSG_TYPE_AUTH_REQUIRED = "auth_required"
const MSG_TYPE_AUTH_INVALID = "auth_invalid"
const MSG_TYPE_AUTH_OK = "auth_ok"
const ERR_CANNOT_CONNECT = 1
const ERR_INVALID_AUTH = 2

let keepAliveTimeout: ReturnType<typeof setTimeout>

interface HaWebSocket extends WebSocket {
  haVersion: string
  ping: () => void
}

export function createSocket(auth: Auth): Promise<HaWebSocket> {
  // Convert from http:// -> ws://, https:// -> wss://
  const url = auth.wsUrl

  function connect(
    triesLeft: number,
    promResolve: (socket: HaWebSocket) => void,
    promReject: (err: number) => void,
  ) {
    if (triesLeft !== 3) {
      logger.info(
        { additionalDetails: url, emoji: "🔌" },
        `[Auth Phase] Connecting to Home Assistant... Tries left: ${triesLeft}`,
      )
    }

    const socket = new WebSocket(url) as HaWebSocket

    // If invalid auth, we will not try to reconnect.
    let invalidAuth = false

    const closeMessage = (ev: { code: number; reason: string }) => {
      let errorMessage
      if (ev && ev.code && ev.code !== 1000) {
        errorMessage = `WebSocket connection to Home Assistant closed with code ${ev.code} and reason ${ev.reason}`
      }
      closeOrError(errorMessage)
    }

    const errorMessage = (ev: Event) => {
      // If we are in error handler make sure close handler doesn't also fire.
      socket.removeEventListener("close", closeMessage)
      let errMessage = "Disconnected from Home Assistant with a WebSocket error"
      errMessage += ` with message: ${ev}`
      closeOrError(errMessage)
      return undefined as unknown
    }

    const closeOrError = (errorText?: string) => {
      clearTimeout(keepAliveTimeout)
      if (errorText) {
        logger.error(
          { additionalDetails: errorText, emoji: "🔌" },
          `WebSocket Connection to Home Assistant closed with an error`,
        )
      }
      if (invalidAuth) {
        promReject(ERR_INVALID_AUTH)
        return
      }

      // Reject if we no longer have to retry
      if (triesLeft === 0) {
        // We never were connected and will not retry
        promReject(ERR_CANNOT_CONNECT)
        return
      }

      const newTries = triesLeft === -1 ? -1 : triesLeft - 1
      // Try again in a second
      setTimeout(() => connect(newTries, promResolve, promReject), 1000)
    }

    // Auth is mandatory, so we can send the auth message right away.
    const handleOpen = async (): Promise<void> => {
      try {
        if (auth.expired) {
          await auth.refreshAccessToken()
        }
        socket.send(
          JSON.stringify({
            type: "auth",
            access_token: auth.accessToken,
          }),
        )
      } catch (err) {
        // Refresh token failed
        invalidAuth = err === ERR_INVALID_AUTH
        socket.close()
      }
    }

    const handleMessage = (event: { data: unknown; type: string }) => {
      const message = JSON.parse(event.data as string)

      // logger.info({emoji: "🔌"},
      //   `[Auth phase] Received a message of type ${message.type}`,
      //   message,
      // )

      switch (message.type) {
        case MSG_TYPE_AUTH_INVALID:
          invalidAuth = true
          socket.close()
          break

        case MSG_TYPE_AUTH_OK:
          socket.removeEventListener("open", handleOpen)
          socket.removeEventListener("message", handleMessage)
          socket.removeEventListener("close", closeMessage)
          socket.removeEventListener("error", errorMessage)
          socket.haVersion = message.ha_version
          promResolve(socket)
          break

        default:
          // We already send this message when socket opens
          if (message.type !== MSG_TYPE_AUTH_REQUIRED) {
            logger.error(
              { additionalDetails: message, emoji: "🔌" },
              "[Auth phase] Unhandled message",
            )
          }
      }
    }

    socket.addEventListener("open", handleOpen)
    socket.addEventListener("message", handleMessage)
    socket.addEventListener("close", closeMessage)
    socket.addEventListener("error", errorMessage)

    const keepAlive = () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping()
      }

      keepAliveTimeout = setTimeout(keepAlive, 30 * 1000)
    }

    keepAlive()
  }

  return new Promise((resolve, reject) => connect(3, resolve, reject))
}
