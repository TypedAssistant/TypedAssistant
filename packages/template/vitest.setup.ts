console.Console = function Console() {
  return {
    log: () => {},
    warn: () => {},
    error: () => {},
  }
} as unknown as typeof console.Console
