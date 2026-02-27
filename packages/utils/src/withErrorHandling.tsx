export function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
) {
  return async (...args: TArgs) => {
    try {
      return { data: await fn(...args), error: undefined }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      return { data: undefined, error: err }
    }
  }
}
