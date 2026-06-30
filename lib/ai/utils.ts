/**
 * Wraps an async operation with a timeout using AbortController.
 * Automatically handles cleaning up the timeout and throwing a descriptive error.
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  providerName: string,
  timeoutMs: number = 90000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fn(controller.signal);
  } catch (error: any) {
    if (error.name === "AbortError" || controller.signal.aborted) {
      throw new Error(`${providerName} provider timed out after ${timeoutMs / 1000} seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
