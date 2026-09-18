import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const developmentProxyTarget =
    environment.VITE_DEV_PROXY_TARGET ?? "http://localhost:8080";

  return {
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
      rolldownOptions: {
        output: {
          // Default splitting emitted 62 chunks under 1 KB (mostly one file per
          // Lucide icon, the smallest being 124 bytes). Each of those still costs
          // a full HTTP request whose headers dwarf the payload, which is the
          // expensive part on high-latency mobile connections. Merging them into
          // their consumers trades a little duplication for far fewer requests.
          codeSplitting: {
            groups: [
              {
                name: "lucide-icons",
                test: /node_modules[\\/]lucide-react[\\/]/,
              },
            ],
          },
        },
      },
    },
    server: {
      proxy: {
        "/api": {
          target: developmentProxyTarget,
          changeOrigin: true,
          secure: true,
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
  };
});
