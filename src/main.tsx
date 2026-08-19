import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AppProviders } from "@/providers/app-providers";
import { AppErrorBoundary } from "@/components/errors/app-error-boundary";
import { applyRenderMode } from "@/lib/runtime-compatibility";

declare global {
  interface Window {
    __absensiAppReady?: boolean;
    __absensiInitialLoaderTimeout?: number;
    __absensiReloadFresh?: () => void;
  }
}

applyRenderMode();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
);
