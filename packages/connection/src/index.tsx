import { quietLogger } from "@typed-assistant/logger"
import { getHassToken, getHassUrl } from "@typed-assistant/utils/getHassAPI"
import type { Services } from "@typed-assistant/types"
import type { Connection, HassEntities } from "home-assistant-js-websocket"
import { createSocket } from "./socket"

// Normal require(), and cast to the static type
const ha =
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
  require("home-assistant-js-websocket/dist/haws.cjs") as typeof import("home-assistant-js-websocket")

export class HaConnection {
  public connection: Connection | undefined

  configuration: {
    token: string
    url: string
  }

  constructor() {
    const token = getHassToken()
    const url = getHassUrl()

    if (!token || !url) {
      throw new Error("HASS_TOKEN and HASS_SERVER must be set")
    }

    this.configuration = { token, url }
  }

  public tryConnect = async (): Promise<HaConnection["connection"]> => {
    if (this.connection !== undefined) {
      return
    }

    const auth = new ha.Auth({
      access_token: this.configuration.token,
      expires: +new Date(new Date().getTime() + 1e11),
      hassUrl: this.configuration.url,
      clientId: "",
      expires_in: +new Date(new Date().getTime() + 1e11),
      refresh_token: "",
    })

    try {
      this.connection = await ha.createConnection({
        auth,
        createSocket: async () => createSocket(auth),
      })
    } catch (error) {
      this.handleConnectionError(error)
      throw error
    }

    return this.connection
  }

  private handleConnectionError = (error: unknown) => {
    this.connection = undefined
    const tokenIndication = `${this.configuration.token}`.substring(0, 5)
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
    errorText = `Error connecting to your Home Assistant Server at ${this.configuration.url} and token '${tokenIndication}...', check your network or update your VS Code Settings, make sure to (also) check your workspace settings! Error: ${errorText}`
    console.error("❌", errorText)
  }

  public getHassEntities = (callback: (entities: HassEntities) => void) => {
    if (!this.connection) throw new Error("No connection")
    return ha.subscribeEntities(this.connection, (entities) => {
      callback(entities)
    })
  }

  public disconnect(): void {
    if (!this.connection) {
      return
    }
    this.connection.close()
    this.connection = undefined
  }

  public callService = async <
    TDomain extends keyof Services,
    TService extends keyof Services[TDomain],
  >(
    domain: TDomain,
    service: TService,
    serviceData: Services[TDomain][TService],
    options: { signal?: AbortSignal } = {},
  ) => {
    const entity_id = (serviceData as { entity_id?: string | string[] })
      .entity_id
    quietLogger.info(
      { additionalDetails: JSON.stringify(serviceData, null, 2), emoji: "🤵‍♂️" },
      `${domain}/${String(service)} called` +
        (entity_id
          ? ` with ${Array.isArray(entity_id) ? entity_id.join(", ") : entity_id}`
          : ""),
    )

    try {
      const resp = await fetch(
        `${this.configuration.url}/api/services/${domain}/${String(service)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.configuration.token}`,
          },
          body: JSON.stringify(serviceData),
          signal: options.signal,
        },
      )

      const data = await resp.text?.()
      return { error: undefined, data: data }
    } catch (error) {
      return { error, data: undefined }
    }
  }

  public callApi = async (
    url: string,
    bodyData?: Record<string, unknown> | null,
    options: { method?: "GET" | "POST"; signal?: AbortSignal } = {},
  ) => {
    quietLogger.info(
      { additionalDetails: JSON.stringify(bodyData, null, 2), emoji: "🕸️" },
      `${url} called`,
    )

    try {
      const resp = await fetch(`${this.configuration.url}/${url}`, {
        method: options.method ?? "POST",
        headers: {
          Authorization: `Bearer ${this.configuration.token}`,
        },
        body: bodyData ? JSON.stringify(bodyData) : undefined,
        signal: options.signal,
      })

      const data = await resp.text?.()
      return { error: undefined, data: data }
    } catch (error) {
      return { error, data: undefined }
    }
  }
}
