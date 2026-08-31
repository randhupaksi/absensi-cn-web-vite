import {
  getCurrentSystemIssue,
  subscribeToSystemStatus,
  type SystemIssue,
} from "@/lib/system-status-events";
import { AlertTriangle, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function SystemStatusAlert() {
  const [issue, setIssue] = useState<SystemIssue | null>(getCurrentSystemIssue);

  useEffect(() => subscribeToSystemStatus(setIssue), []);

  useEffect(() => {
    const handleOffline = () =>
      setIssue({
        kind: "offline",
        title: "Koneksi internet terputus",
        message: "Sambungkan kembali perangkat ke internet untuk melanjutkan.",
      });
    const handleOnline = () =>
      setIssue((current) => (current?.kind === "offline" ? null : current));

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!issue) return null;

  const Icon = issue.kind === "offline" ? WifiOff : AlertTriangle;
  const tone =
    issue.kind === "unavailable"
      ? {
          container:
            "border-rose-300/70 bg-rose-50/95 text-rose-950 dark:border-rose-500/35 dark:bg-rose-950/90 dark:text-rose-100",
          icon: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
          message: "text-rose-900/75 dark:text-rose-100/75",
          requestId: "text-rose-900/55 dark:text-rose-100/50",
        }
      : issue.kind === "maintenance"
        ? {
            container:
              "border-amber-300/70 bg-amber-50/95 text-amber-950 dark:border-amber-500/25 dark:bg-slate-900/96 dark:text-amber-100",
            icon: "bg-amber-400/20 text-amber-700 dark:text-amber-300",
            message: "text-amber-900/75 dark:text-amber-100/70",
            requestId: "text-amber-900/55 dark:text-amber-100/45",
          }
      : issue.kind === "offline"
        ? {
            container:
              "border-amber-300/70 bg-amber-50/95 text-amber-950 dark:border-amber-500/25 dark:bg-slate-900/96 dark:text-amber-100",
            icon: "bg-amber-400/20 text-amber-700 dark:text-amber-300",
            message: "text-amber-900/75 dark:text-amber-100/70",
            requestId: "text-amber-900/55 dark:text-amber-100/45",
          }
        : {
            container:
              "border-sky-300/70 bg-sky-50/95 text-sky-950 dark:border-sky-500/30 dark:bg-sky-950/90 dark:text-sky-100",
            icon: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
            message: "text-sky-900/75 dark:text-sky-100/75",
            requestId: "text-sky-900/55 dark:text-sky-100/50",
          };

  return (
    <section
      role="alert"
      aria-live="assertive"
      className={`fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[120] mx-auto flex max-w-xl items-start gap-3 rounded-[var(--radius-xl)] border p-4 shadow-[0_18px_50px_rgba(15,23,42,0.22)] backdrop-blur-md ${tone.container}`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${tone.icon}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold">{issue.title}</h2>
        <p className={`mt-1 text-xs leading-5 ${tone.message}`}>
          {issue.message}
        </p>
        {issue.requestId || issue.traceId ? (
          <p className={`mt-2 font-mono text-[0.65rem] ${tone.requestId}`}>
            ID bantuan: {issue.requestId ?? issue.traceId}
          </p>
        ) : null}
      </div>
    </section>
  );
}
