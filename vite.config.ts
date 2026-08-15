import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    // Target modern browsers so Vite can avoid legacy transforms and polyfills.
    target: "es2020",
    chunkSizeWarningLimit: 600,
  },
  server: {
    proxy: {
      "/api": {
        target: "https://absensmk.citranegara.online",
        changeOrigin: true,
        // Development-only proxy: tolerate an upstream certificate chain that
        // Node does not trust even when the browser accepts the site.
        secure: false,
        headers: {
          origin: "https://absensmk.citranegara.online",
        },
        configure(proxy) {
          proxy.on("error", (error, request) => {
            console.error(
              `[vite proxy] ${request.method} ${request.url}: ${error.message}`,
            );
          });
        },
      },
    },
  },
});
