import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

const CHUNK_RELOAD_PREFIX = "absensi-cn:chunk-reload";

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
    window.location.reload();
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

    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(167,243,208,0.36),transparent_34%),linear-gradient(180deg,#f8fbf8_0%,#eef7f1_100%)] p-5 supports-[min-height:100dvh]:min-h-[100dvh]">
        <section className="w-full max-w-md rounded-[2rem] border border-white/90 bg-white/92 p-6 text-center shadow-[0_28px_72px_rgba(15,23,42,0.13)] sm:p-8">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-heading text-xl font-semibold text-slate-950">
            Halaman belum berhasil dimuat
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Koneksi atau cache browser mungkin masih memakai file aplikasi yang
            lama. Muat ulang halaman untuk mencoba kembali.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.98]"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Muat ulang halaman
          </button>
        </section>
      </main>
    );
  }
}
