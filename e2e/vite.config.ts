import { defineConfig, mergeConfig } from "vite";
import applicationConfig from "../vite.config.ts";

// Keep the application's plugins/build settings. Never load deploy environment
// values into this bundle, and never forward a missed mock to a real API.
export default defineConfig((environment) => {
  const config = mergeConfig(applicationConfig(environment), {
    envDir: false,
    define: { "import.meta.env.VITE_API_BASE_URL": JSON.stringify("/api/v1") },
    build: { outDir: ".e2e-dist" },
  });
  config.server = { ...config.server, proxy: {} };
  config.preview = { host: "127.0.0.1", port: 4173, strictPort: true, proxy: {} };
  return config;
});
