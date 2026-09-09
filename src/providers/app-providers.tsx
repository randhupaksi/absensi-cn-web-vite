"use client";

import {
  appCreditLongStatement,
  appCreditSummary,
  appCredits,
} from "@/lib/config/credits";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  lazy,
  ReactNode,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { getStoredTheme, subscribeToTheme, type AppTheme } from "@/lib/theme";

const SystemStatusAlert = lazy(() =>
  import("@/components/errors/system-status-alert").then((module) => ({
    default: module.SystemStatusAlert,
  })),
);

const Toaster = lazy(() =>
  import("sonner").then((module) => ({ default: module.Toaster })),
);

type AppProvidersProps = {
  children: ReactNode;
};

function ThemeAwareToaster() {
  const theme = useSyncExternalStore<AppTheme>(
    subscribeToTheme,
    getStoredTheme,
    () => "light",
  );

  return (
    <Toaster
      theme={theme}
      richColors
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          closeButton:
            "!text-red-600 hover:!bg-red-100 hover:!text-red-700 focus-visible:!ring-red-500/40 active:!bg-red-200 dark:!text-rose-300 dark:hover:!bg-rose-950/70 dark:hover:!text-rose-100 dark:active:!bg-rose-950",
        },
      }}
    />
  );
}

function DeferredSystemStatusAlert() {
  const [shouldMount, setShouldMount] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    if (shouldMount) return;
    const showAlert = () => setShouldMount(true);
    const handleSystemStatus = (event: Event) => {
      if ((event as CustomEvent).detail) showAlert();
    };
    window.addEventListener("absensi-cn:system-status", handleSystemStatus);
    window.addEventListener("offline", showAlert);
    return () => {
      window.removeEventListener(
        "absensi-cn:system-status",
        handleSystemStatus,
      );
      window.removeEventListener("offline", showAlert);
    };
  }, [shouldMount]);

  return shouldMount ? (
    <Suspense fallback={null}>
      <SystemStatusAlert />
    </Suspense>
  ) : null;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 15 * 60 * 1000,
            retry: 1,
            retryDelay: (attempt) =>
              Math.min(1_000 * 2 ** attempt, 8_000) + Math.random() * 1_500,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  useEffect(() => {
    // Dialogs/menus restore focus to their trigger button when they close
    // (for keyboard accessibility), which otherwise leaves a lingering focus
    // ring on the button even though the user just clicked it with a mouse.
    // Track the last input method on <body data-input-method> so CSS can
    // suppress that ring for pointer interactions while still showing it for
    // real keyboard (Tab) navigation.
    const setInputMethod = (method: "pointer" | "keyboard") => {
      if (document.body.dataset.inputMethod !== method) {
        document.body.dataset.inputMethod = method;
      }
    };
    const handlePointerDown = () => setInputMethod("pointer");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") setInputMethod("keyboard");
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  useEffect(() => {
    // Browser zoom emits a burst of viewport resize events. Temporarily pause
    // expensive visual effects while the viewport is settling so cards do not
    // repaint through several intermediate scales. The class is removed only
    // after resize activity has stopped, restoring the normal UI afterward.
    const root = document.documentElement;
    let settleTimer: number | undefined;

    const markViewportSettling = () => {
      root.classList.add("viewport-settling");
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        root.classList.remove("viewport-settling");
        settleTimer = undefined;
      }, 180);
    };

    window.addEventListener("resize", markViewportSettling, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", markViewportSettling, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", markViewportSettling);
      window.visualViewport?.removeEventListener(
        "resize",
        markViewportSettling,
      );
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      root.classList.remove("viewport-settling");
    };
  }, []);

  useEffect(() => {
    const watermarkKey = "__absensi_cn_credit_logged__";
    if (window[watermarkKey as keyof Window]) return;
    Object.defineProperty(window, watermarkKey, {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    });
    Object.defineProperty(window, "__ABSENSI_CN_CREDIT__", {
      value: {
        project: appCredits.project,
        team: appCredits.team,
        leadCreator: appCredits.leadCreator,
        leadCreatorRole: appCredits.leadCreatorFullRole,
        contributors: appCredits.contributors,
        copyright: appCredits.copyright,
        statement: appCreditLongStatement,
      },
      configurable: false,
      enumerable: false,
      writable: false,
    });

    console.info(
      `%c${appCredits.project} by ${appCredits.team}`,
      "color:#059669;font-size:14px;font-weight:800;",
    );
    console.info(
      `%cLead: ${appCreditSummary}. ${appCreditLongStatement}`,
      "color:#64748b;font-size:11px;font-weight:600;",
    );
    console.info(
      `%c${appCredits.copyright}`,
      "color:#64748b;font-size:11px;font-weight:600;",
    );
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <DeferredSystemStatusAlert />
      <Suspense fallback={null}>
        <ThemeAwareToaster />
      </Suspense>
    </QueryClientProvider>
  );
}
