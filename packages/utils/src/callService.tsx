import { quietLogger } from "@typed-assistant/logger"
import type { Services } from "@typed-assistant/types"
import { getHassAPI, getHassToken, getHassUrl } from "./getHassAPI"

const token = getHassToken()
const url = getHassUrl()

export const callService = async <
  TDomain extends keyof Services,
  TService extends keyof Services[TDomain],
>(
  domain: TDomain,
  service: TService,
  serviceData: Services[TDomain][TService],
  options: { signal?: AbortSignal } = {},
) => {
  if (!url) throw new Error("Missing HASS_SERVER")
  if (!token) throw new Error("Missing HASS_TOKEN")

  const entity_id = (serviceData as { entity_id?: string | string[] }).entity_id
  quietLogger.info(
    { additionalDetails: JSON.stringify(serviceData, null, 2), emoji: "🤵‍♂️" },
    `${domain}/${String(service)} called` +
      (entity_id
        ? ` with ${Array.isArray(entity_id) ? entity_id.join(", ") : entity_id}`
        : ""),
  )

  try {
    const data = await getHassAPI(
      `/api/services/${domain}/${String(service)}`,
      {
        method: "POST",
        body: JSON.stringify(serviceData),
        signal: options.signal,
      },
    )

    return { error: undefined, data: data }
  } catch (error) {
    return { error, data: undefined }
  }
}
