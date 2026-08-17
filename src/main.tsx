import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AppProviders } from "@/providers/app-providers";
import { AppErrorBoundary } from "@/components/errors/app-error-boundary";

declare global {
  interface Window {
    __absensiAppReady?: boolean;
    __absensiInitialLoaderTimeout?: number;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
);
