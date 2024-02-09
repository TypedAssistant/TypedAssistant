function fetchWithAuth(
  url: string,
  token: string,
  options?: Parameters<typeof fetch>[1],
) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    ...options,
  })
    .then(handleFetchError)
    .then((res) => {
      if (res.headers.get("content-type")?.includes("application/json")) {
        return res.json()
      }
      return res.text()
    })
}

export const handleFetchError = async (d: Response): Promise<Response> => {
  if (!d.ok)
    throw new Error(
      d.status +
        " " +
        d.statusText +
        (d.headers.get("Content-Type")?.includes("application/json")
          ? `:\n${JSON.stringify(await d.json(), null, 2)}`
          : ""),
    )
  return d
}

export function getSupervisorAPI<TJsonResponse>(
  url: string,
  options?: Parameters<typeof fetch>[1],
): Promise<TJsonResponse> {
  if (!process.env.SUPERVISOR_TOKEN) throw new Error("Missing SUPERVISOR_TOKEN")
  return fetchWithAuth(
    "http://supervisor" + url,
    process.env.SUPERVISOR_TOKEN,
    options,
  )
}

export function getHassAPI<TJsonResponse>(
  path: string,
  options?: Parameters<typeof fetch>[1],
): Promise<TJsonResponse> {
  const token = getHassToken()
  const url = getHassUrl()

  if (!url) throw new Error("Missing HASS_SERVER")
  if (!token) throw new Error("Missing HASS_TOKEN")
  return fetchWithAuth(url + path, token, options)
}

export function getHassToken() {
  return process.env.SUPERVISOR_TOKEN
    ? process.env.SUPERVISOR_TOKEN
    : process.env.HASS_TOKEN
}

export function getHassUrl() {
  return process.env.SUPERVISOR_TOKEN
    ? "http://supervisor/core"
    : process.env.HASS_SERVER
}
