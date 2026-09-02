"use client";

import type {
  ApiUserRole,
  AuthSession,
  AuthUser,
  DashboardRole,
} from "@/types/auth";

const AUTH_STORAGE_KEY = "absensi-cn-auth";
const AUTH_SESSION_EVENT = "absensi-cn-auth-change";
const AUTH_SECURITY_NOTICE_EVENT = "absensi-cn-auth-security-notice";
let cachedSessionRaw: string | null = null;
let cachedSessionValue: AuthSession | null = null;

function getAvailableStorages() {
  if (typeof window === "undefined") return [] as Storage[];

  const storages: Storage[] = [];
  for (const storageName of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = window[storageName];
      if (storage && !storages.includes(storage)) storages.push(storage);
    } catch {
      // Some privacy modes expose storage but throw on access.
    }
  }
  return storages;
}

function emitAuthSessionChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  const serializedSession = JSON.stringify(session);
  const storage = getAvailableStorages().find((candidate) => {
    try {
      candidate.setItem(AUTH_STORAGE_KEY, serializedSession);
      return true;
    } catch {
      return false;
    }
  });

  if (!storage) {
    throw new Error(
      "Browser tidak dapat menyimpan sesi login. Izinkan penyimpanan situs lalu coba lagi.",
    );
  }

  cachedSessionRaw = serializedSession;
  cachedSessionValue = session;
  emitAuthSessionChange();
}

export type AuthSecurityNotice = {
  kind: "password_reset";
  resetBy?: string;
  resetAt?: string;
  loginPath: string;
};

export function publishAuthSecurityNotice(notice: AuthSecurityNotice) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AuthSecurityNotice>(AUTH_SECURITY_NOTICE_EVENT, {
      detail: notice,
    }),
  );
}

export function subscribeAuthSecurityNotice(
  onNotice: (notice: AuthSecurityNotice) => void,
) {
  if (typeof window === "undefined") return () => {};

  const handleNotice = (event: Event) => {
    const notice = (event as CustomEvent<AuthSecurityNotice>).detail;
    if (notice) onNotice(notice);
  };

  window.addEventListener(AUTH_SECURITY_NOTICE_EVENT, handleNotice);
  return () =>
    window.removeEventListener(AUTH_SECURITY_NOTICE_EVENT, handleNotice);
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  let rawSession: string | null = null;
  for (const storage of getAvailableStorages()) {
    try {
      rawSession = storage.getItem(AUTH_STORAGE_KEY);
      if (rawSession) break;
    } catch {
      // Try the next available storage.
    }
  }
  if (!rawSession) {
    cachedSessionRaw = null;
    cachedSessionValue = null;
    return null;
  }

  if (rawSession === cachedSessionRaw) {
    return cachedSessionValue;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as AuthSession;
    cachedSessionRaw = rawSession;
    cachedSessionValue = parsedSession;
    return parsedSession;
  } catch {
    cachedSessionRaw = null;
    cachedSessionValue = null;
    for (const storage of getAvailableStorages()) {
      try {
        storage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
    }
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  for (const storage of getAvailableStorages()) {
    try {
      storage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }
  cachedSessionRaw = null;
  cachedSessionValue = null;
  emitAuthSessionChange();
}

export function subscribeAuthSession(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUTH_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_SESSION_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_SESSION_EVENT, onStoreChange);
  };
}

export function getDefaultDashboardRole(user: AuthUser): DashboardRole {
  switch (user.role) {
    case "STUDENT":
      return "siswa";
    case "TEACHER":
      return user.has_bk_scope ? "bk" : "walas";
    case "ADMIN":
      return "admin";
  }
}

export function requiresInitialPasswordChange(user: AuthUser) {
  return (
    (user.role === "STUDENT" || user.role === "TEACHER") &&
    user.must_change_password
  );
}

export function getDashboardPathForUser(user: AuthUser) {
  if (requiresInitialPasswordChange(user)) {
    return "/auth/change-password";
  }
  if (user.role === "TEACHER") {
    return "/dashboard/teacher";
  }
  if (user.role === "STUDENT") {
    return "/dashboard/student";
  }
  const dashboardRole = getDefaultDashboardRole(user);
  return `/dashboard/${dashboardRole}`;
}

export function getLoginPathForUser(user?: AuthUser | null) {
  return user?.role === "STUDENT" ? "/login/student" : "/login/staff";
}

export function getLoginPathForCurrentContext(pathname?: string) {
  const session = getAuthSession();
  if (session) {
    return getLoginPathForUser(session.user);
  }

  const currentPath =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  if (
    currentPath.startsWith("/dashboard/admin") ||
    currentPath.startsWith("/dashboard/teacher") ||
    currentPath.startsWith("/dashboard/bk") ||
    currentPath.startsWith("/dashboard/walas") ||
    currentPath.startsWith("/login/staff")
  ) {
    return "/login/staff";
  }
  return "/login/student";
}

export function canAccessDashboardRole(
  user: AuthUser,
  dashboardRole: DashboardRole,
) {
  switch (dashboardRole) {
    case "siswa":
      return user.role === "STUDENT";
    case "admin":
      return user.role === "ADMIN";
    case "walas":
      return user.role === "TEACHER";
    case "bk":
      return user.role === "TEACHER" && user.has_bk_scope;
  }
}

export function getDashboardLabel(role: ApiUserRole) {
  switch (role) {
    case "STUDENT":
      return "Siswa";
    case "TEACHER":
      return "Guru";
    case "ADMIN":
      return "Admin";
  }
}
