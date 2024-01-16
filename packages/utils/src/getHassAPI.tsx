export function getHassAPI<TJsonResponse>(
  url: string,
  options?: Parameters<typeof fetch>[1],
): Promise<TJsonResponse> {
  return fetch(process.env.HASS_SERVER + url, {
    headers: { Authorization: `Bearer ${process.env.HASS_TOKEN}` },
    ...options,
  }).then((res) => {
    if (res.ok) return res.json() as Promise<TJsonResponse>
    throw new Error(res.status + " " + res.statusText)
  })
}
