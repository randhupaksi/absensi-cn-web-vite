"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { appCreditLongStatement, appCreditSummary, appCredits } from "@/lib/config/credits";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, ReactNode, Suspense, useEffect, useState } from "react";

const Toaster = lazy(() => import("sonner").then((module) => ({ default: module.Toaster })));

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 15 * 60 * 1000,
            retry: 1,
            retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000) + Math.random() * 1_500,
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
      <TooltipProvider delay={100}>
        {children}
        <Suspense fallback={null}>
          <Toaster richColors position="top-right" />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
