import {
  getCurrentSystemIssue,
  subscribeToSystemStatus,
  type SystemIssue,
} from "@/lib/system-status-events";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function SystemStatusAlert() {
  const [issue, setIssue] = useState<SystemIssue | null>(getCurrentSystemIssue);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [remainingSeconds, setRemainingSeconds] = useState(20);

  useEffect(() => subscribeToSystemStatus(setIssue), []);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setIssue({
        kind: "offline",
        title: "Koneksi internet terputus",
        message: "Sambungkan kembali perangkat ke internet untuk melanjutkan.",
      });
    };
    const handleOnline = () => {
      setIsOnline(true);
      setIssue((current) => (current?.kind === "offline" ? null : current));
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const activeIssue: SystemIssue | null = isOnline
    ? issue
    : {
        kind: "offline",
        title: "Koneksi internet terputus",
        message: "Sambungkan kembali perangkat ke internet untuk melanjutkan.",
      };
  const isServerIssue =
    isOnline &&
    activeIssue?.isServerOutage === true;

  useEffect(() => {
    if (!isServerIssue) return;
    setRemainingSeconds(20);
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [isServerIssue, activeIssue?.kind]);

  if (!activeIssue) return null;

  const Icon = activeIssue.kind === "offline" ? WifiOff : AlertTriangle;
  const tone =
    activeIssue.kind === "unavailable"
      ? {
          container:
            "border-rose-300/70 bg-rose-50/95 text-rose-950 dark:border-rose-500/35 dark:bg-rose-950/90 dark:text-rose-100",
          icon: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
          message: "text-rose-900/75 dark:text-rose-100/75",
          requestId: "text-rose-900/55 dark:text-rose-100/50",
        }
      : activeIssue.kind === "maintenance"
        ? {
            container:
              "border-amber-300/70 bg-amber-50/95 text-amber-950 dark:border-amber-500/25 dark:bg-slate-900/96 dark:text-amber-100",
            icon: "bg-amber-400/20 text-amber-700 dark:text-amber-300",
            message: "text-amber-900/75 dark:text-amber-100/70",
            requestId: "text-amber-900/55 dark:text-amber-100/45",
          }
      : activeIssue.kind === "offline"
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
    <>
      <Dialog open={isServerIssue} onOpenChange={() => undefined}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md rounded-[24px] border border-amber-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.2)] dark:border-amber-800/70 dark:bg-slate-900"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-slate-950 dark:text-white">
              <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <AlertTriangle className="size-5" />
              </span>
              Web sedang update versi terbaru
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Sistem sedang update ke versi terbaru. Silakan coba lagi dalam{" "}
              {remainingSeconds > 0 ? `${remainingSeconds} detik` : "beberapa saat"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="success"
              disabled={remainingSeconds > 0}
              className="w-full rounded-xl sm:w-auto"
              onClick={() => window.location.reload()}
            >
              {remainingSeconds > 0
                ? `Coba lagi dalam ${remainingSeconds} detik`
                : "Coba lagi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isServerIssue ? null : <section
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
        <h2 className="text-sm font-semibold">{activeIssue.title}</h2>
        <p className={`mt-1 text-xs leading-5 ${tone.message}`}>
          {activeIssue.message}
        </p>
        {activeIssue.requestId || activeIssue.traceId ? (
          <p className={`mt-2 font-mono text-[0.65rem] ${tone.requestId}`}>
            ID bantuan: {activeIssue.requestId ?? activeIssue.traceId}
          </p>
        ) : null}
      </div>
    </section>}
    </>
  );
}
