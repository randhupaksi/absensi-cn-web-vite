import { execFileSync } from "node:child_process";
import { build, preview } from "vite";

export default async function setup() {
  // Keep the server in the runner process so cleanup also works on Windows,
  // without shell process trees or taskkill. Only the isolated bundle is served.
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "-b", "--pretty", "false"], { stdio: "inherit" });
  console.log("Building the isolated E2E bundle...");
  await build({ configFile: "e2e/vite.config.ts", logLevel: "warn" });
  const server = await preview({ configFile: "e2e/vite.config.ts" });
  return async () => {
    await new Promise<void>((resolve, reject) => {
      server.httpServer.close((error) => error ? reject(error) : resolve());
      if ("closeAllConnections" in server.httpServer) server.httpServer.closeAllConnections();
    });
  };
}
