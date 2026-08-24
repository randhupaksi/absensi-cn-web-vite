import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

const CHUNK_RELOAD_PREFIX = "absensi-cn:chunk-reload";

function reloadFreshDocument() {
  if (typeof window === "undefined") return;

  try {
    // A plain reload can reuse a cached index.html on some mobile browsers.
    // Add a harmless one-time query value so the browser asks the server for
    // the current document, which in turn references the current hashed chunks.
    const url = new URL(window.location.href);
    url.searchParams.set("__app_reload", String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRecoverableChunkError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return [
    "failed to fetch dynamically imported module",
    "importing a module script failed",
    "loading chunk",
    "chunkloaderror",
    "unable to preload css",
  ].some((fragment) => message.includes(fragment));
}

function tryReloadStaleChunkOnce() {
  if (typeof window === "undefined") return false;

  try {
    const retryKey = `${CHUNK_RELOAD_PREFIX}:${window.location.pathname}`;
    if (window.sessionStorage.getItem(retryKey)) return false;

    window.sessionStorage.setItem(retryKey, "1");
    reloadFreshDocument();
    return true;
  } catch {
    return false;
  }
}

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

type StaleCacheErrorOverlayProps = {
  onRetry: () => void;
};

export function StaleCacheErrorOverlay({
  onRetry,
}: StaleCacheErrorOverlayProps) {
  return (
    <main className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/12 p-5 backdrop-blur-[2px] supports-[min-height:100dvh]:min-h-[100dvh] dark:bg-slate-950/35">
      <section
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-md rounded-[2rem] border border-emerald-200/80 bg-white/96 p-6 text-center text-slate-900 shadow-[0_28px_72px_rgba(15,23,42,0.2)] dark:border-emerald-300/35 dark:bg-slate-900/96 dark:text-slate-100 dark:shadow-[0_28px_72px_rgba(0,0,0,0.35)] sm:p-8"
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-300/70 dark:bg-amber-950/70 dark:text-amber-300 dark:ring-amber-400/20">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-heading text-xl font-semibold text-slate-950 dark:text-white">
          Halaman belum berhasil dimuat
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Koneksi atau cache browser mungkin masih memakai file aplikasi yang
          lama. Muat ulang halaman untuk mencoba kembali.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.98]"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Muat ulang halaman
        </button>
      </section>
    </main>
  );
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    if (isRecoverableChunkError(error)) {
      tryReloadStaleChunkOnce();
    }
  }

  private handleRetry = () => {
    if (typeof window === "undefined") return;

    try {
      window.sessionStorage.removeItem(
        `${CHUNK_RELOAD_PREFIX}:${window.location.pathname}`,
      );
    } catch {
      // Storage can be disabled by privacy settings. Reload still remains safe.
    }

    reloadFreshDocument();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return <StaleCacheErrorOverlay onRetry={this.handleRetry} />;
  }
}
