import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/api/client";
import { login } from "@/services/auth.service";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("login throttling response", () => {
  it("surfaces the progressive cooldown and server retry time", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { code: "LOGIN_THROTTLED", message: "wait" },
        headers: { "retry-after": "2" },
      },
    });

    await expect(
      login({ portal: "student", nis: "12345678", password: "wrong" }),
    ).rejects.toMatchObject({
      kind: "throttled",
      retryAfterSeconds: 2,
    });
  });

  it("continues to understand the previous API code during rolling deploys", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { code: "LOGIN_LOCKED", message: "wait" },
        headers: { "retry-after": "30" },
      },
    });

    await expect(
      login({ portal: "student", nis: "12345678", password: "wrong" }),
    ).rejects.toMatchObject({
      kind: "throttled",
      retryAfterSeconds: 30,
    });
  });
});
