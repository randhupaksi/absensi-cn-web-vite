import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      // Keep modern browsers fast while serving a compatible fallback to
      // older Android/Samsung Internet and iOS browser engines.
      targets: ["Android >= 7", "Samsung >= 8", "iOS >= 12", "defaults"],
      modernPolyfills: true,
    }),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
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
