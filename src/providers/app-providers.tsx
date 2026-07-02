"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { appCreditLongStatement, appCreditSummary, appCredits } from "@/lib/config/credits";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { Toaster } from "sonner";

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
            gcTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

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
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
