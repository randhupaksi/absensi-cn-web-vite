import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AppProviders } from "@/providers/app-providers";

declare global {
  interface Window {
    __absensiAppReady?: boolean;
    __absensiInitialLoaderTimeout?: number;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
