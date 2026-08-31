import axios from "axios";

export type SystemIssueKind =
  | "maintenance"
  | "offline"
  | "unavailable";

export type SystemIssue = {
  kind: SystemIssueKind;
  title: string;
  message: string;
  retryAfterSeconds?: number;
  requestId?: string;
  traceId?: string;
};

const SYSTEM_STATUS_EVENT = "absensi-cn:system-status";
const transientStatuses = new Set([502, 503, 504]);
let consecutiveFailures = 0;
let currentIssue: SystemIssue | null = null;

export function reportApiSuccess() {
  if (typeof window === "undefined") return;
  consecutiveFailures = 0;
  clearSystemIssue();
}

export function reportApiFailure(error: unknown) {
  if (typeof window === "undefined" || !axios.isAxiosError(error)) return;
  if (error.code === "ERR_CANCELED") return;

  const code = error.response?.data?.code;
  const requestId =
    error.response?.data?.request_id ??
    readHeader(error.response?.headers?.["x-request-id"]);
  const traceId = readHeader(error.response?.headers?.["x-trace-id"]);
  const retryAfterSeconds = readPositiveNumber(
    error.response?.headers?.["retry-after"],
  );

  if (code === "SYSTEM_MAINTENANCE") {
    consecutiveFailures += 1;
    dispatchIssue({
      kind: "maintenance",
      title: "Pembaruan sistem sedang berlangsung",
      message:
        error.response?.data?.message ??
        "Tunggu sekitar 30 detik, lalu coba lagi.",
      retryAfterSeconds: retryAfterSeconds ?? 30,
      requestId,
      traceId,
    });
    return;
  }

  const hasNoResponse = !error.response;
  const isTransientGatewayFailure = Boolean(
    error.response && transientStatuses.has(error.response.status),
  );
  if (!hasNoResponse && !isTransientGatewayFailure) {
    consecutiveFailures = 0;
    clearSystemIssue();
    return;
  }

  consecutiveFailures += 1;
  if (consecutiveFailures < 2 && navigator.onLine) return;

  dispatchIssue({
    kind: navigator.onLine ? "unavailable" : "offline",
    title: navigator.onLine
      ? "Server sedang mengalami gangguan"
      : "Koneksi internet terputus",
    message: navigator.onLine
      ? "Login belum dapat diproses. Silakan coba lagi beberapa saat."
      : "Periksa koneksi Wi-Fi atau data seluler, lalu coba lagi.",
    retryAfterSeconds,
    requestId,
    traceId,
  });
}

export function subscribeToSystemStatus(
  listener: (issue: SystemIssue | null) => void,
) {
  const handler = (event: Event) => {
    listener((event as CustomEvent<SystemIssue | null>).detail);
  };
  window.addEventListener(SYSTEM_STATUS_EVENT, handler);
  return () => window.removeEventListener(SYSTEM_STATUS_EVENT, handler);
}

export function getCurrentSystemIssue() {
  return currentIssue;
}

function dispatchIssue(issue: SystemIssue) {
  currentIssue = issue;
  window.dispatchEvent(
    new CustomEvent<SystemIssue>(SYSTEM_STATUS_EVENT, { detail: issue }),
  );
}

function clearSystemIssue() {
  if (currentIssue === null) return;
  currentIssue = null;
  window.dispatchEvent(
    new CustomEvent<SystemIssue | null>(SYSTEM_STATUS_EVENT, { detail: null }),
  );
}

function readHeader(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readPositiveNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
