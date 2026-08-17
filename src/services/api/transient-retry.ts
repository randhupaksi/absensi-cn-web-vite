import axios from "axios";

const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

export type TransientRetryEvent = {
  attempt: number;
  nextAttempt: number;
  maxAttempts: number;
  delayMilliseconds: number;
  error: unknown;
};

type TransientRetryOptions = {
  onRetry?: (event: TransientRetryEvent) => void;
};

export async function retryTransientRequest<T>(
  request: () => Promise<T>,
  maxAttempts = 6,
  options?: TransientRetryOptions,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (!isRetryableRequestError(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      const delayMilliseconds = resolveRetryDelay(error, attempt);
      options?.onRetry?.({
        attempt: attempt + 1,
        nextAttempt: attempt + 2,
        maxAttempts,
        delayMilliseconds,
        error,
      });
      await wait(delayMilliseconds);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Permintaan tidak dapat diproses.");
}

function isRetryableRequestError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return error.code === "ERR_NETWORK";
  if (error.response.data?.code === "LOGIN_LOCKED") return false;
  return RETRYABLE_STATUS_CODES.has(error.response.status);
}

function resolveRetryDelay(error: unknown, attempt: number) {
  const retryAfter = axios.isAxiosError(error)
    ? parseRetryAfter(error.response?.headers?.["retry-after"])
    : null;
  const backoff = retryAfter ?? Math.min(1_000 * 2 ** attempt, 8_000);
  return backoff + 250 + Math.random() * 1_000;
}

function parseRetryAfter(value: unknown) {
  const seconds = typeof value === "number" ? value : Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : null;
}

function wait(duration: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, duration));
}
