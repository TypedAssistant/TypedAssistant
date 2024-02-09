import { getHassToken, getHassUrl } from "@typed-assistant/utils/getHassAPI"
import type { Connection, HassEntities } from "home-assistant-js-websocket"
import { createSocket } from "./socket"

// Normal require(), and cast to the static type
const ha =
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
  require("home-assistant-js-websocket/dist/haws.cjs") as typeof import("home-assistant-js-websocket")

const token = getHassToken()
const url = getHassUrl()

if (!token || !url) {
  throw new Error("HASS_TOKEN and HASS_SERVER must be set")
}
const configuration = { token, url }

export class HaConnection {
  public pendingConnection: Promise<Connection> | undefined
  public connection: Connection | undefined

  constructor() {}

  public getConnection = async () => {
    if (this.connection !== undefined) {
      return this.connection
    }
    if (this.connection === undefined && this.pendingConnection !== undefined) {
      return this.pendingConnection
    }

    const auth = new ha.Auth({
      access_token: configuration.token,
      expires: +new Date(new Date().getTime() + 1e11),
      hassUrl: configuration.url,
      clientId: "",
      expires_in: +new Date(new Date().getTime() + 1e11),
      refresh_token: "",
    })

    try {
      this.pendingConnection = ha.createConnection({
        auth,
        createSocket: async () => createSocket(auth),
      })
      await this.pendingConnection.then((conn) => {
        this.connection = conn
        this.pendingConnection = undefined
      })
    } catch (error) {
      this.handleConnectionError(error)
      throw error
    }

    return this.connection
  }

  private handleConnectionError = (error: unknown) => {
    this.connection = undefined
    const tokenIndication = `${configuration.token}`.substring(0, 5)
    let errorText = error
    switch (error) {
      case 1:
        errorText = "ERR_CANNOT_CONNECT"
        break
      case 2:
        errorText = "ERR_INVALID_AUTH"
        break
      case 3:
        errorText = "ERR_CONNECTION_LOST"
        break
      case 4:
        errorText = "ERR_HASS_HOST_REQUIRED"
        break
    }
    errorText = `Error connecting to your Home Assistant Server at ${configuration.url} and token '${tokenIndication}...', check your network or update your VS Code Settings, make sure to (also) check your workspace settings! Error: ${errorText}`
    console.error("❌", errorText)
  }

  public getHassEntities = async (
    callback: (entities: HassEntities) => void,
  ) => {
    if (!this.connection) {
      await this.getConnection()
      if (!this.connection) return
    }
    return ha.subscribeEntities(this.connection, (entities) => {
      callback(entities)
    })
  }

  public async disconnect(): Promise<void> {
    if (this.pendingConnection) {
      await this.pendingConnection
    }
    if (!this.connection) {
      return
    }
    this.connection.close()
    this.connection = undefined
  }
}
