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

  it("shows a short in-progress wait without automatically replaying login", async () => {
    const post = vi.spyOn(apiClient, "post").mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 429,
        data: { code: "LOGIN_IN_PROGRESS", message: "wait" },
        headers: { "retry-after": "1" },
      },
    });

    await expect(
      login({ portal: "student", nis: "12345678", password: "wrong" }),
    ).rejects.toMatchObject({
      kind: "in_progress",
      retryAfterSeconds: 1,
    });
    expect(post).toHaveBeenCalledTimes(1);
  });
});
