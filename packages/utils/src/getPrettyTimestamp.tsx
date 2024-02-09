export function getPrettyTimestamp(timestamp?: number) {
  const now = timestamp ? new Date(timestamp) : new Date()
  return now.toLocaleString(
    (typeof process !== "undefined"
      ? process.env.LOCALE
      : typeof navigator !== "undefined"
        ? navigator.language
        : null) ?? "en-GB",
    { hourCycle: "h24" },
  )
}
