import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSession, AuthUser } from "@/types/auth";

const student: AuthUser = {
  id: "student-test",
  name: "Siswa Test",
  role: "STUDENT",
  portal: "student",
  has_bk_scope: false,
  must_change_password: false,
  nis: "TEST-001",
};

const admin: AuthUser = {
  id: "admin-test",
  name: "Admin Test",
  role: "ADMIN",
  portal: "staff",
  has_bk_scope: false,
  must_change_password: false,
  username: "admin-test",
};

async function loadAuthModule() {
  vi.resetModules();
  return import("@/lib/auth");
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("auth session storage", () => {
  it("stores, reads, and clears an authentication session", async () => {
    const auth = await loadAuthModule();
    const session: AuthSession = { accessToken: "test-token", user: student };

    auth.saveAuthSession(session);
    expect(auth.getAuthSession()).toEqual(session);
    expect(window.localStorage.getItem("absensi-cn-auth")).toBe(JSON.stringify(session));
    expect(window.sessionStorage.getItem("absensi-cn-auth")).toBeNull();

    auth.clearAuthSession();
    expect(auth.getAuthSession()).toBeNull();
    expect(window.localStorage.getItem("absensi-cn-auth")).toBeNull();
    expect(window.sessionStorage.getItem("absensi-cn-auth")).toBeNull();
  });

  it("falls back to sessionStorage when localStorage cannot be written", async () => {
    const originalLocalStorage = Object.getOwnPropertyDescriptor(
      window,
      "localStorage",
    );
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        get length() {
          return 0;
        },
        clear() {},
        getItem() {
          return null;
        },
        key() {
          return null;
        },
        removeItem() {},
        setItem() {
          throw new DOMException("Storage unavailable", "QuotaExceededError");
        },
      } satisfies Storage,
    });
    const auth = await loadAuthModule();
    const session: AuthSession = { accessToken: "test-token", user: student };

    try {
      auth.saveAuthSession(session);

      expect(auth.getAuthSession()).toEqual(session);
      expect(window.localStorage.getItem("absensi-cn-auth")).toBeNull();
      expect(window.sessionStorage.getItem("absensi-cn-auth")).toBe(JSON.stringify(session));
    } finally {
      if (originalLocalStorage) {
        Object.defineProperty(window, "localStorage", originalLocalStorage);
      }
    }
  });

  it("removes malformed persisted sessions", async () => {
    window.localStorage.setItem("absensi-cn-auth", "not-json");
    const auth = await loadAuthModule();

    expect(auth.getAuthSession()).toBeNull();
    expect(window.localStorage.getItem("absensi-cn-auth")).toBeNull();
  });

});

describe("dashboard authorization helpers", () => {
  it("maps users to their expected dashboards", async () => {
    const auth = await loadAuthModule();

    expect(auth.getDashboardPathForUser(student)).toBe("/dashboard/student");
    expect(auth.getDashboardPathForUser(admin)).toBe("/dashboard/admin");
  });

  it("does not grant admin dashboard access to students", async () => {
    const auth = await loadAuthModule();

    expect(auth.canAccessDashboardRole(admin, "admin")).toBe(true);
    expect(auth.canAccessDashboardRole(student, "admin")).toBe(false);
  });
});
