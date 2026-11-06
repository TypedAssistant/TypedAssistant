export function inferArrayExampleType(example: string): string {
  try {
    // Service examples are documentation and may contain invalid JSON.
    const parsed: unknown = JSON.parse(example)
    if (!Array.isArray(parsed)) return "unknown"

    return JSON.stringify(parsed.map((item: unknown) => typeof item)).replace(
      /"/g,
      "",
    )
  } catch {
    return "unknown"
  }
}
