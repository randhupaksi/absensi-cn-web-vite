import { test as base, expect, type Request, type Route, type Page } from "@playwright/test";
import type { AuthSession } from "../src/types/auth";
import { defaultReads, NOW } from "./fixtures";

export const ORIGIN = "http://127.0.0.1:4173";
type Handler = (route: Route, request: Request) => Promise<void>;
export type ApiCall = { method: string; path: string; url: string; body: string | null; authorization?: string };

export class MockApi {
  readonly reads = defaultReads();
  readonly calls: ApiCall[] = [];
  readonly unexpected: string[] = [];
  readonly blocked: string[] = [];
  private handlers = new Map<string, Handler>();

  on(method: string, path: string, handler: Handler) { this.handlers.set(`${method} ${path}`, handler); }
  data(method: string, path: string, data: unknown, status = 200) {
    this.on(method, path, (route) => json(route, data, status));
  }
  error(method: string, path: string, status = 400, message = "Permintaan sintetis gagal", code = "VALIDATION_FAILED", headers: Record<string, string> = {}) {
    this.on(method, path, (route) => route.fulfill({ status, headers, json: { success: false, message, code } }));
  }
  count(method: string, path: string) { return this.calls.filter((call) => call.method === method && call.path === path).length; }
  last(method: string, path: string) { return this.calls.filter((call) => call.method === method && call.path === path).at(-1); }
  async handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== ORIGIN) {
      this.blocked.push(`${request.method()} ${url.origin}${url.pathname}`);
      return route.abort("blockedbyclient");
    }
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) {
      const path = url.pathname.replace(/^\/api\/v1/, "");
      this.calls.push({ method: request.method(), path, url: url.toString(), body: request.postData(), authorization: request.headers().authorization });
      // No test performs deletion, even on mocks. Explicitly flag accidental UI
      // clicks on a destructive action instead of silently returning success.
      if (request.method() === "DELETE") {
        this.unexpected.push(`Forbidden destructive request: DELETE ${path}`);
        return route.abort("blockedbyclient");
      }
      const handler = this.handlers.get(`${request.method()} ${path}`);
      if (handler) return handler(route, request);
      if (request.method() === "GET" && Object.hasOwn(this.reads, path)) return json(route, this.reads[path]);
      if (request.method() === "GET" && path === "/uploads/e2e/photo.png") {
        return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64") });
      }
      this.unexpected.push(`${request.method()} ${path}`);
      return route.fulfill({ status: 501, json: { success: false, code: "E2E_UNMOCKED", message: `Unmapped E2E endpoint: ${path}` } });
    }
    // Only static app requests can reach the local preview. Its proxy is off.
    return route.continue();
  }
}

export async function json(route: Route, data: unknown, status = 200) {
  await route.fulfill({ status, json: { success: true, message: "Respons sintetis", data } });
}

// Hold a response until the test explicitly releases it; no timing sleeps.
export function deferredResponse(api: MockApi, method: string, path: string, data: unknown) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  api.on(method, path, async (route) => { await gate; await json(route, data); });
  return release;
}

export const test = base.extend<{ api: MockApi; signedIn: (session: AuthSession) => Promise<void>; isolation: void }>({
  // Playwright requires destructuring even when this fixture has no dependencies.
  // oxlint-disable-next-line no-empty-pattern
  api: async ({}, provide) => { await provide(new MockApi()); },
  isolation: [async ({ context, api }, provide, testInfo) => {
    const pageErrors: string[] = [];
    const failedRequests: { path: string; error: string | undefined }[] = [];
    context.on("requestfailed", (request) => failedRequests.push({ path: new URL(request.url()).pathname, error: request.failure()?.errorText }));
    context.on("page", (page) => page.on("pageerror", (error) => pageErrors.push(error.message)));
    await context.route("**/*", (route) => api.handle(route));
    await context.routeWebSocket("**/*", (socket) => { api.blocked.push(`WebSocket ${socket.url()}`); socket.close(); });
    await context.addInitScript(() => {
      // Deny device access by default. Individual camera tests replace this with
      // a canvas stream; the physical camera/microphone are never consulted.
      if (!(window as unknown as { e2eDevicesConfigured?: boolean }).e2eDevicesConfigured && navigator.mediaDevices) Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => { throw new DOMException("Synthetic permission denial", "NotAllowedError"); },
      });
      if (!(window as unknown as { e2eDevicesConfigured?: boolean }).e2eDevicesConfigured) Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (_success: unknown, failure: (error: unknown) => void) => failure({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "Synthetic permission denial" }),
          watchPosition: () => 0, clearWatch: () => {},
        },
      });
    });
    await provide();
    await testInfo.attach("mock-network-audit", {
      body: JSON.stringify({ calls: api.calls.map(({ method, path }) => ({ method, path })), blocked: api.blocked, unexpected: api.unexpected, failedRequests }, null, 2), contentType: "application/json",
    });
    expect(api.unexpected, "Every API request must have an explicit mock; no DELETE is allowed").toEqual([]);
    expect(pageErrors, "Uncaught application errors").toEqual([]);
  }, { auto: true }],
  page: async ({ page }, provide) => { await page.clock.setFixedTime(new Date(NOW)); await provide(page); },
  signedIn: async ({ context }, provide) => {
    await provide(async (session) => {
      // A one-time initial session, not a perpetual reinjection on logout/401.
      await context.addInitScript((value) => {
        if (location.origin !== "http://127.0.0.1:4173" || sessionStorage.getItem("e2e-session-initialized")) return;
        sessionStorage.setItem("e2e-session-initialized", "yes");
        sessionStorage.setItem("absensi-cn-auth", JSON.stringify(value));
      }, session);
    });
  },
});
export { expect };

export async function syntheticCamera(page: Page, location: "captured" | "denied" | "unavailable" = "captured") {
  await page.addInitScript((locationMode) => {
    (window as unknown as { e2eDevicesConfigured: boolean }).e2eDevicesConfigured = true;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 320; canvas.height = 240;
        const draw = () => {
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#16876b"; ctx.fillRect(0, 0, 320, 240);
          ctx.fillStyle = "#ffffff"; ctx.font = "24px sans-serif"; ctx.fillText("SYNTHETIC E2E", 45, 125);
        };
        draw();
        const stream = canvas.captureStream(10);
        const timer = setInterval(draw, 100);
        const track = stream.getVideoTracks()[0];
        const originalStop = track.stop.bind(track);
        track.stop = () => { clearInterval(timer); originalStop(); };
        return stream;
      },
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: (value: unknown) => void, failure: (error: unknown) => void) => {
          if (locationMode === "captured") success({ coords: { latitude: 0, longitude: 0, accuracy: 5 }, timestamp: Date.now() });
          else failure({ code: locationMode === "denied" ? 1 : 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "Synthetic location failure" });
        },
        watchPosition: () => 0, clearWatch: () => {},
      },
    });
  }, location);
}

export async function capturePhoto(page: Page) {
  await page.getByRole("button", { name: "Absen Hari Ini", exact: true }).click();
  await page.getByRole("button", { name: "Ambil Foto", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Foto Absensi Siswa", exact: true })).toBeVisible();
}
