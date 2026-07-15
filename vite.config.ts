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
    // Target modern browsers — avoids legacy polyfills
    target: "es2020",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;

          // React core — use path-boundary match to avoid catching react-router, react-dom, react-icons
          if (id.includes("/react-dom/")) return "vendor-react";
          if (id.includes("/react/") && !id.includes("react-router") && !id.includes("react-hook") && !id.includes("react-icons") && !id.includes("react-day")) return "vendor-react";

          // React Router v7 — the actual impl lives in `react-router` (not just react-router-dom)
          if (id.includes("react-router") || id.includes("@remix-run")) return "vendor-router";

          // TanStack
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("@tanstack/react-table")) return "vendor-table";

          // Motion
          if (id.includes("/motion/")) return "vendor-motion";

          // Forms
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("/zod/")) return "vendor-forms";

          // UI primitives — @base-ui + @radix-ui + @floating-ui (positioning engine used by @base-ui popover)
          if (id.includes("@base-ui") || id.includes("@radix-ui") || id.includes("@floating-ui")) return "vendor-ui";

          // Utilities
          if (id.includes("clsx") || id.includes("class-variance-authority") || id.includes("tailwind-merge") || id.includes("react-icons") || id.includes("/cmdk/")) return "vendor-utils";

          // HTTP client — own chunk so axios version bump doesn't bust app code cache
          if (id.includes("/axios/")) return "vendor-http";

          // Notifications
          if (id.includes("/sonner/")) return "vendor-sonner";

          // Date utilities + calendar
          if (id.includes("/date-fns/") || id.includes("react-day-picker")) return "vendor-date";

          // Charts (recharts + its d3 deps)
          if (id.includes("/recharts/") || id.includes("d3-") || id.includes("victory-")) return "vendor-charts";
        },
      },
    },
  },
});
