import axios from "axios";

const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

export async function retryTransientRequest<T>(
  request: () => Promise<T>,
  maxAttempts = 6,
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

      await wait(resolveRetryDelay(error, attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Permintaan tidak dapat diproses.");
}

function isRetryableRequestError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return error.code === "ERR_NETWORK";
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
