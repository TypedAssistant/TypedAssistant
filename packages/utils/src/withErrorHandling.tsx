export function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
) {
  return async (...args: TArgs) => {
    try {
      return { data: await fn(...args), error: undefined }
    } catch (error) {
      return { data: undefined, error: error as Error }
    }
  }
}
